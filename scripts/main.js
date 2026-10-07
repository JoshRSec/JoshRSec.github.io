/* ==========================================================================
   1. State
   ========================================================================== */
const app = document.querySelector("#app");
const container = document.querySelector(".container");
const reopenButton = document.querySelector("#reopen");
const delay = ms => new Promise(res => setTimeout(res, ms));
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const HOME = ["home", "Josh"];
const ROOT_HOME = ["root"];
const home = () => (state.isRoot ? ROOT_HOME : HOME);
const bootTime = Date.now();

const state = {
  cwd: [...HOME],
  history: [],
  histIndex: 0,
  isRoot: false,
  busy: false,
  closed: false,
};

// Elements belonging to the live prompt
let input = null;
let mirror = null;
let completions = null;


/* ==========================================================================
   2. Fake filesystem
   ========================================================================== */
const link = (href, icon, label) =>
  `<a href='${href}' target='_blank' rel='noopener'><i class='${icon} white'></i> ${label}</a>`;

const LINKS = {
  blog: link("https://blog.joshuarobbins.tech", "fab fa-wordpress", "blog.joshuarobbins.tech"),
  github: link("https://github.com/JoshRSec", "fab fa-github", "github.com/JoshRSec"),
  linkedin: link("https://www.linkedin.com/in/joshua-robbins-335152123/", "fab fa-linkedin", "linkedin.com/in/joshua-robbins-335152123/"),
  twitter: link("https://twitter.com/Piv0tSec", "fab fa-twitter", "twitter.com/Piv0tSec/"),
  tryhackme: link("https://tryhackme.com/p/piv0t", "fa fa-user-secret", "tryhackme.com/p/piv0t/"),
  credly: link("https://www.credly.com/users/joshua-robbins.34758ae2/badges", "fa fa-certificate", "credly.com/users/joshua-robbins.34758ae2/badges/"),
};

const BIO = [
  "My name is Joshua Robbins, I currently work as a Senior Security Analyst.",
  "I am passionate about CyberSec, keeping up with new trends and completing CTFs.",
  "Having graduated with a BSc in Computer Science, I also have experience as an infrastructure engineer.",
];

// File lines are static, author-defined HTML - never user input
const dir = (children, opts = {}) => ({ type: "dir", children, ...opts });
const file = lines => ({ type: "file", lines });

const fs = dir({
  bin: dir({}),
  etc: dir({ hostname: file(["Robbins"]) }),
  home: dir({
    Josh: dir({
      "about.txt": file(BIO),
      "certs.txt": file([LINKS.credly]),
      projects: dir({
        "blog.txt": file([LINKS.blog]),
        "github.txt": file([LINKS.github]),
      }),
      social: dir({
        "linkedin.txt": file([LINKS.linkedin]),
        "twitter.txt": file([LINKS.twitter]),
        "tryhackme.txt": file([LINKS.tryhackme]),
      }),
      ".flag.txt": file(["THM{y0u_f0und_th3_h1dd3n_fl4g}"]),
      ".zshrc": file([
        "# ~/.zshrc file for zsh interactive shells.",
        "# nothing to see here... unless you try: sudo -s",
      ]),
    }),
  }),
  root: dir({
    "root.txt": file(["THM{r00t3d_th3_p0rtf0l10}"]),
    ".zshrc": file([
      "# ~/.zshrc file for zsh interactive shells.",
      "# with great power comes great responsibility.",
    ]),
  }, { restricted: true }),
  tmp: dir({}),
  usr: dir({}),
  var: dir({}),
});

function resolvePath(path = "") {
  let parts;
  if (path.startsWith("/")) {
    parts = [];
  } else if (path === "~" || path.startsWith("~/")) {
    parts = [...home()];
    path = path.slice(1);
  } else {
    parts = [...state.cwd];
  }
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts;
}

function getNode(parts) {
  let node = fs;
  for (const seg of parts) {
    if (node.type !== "dir" || !has(node.children, seg)) return null;
    node = node.children[seg];
  }
  return node;
}

function isDenied(parts) {
  if (state.isRoot) return false;
  let node = fs;
  for (const seg of parts) {
    if (node.restricted) return true;
    if (node.type !== "dir" || !has(node.children, seg)) return false;
    node = node.children[seg];
  }
  return !!node.restricted;
}

function listDir(node, showHidden) {
  return Object.keys(node.children)
    .filter(name => showHidden || !name.startsWith("."))
    .sort();
}

function displayPath(parts) {
  const homeDir = home();
  const inHome = homeDir.every((seg, i) => parts[i] === seg);
  if (inHome) return "~" + parts.slice(homeDir.length).map(seg => "/" + seg).join("");
  return "/" + parts.join("/");
}


/* ==========================================================================
   3. Prompt rendering
   ========================================================================== */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function promptHeader() {
  const line = el("div", "prompt-line");
  line.append(
    el("span", "frame", "┌──("),
    el("span", "user", state.isRoot ? "root㉿Robbins" : "Joshua㉿Robbins"),
    el("span", "frame", ")-["),
    el("span", "cwd", displayPath(state.cwd)),
    el("span", "frame", "]"),
  );
  return line;
}

function promptSymbol() {
  const span = el("span");
  span.append(el("span", "frame", "└─"), el("span", "sym", state.isRoot ? "#" : "$"), " ");
  return span;
}

function isKnown(word) {
  return has(commands, word.toLowerCase());
}

// zsh-syntax-highlighting: first word green if it's a command, red if not
function renderCommand(target, value, cursorPos) {
  target.textContent = "";
  const match = value.match(/^(\s*)(\S*)/);
  const start = match[1].length;
  const end = start + match[2].length;
  const cmdClass = match[2] ? (isKnown(match[2]) ? "hl-ok" : "hl-bad") : "";

  const segs = [];
  const push = (text, cls) => {
    const last = segs[segs.length - 1];
    if (last && last.cls === cls) last.text += text;
    else segs.push({ text, cls });
  };
  for (let i = 0; i < value.length; i++) {
    const cls = i >= start && i < end ? cmdClass : "";
    push(value[i], i === cursorPos ? `${cls} cursor-block` : cls);
  }
  if (cursorPos === value.length) push(" ", "cursor-block");

  for (const seg of segs) target.append(el("span", seg.cls.trim(), seg.text));
}

function printPromptHistory(value, suffix = "") {
  const wrap = el("section", "prompt" + (state.isRoot ? " root" : ""));
  const line = el("div", "prompt-line");
  const cmd = el("span", "cmd");
  renderCommand(cmd, value, null);
  line.append(promptSymbol(), cmd);
  if (suffix) line.append(suffix);
  wrap.append(promptHeader(), line);
  app.append(wrap);
}

function newPrompt(initial = "") {
  if (state.closed) return;
  const wrap = el("div", "prompt live" + (state.isRoot ? " root" : ""));
  const line = el("div", "prompt-line");
  mirror = el("span", "cmd");
  input = el("input");
  input.setAttribute("maxlength", "80");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("spellcheck", "false");
  input.setAttribute("aria-label", "Terminal input");
  input.value = initial;
  completions = el("div", "completions");

  line.append(promptSymbol(), mirror, input);
  wrap.append(promptHeader(), line, completions);
  app.append(wrap);

  input.addEventListener("input", syncMirror);
  input.addEventListener("keyup", syncMirror);
  input.addEventListener("focus", syncMirror);
  input.addEventListener("blur", () => setTimeout(syncMirror));

  state.histIndex = state.history.length;
  input.focus({ preventScroll: true });
  setCaretEnd();
  scrollBottom();
}

function syncMirror() {
  if (!input) return;
  const focused = document.activeElement === input;
  const pos = focused ? input.selectionStart ?? input.value.length : input.value.length;
  renderCommand(mirror, input.value, pos);
  input.closest(".prompt").classList.toggle("blurred", !focused);
}

function setCaretEnd() {
  const end = input.value.length;
  input.setSelectionRange(end, end);
  syncMirror();
}

function scrollBottom() {
  app.scrollTop = app.scrollHeight;
}


/* ==========================================================================
   4. Output helpers
   ========================================================================== */
function print(text, cls) {
  const p = el("p", cls, text);
  app.append(p);
  scrollBottom();
  return p;
}

// Only ever pass author-defined HTML here
function printHTML(html, cls) {
  const p = el("p", cls);
  p.innerHTML = html;
  app.append(p);
  scrollBottom();
  return p;
}

function createCode(code, text){
  const p = document.createElement("p");
  p.setAttribute("class", "code");
  p.innerHTML =
 `${code} <br/><span class='text'> ${text} </span>`;
  app.appendChild(p);
}

function createTypewriterText(text, id){
  const p = document.createElement("p");
  p.setAttribute("id", id)
  p.innerHTML = "";
  app.appendChild(p);
  typeWriter(text, id);
}

function typeWriter(txt,id,i=0) {
  let count = i;
  if (count < txt.length) {
    document.getElementById(id).innerHTML += txt.charAt(i);
    count++;
    setTimeout(() => typeWriter(txt,id,count), 50);
  }
}

// Mimics Kali's "Message from Kali developers" login banner
function printBanner(title, rows, footer) {
  print(`┏━(${title})`, "box");
  print("┃", "box");
  for (const [code, text] of rows) {
    const p = el("p", "box");
    p.append("┃ ", el("span", "box-code", code.padEnd(11)), el("span", "box-desc", text));
    app.append(p);
  }
  print("┃", "box");
  print(`┗━(${footer})`, "box");
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad2 = n => String(n).padStart(2, "0");

function timezone(d) {
  try {
    const part = new Intl.DateTimeFormat("en-GB", { timeZoneName: "short" })
      .formatToParts(d).find(p => p.type === "timeZoneName");
    return part ? part.value : "UTC";
  } catch {
    return "UTC";
  }
}


/* ==========================================================================
   5. Commands
   ========================================================================== */
const NEOFETCH_LOGO = `..............
            ..,;:ccc,.
          ......''';lxO.
.....''''..........,:ld;
           .';;;:::;,,.x,
      ..'''.            0Xxoc:,.  ...
  ....                ,ONkc;,;cokOdc',.
 .                   OMo           ':ddo.
                    dMc               :OO;
                    0M.                 .:o.
                    ;Wd
                     ;XO,
                       ,d0Odlc;,..
                           ..',;:cdOOd::,.
                                    .:d;.':;.
                                       'd,  .'
                                         ;l   ..
                                          .o
                                            c
                                            .'
                                             .`;

function listCommands() {
  for (const [name, cmd] of Object.entries(commands)) {
    if (!cmd.hidden) createCode(cmd.usage || name, cmd.desc);
  }
  print("...and a few hidden ones. Try poking around with ls -a.", "dim");
}

function printLs(names, node) {
  const p = el("p", "ls");
  for (const name of names) {
    const child = name === "." || name === ".." ? { type: "dir" } : node.children[name];
    p.append(el("span", child.type === "dir" ? "ls-dir" : "", name));
  }
  app.append(p);
}

function printLsLong(names, node, parts) {
  const owner = parts[0] === "home" ? "Josh" : "root";
  const d = new Date();
  const stamp = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} 09:41`;
  print(`total ${names.length * 4}`);
  for (const name of names) {
    const child = name === "." || name === ".." ? { type: "dir" } : node.children[name];
    const isDir = child.type === "dir";
    const size = isDir ? 4096 : child.lines.join("\n").length;
    const p = el("p", "pre");
    p.append(
      `${isDir ? "drwxr-xr-x" : "-rw-r--r--"} ${isDir ? 2 : 1} ${owner} ${owner} ${String(size).padStart(4)} ${stamp} `,
      el("span", isDir ? "ls-dir" : "", name),
    );
    app.append(p);
  }
}

function treeLines(node, prefix, out) {
  const names = listDir(node, false);
  names.forEach((name, i) => {
    const last = i === names.length - 1;
    const child = node.children[name];
    out.push({ prefix: prefix + (last ? "└── " : "├── "), name, isDir: child.type === "dir" });
    if (child.type === "dir" && !(child.restricted && !state.isRoot)) {
      treeLines(child, prefix + (last ? "    " : "│   "), out);
    }
  });
}

async function printSlowly(lines, ms) {
  for (const line of lines) {
    print(line, "pre");
    await delay(ms);
  }
}

const commands = {
  projects: {
    desc: "Where to find my projects.",
    run() {
      printHTML(LINKS.blog);
      printHTML(LINKS.github);
    },
  },
  whoami: {
    desc: "What I do and who I am.",
    run() {
      BIO.forEach(line => print(line));
    },
  },
  social: {
    usage: "social -a",
    desc: "All my social networks.",
    run(args) {
      if (args[0] !== "-a") {
        print("social: missing option, did you mean social -a ?");
        return;
      }
      printHTML(LINKS.linkedin);
      printHTML(LINKS.twitter);
      printHTML(LINKS.tryhackme);
    },
  },
  certs: {
    desc: "Certifications I hold.",
    run() {
      printHTML(LINKS.credly);
    },
  },
  ls: {
    usage: "ls [-la] [dir]",
    desc: "List directory contents.",
    run(args) {
      const flags = args.filter(a => a.startsWith("-")).join("");
      const target = args.find(a => !a.startsWith("-")) || ".";
      const parts = resolvePath(target);
      const node = getNode(parts);
      if (isDenied(parts)) return print(`ls: cannot open directory '${target}': Permission denied`);
      if (!node) return print(`ls: cannot access '${target}': No such file or directory`);
      if (node.type === "file") return print(target);

      const showHidden = flags.includes("a");
      const names = listDir(node, showHidden);
      if (showHidden) names.unshift(".", "..");
      if (flags.includes("l")) printLsLong(names, node, parts);
      else printLs(names, node);
    },
  },
  cd: {
    usage: "cd <dir>",
    desc: "Change directory.",
    run([target = "~"]) {
      const parts = resolvePath(target);
      const node = getNode(parts);
      if (isDenied(parts)) return print(`cd: permission denied: ${target}`);
      if (!node) return print(`cd: no such file or directory: ${target}`);
      if (node.type !== "dir") return print(`cd: not a directory: ${target}`);
      state.cwd = parts;
    },
  },
  cat: {
    usage: "cat <file>",
    desc: "Read a file.",
    run(args) {
      if (!args.length) return print("cat: missing file operand");
      for (const target of args) {
        const parts = resolvePath(target);
        const node = getNode(parts);
        if (isDenied(parts)) print(`cat: ${target}: Permission denied`);
        else if (!node) print(`cat: ${target}: No such file or directory`);
        else if (node.type === "dir") print(`cat: ${target}: Is a directory`);
        else node.lines.forEach(line => printHTML(line));
      }
    },
  },
  pwd: {
    desc: "Print working directory.",
    run() {
      print("/" + state.cwd.join("/"));
    },
  },
  tree: {
    desc: "Show the directory tree.",
    run([target = "."]) {
      const parts = resolvePath(target);
      const node = getNode(parts);
      if (isDenied(parts)) return print(`${target} [error opening dir]`);
      if (!node || node.type !== "dir") return print(`${target} [error opening dir]`);

      const out = [];
      treeLines(node, "", out);
      print(target, "ls-dir");
      for (const line of out) {
        const p = el("p", "pre");
        p.append(line.prefix, el("span", line.isDir ? "ls-dir" : "", line.name));
        app.append(p);
      }
      const dirs = out.filter(l => l.isDir).length;
      print(`\n${dirs} directories, ${out.length - dirs} files`, "pre");
    },
  },
  history: {
    desc: "Show command history.",
    run() {
      state.history.forEach((cmd, i) => print(`${String(i + 1).padStart(5)}  ${cmd}`, "pre"));
    },
  },
  neofetch: {
    desc: "System information.",
    run() {
      const user = state.isRoot ? "root" : "Josh";
      const mins = Math.max(1, Math.round((Date.now() - bootTime) / 60000));
      const info = [
        ["OS", "Kali GNU/Linux Rolling x86_64"],
        ["Host", "joshuarobbins.tech"],
        ["Kernel", "6.16.8+kali-amd64"],
        ["Uptime", `${mins} min${mins === 1 ? "" : "s"}`],
        ["Shell", "zsh 5.9"],
        ["Terminal", "qterminal"],
        ["Role", "Senior Security Analyst"],
        ["Degree", "BSc Computer Science"],
        ["Hobbies", "CTFs, TryHackMe"],
        ["Blog", "blog.joshuarobbins.tech"],
      ];

      const wrap = el("div", "neofetch");
      const infoCol = el("div", "nf-info");
      const title = el("p");
      title.append(el("span", "nf-key", user), "@", el("span", "nf-key", "Robbins"));
      infoCol.append(title, el("p", "", "-".repeat(user.length + 8)));
      for (const [key, value] of info) {
        const p = el("p");
        p.append(el("span", "nf-key", key), `: ${value}`);
        infoCol.append(p);
      }
      const swatches = el("p", "nf-swatches");
      for (let i = 0; i < 8; i++) swatches.append(el("span", `sw${i}`));
      infoCol.append(el("p", "", " "), swatches);

      wrap.append(el("pre", "nf-logo", NEOFETCH_LOGO), infoCol);
      app.append(wrap);
    },
  },
  all: {
    desc: "See all commands.",
    run: listCommands,
  },
  clear: {
    desc: "Clean the terminal.",
    run() {
      app.textContent = "";
    },
  },

  // Utilities and easter eggs - hidden from `all`
  help: { hidden: true, run: listCommands },
  echo: {
    hidden: true,
    run(args) {
      print(args.join(" "));
    },
  },
  date: {
    hidden: true,
    run() {
      const d = new Date();
      const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      print(`${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${time} ${timezone(d)} ${d.getFullYear()}`, "pre");
    },
  },
  id: {
    hidden: true,
    run() {
      if (state.isRoot) print("uid=0(root) gid=0(root) groups=0(root)");
      else print("uid=1000(Josh) gid=1000(Josh) groups=1000(Josh),4(adm),20(dialout),24(cdrom),27(sudo),46(plugdev),100(users),106(netdev),117(wireshark),120(bluetooth),134(scanner),142(kaboxer)");
    },
  },
  hostname: {
    hidden: true,
    run() {
      print("Robbins");
    },
  },
  uname: {
    hidden: true,
    run(args) {
      if (args.includes("-a")) print("Linux Robbins 6.16.8+kali-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.16.8-1kali1 (2026-09-14) x86_64 GNU/Linux");
      else print("Linux");
    },
  },
  sudo: {
    hidden: true,
    async run(args) {
      if (!args.length) return print("usage: sudo -h | -K | -k | -V");
      if (state.isRoot) return run(args.join(" "));
      if (["-s", "-i", "su"].includes(args[0])) {
        print("[sudo] password for Josh: ");
        await delay(900);
        state.isRoot = true;
        return;
      }
      for (let attempt = 0; attempt < 3; attempt++) {
        print("[sudo] password for Josh: ");
        await delay(900);
        if (attempt < 2) print("Sorry, try again.");
      }
      print("sudo: 3 incorrect password attempts");
      print("This incident will be reported.", "dim");
    },
  },
  su: {
    hidden: true,
    async run() {
      if (state.isRoot) return;
      print("Password: ");
      await delay(900);
      state.isRoot = true;
    },
  },
  exit: {
    hidden: true,
    run() {
      if (state.isRoot) {
        state.isRoot = false;
        if (isDenied(state.cwd)) state.cwd = [...HOME];
        return;
      }
      closeTerminal();
    },
  },
  nmap: {
    hidden: true,
    async run(args) {
      const target = args.filter(a => !a.startsWith("-")).pop();
      if (!target) {
        print("Nmap 7.95 ( https://nmap.org )");
        print("Usage: nmap [Scan Type(s)] [Options] {target specification}");
        return;
      }
      const allowed = ["joshuarobbins.tech", "www.joshuarobbins.tech", "localhost", "127.0.0.1"];
      if (!allowed.includes(target.toLowerCase())) {
        print("Let's not scan things without permission ;)");
        print("Try: nmap joshuarobbins.tech", "dim");
        return;
      }
      const d = new Date();
      const local = target === "localhost" || target === "127.0.0.1";
      print(`Starting Nmap 7.95 ( https://nmap.org ) at ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())} ${timezone(d)}`);
      await delay(1200);
      await printSlowly([
        `Nmap scan report for ${target} (${local ? "127.0.0.1" : "185.199.108.153"})`,
        `Host is up (${local ? "0.000041" : "0.012"}s latency).`,
        "Not shown: 998 filtered tcp ports (no-response)",
        "PORT    STATE SERVICE",
        "80/tcp  open  http",
        "443/tcp open  https",
        "",
        "Nmap done: 1 IP address (1 host up) scanned in 4.20 seconds",
      ], 150);
    },
  },
  msfconsole: {
    hidden: true,
    async run() {
      print("Metasploit tip: Hire people who enjoy reading HTML comments", "dim");
      await delay(800);
      await printSlowly([
        "       =[ metasploit v6.4.88-dev                          ]",
        "+ -- --=[ 2,560 exploits - 1,310 auxiliary - 1,680 payloads ]",
        "+ -- --=[ 1 portfolio - 0 known vulnerabilities (hopefully) ]",
        "",
        "msf6 > use exploit/multi/http/portfolio_rce",
        "msf6 exploit(multi/http/portfolio_rce) > set RHOSTS joshuarobbins.tech",
        "RHOSTS => joshuarobbins.tech",
        "msf6 exploit(multi/http/portfolio_rce) > exploit",
        "[*] Started reverse TCP handler on 10.10.14.7:4444",
        "[-] Exploit completed, but no session was created. Target appears patched.",
        "msf6 exploit(multi/http/portfolio_rce) > exit",
      ], 250);
    },
  },
  rm: {
    hidden: true,
    run(args) {
      const target = args.filter(a => !a.startsWith("-")).pop();
      if (!target) return print("rm: missing operand");
      if (target === "/" && args.some(a => a.startsWith("-") && a.includes("r"))) {
        print("rm: it is dangerous to operate recursively on '/'");
        print("rm: use --no-preserve-root to override this failsafe");
        print("Nice try.", "dim");
        return;
      }
      print(`rm: cannot remove '${target}': Read-only file system`);
    },
  },
};


/* ==========================================================================
   6. Command dispatch
   ========================================================================== */
const SAFE_INPUT = /^[a-zA-Z0-9\-_ .\/~]*$/;

async function run(line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (!SAFE_INPUT.test(trimmed)) {
    print("Are you really trying XSS? I'm not mad, I am disappointed.");
    return;
  }
  const [name, ...args] = trimmed.split(/\s+/);
  if (!isKnown(name)) {
    print(`zsh: command not found: ${name}`);
    return;
  }
  await commands[name.toLowerCase()].run(args);
}

async function submit() {
  const value = input.value;
  input.closest(".prompt").remove();
  input = null;
  printPromptHistory(value);
  if (value.trim()) state.history.push(value);

  state.busy = true;
  try {
    await run(value);
  } finally {
    state.busy = false;
  }
  newPrompt();
}


/* ==========================================================================
   7. Key handling
   ========================================================================== */
function commonPrefix(words) {
  let prefix = words[0];
  for (const word of words) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

function complete() {
  const value = input.value;
  if (!value.trim()) return;
  const lastSpace = value.lastIndexOf(" ");
  let base, partial, candidates;

  if (!value.trim().includes(" ")) {
    // Completing the command name
    base = value.slice(0, value.length - value.trimStart().length);
    partial = value.trimStart().toLowerCase();
    candidates = Object.keys(commands)
      .filter(name => name.startsWith(partial))
      .map(name => ({ name, suffix: " ", isDir: false }));
  } else {
    // Completing a path argument
    const cmdName = value.trim().split(/\s+/)[0].toLowerCase();
    const token = value.slice(lastSpace + 1);
    const slash = token.lastIndexOf("/");
    const dirPart = token.slice(0, slash + 1);
    partial = token.slice(slash + 1);
    const parts = resolvePath(dirPart || ".");
    const node = getNode(parts);
    if (!node || node.type !== "dir" || isDenied(parts)) return;

    base = value.slice(0, lastSpace + 1) + dirPart;
    candidates = listDir(node, partial.startsWith("."))
      .filter(name => name.startsWith(partial))
      .map(name => {
        const isDir = node.children[name].type === "dir";
        return { name, suffix: isDir ? "/" : " ", isDir };
      })
      .filter(c => cmdName !== "cd" || c.isDir);
  }

  if (!candidates.length) return;
  if (candidates.length === 1) {
    input.value = base + candidates[0].name + candidates[0].suffix;
  } else {
    const common = commonPrefix(candidates.map(c => c.name));
    if (common.length > partial.length) {
      input.value = base + common;
    } else {
      for (const c of candidates) completions.append(el("span", c.isDir ? "ls-dir" : "", c.name));
    }
  }
  setCaretEnd();
  scrollBottom();
}

function recallHistory(step) {
  const next = state.histIndex + step;
  if (next < 0) return;
  if (next >= state.history.length) {
    state.histIndex = state.history.length;
    input.value = "";
  } else {
    state.histIndex = next;
    input.value = state.history[next];
  }
  setCaretEnd();
}

app.addEventListener("keydown", function(event){
  if (!input || event.target !== input || state.busy) return;
  completions.textContent = "";
  const key = event.key;

  if (key === "Enter") {
    event.preventDefault();
    submit();
  } else if (key === "Tab") {
    event.preventDefault();
    complete();
  } else if (key === "ArrowUp") {
    event.preventDefault();
    recallHistory(-1);
  } else if (key === "ArrowDown") {
    event.preventDefault();
    recallHistory(1);
  } else if (event.ctrlKey && key.toLowerCase() === "l") {
    event.preventDefault();
    const value = input.value;
    app.textContent = "";
    newPrompt(value);
  } else if (event.ctrlKey && key.toLowerCase() === "c" && input.selectionStart === input.selectionEnd) {
    event.preventDefault();
    const value = input.value;
    input.closest(".prompt").remove();
    input = null;
    printPromptHistory(value, "^C");
    newPrompt();
  }
});

app.addEventListener("click", function(event){
  if (!input || event.target.closest("a") || String(window.getSelection())) return;
  input.focus({ preventScroll: true });
});

document.addEventListener("selectionchange", syncMirror);


/* ==========================================================================
   Window controls
   ========================================================================== */
function closeTerminal() {
  state.closed = true;
  container.classList.add("closed");
  reopenButton.hidden = false;
}

reopenButton.addEventListener("click", function(){
  state.closed = false;
  state.isRoot = false;
  state.cwd = [...HOME];
  container.classList.remove("closed", "minimized");
  reopenButton.hidden = true;
  app.textContent = "";
  newPrompt();
});

document.querySelector(".menu .exit").addEventListener("click", closeTerminal);
document.querySelector(".menu .minimize").addEventListener("click", () => container.classList.toggle("minimized"));
document.querySelector(".menu .maximize").addEventListener("click", () => container.classList.toggle("maximized"));


/* ==========================================================================
   8. Boot sequence
   ========================================================================== */
async function open_terminal(){
  createTypewriterText("Welcome", "welcome");
  await delay(700);
  createTypewriterText(getRandomMOTD(), "motd");
  await delay(700);

  await delay(1500);
  printBanner("Main commands", [
    ["whoami", "Who am i and what do i do."],
    ["all", "See all commands."],
    ["social -a", "All my social networks."],
  ], "Tip: Tab autocompletes, ↑/↓ browses history");
  await delay(500);
  newPrompt();
}

function getRandomMOTD(){
  const messages = [
    "Starting the server...",
    "Entering the matrix...",
    "Connecting to TOR exit node...",
    "Thinking of something smart...",
    "Running apt full-upgrade...",
    "Loading exploit modules...",
    "Bypassing the firewall...",
  ];
  const random = Math.floor(Math.random() * messages.length);
  return messages[random];
}

open_terminal();
