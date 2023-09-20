const app = document.querySelector("#app");
const delay = ms => new Promise(res => setTimeout(res, ms));
    
app.addEventListener("keypress", async function(event){
  if(event.key === "Enter"){
    await delay(150);
    getInputValue();
    removeInput();
    await delay(150);
    new_line();
  }
});

app.addEventListener("click", function(event){
  const input = document.querySelector("input");
  input.focus();
})


async function open_terminal(){
  createTypewriterText("Welcome", "welcome");
  await delay(700);
  createTypewriterText(getRandomMOTD(), "motd");
  await delay(700);
  
  await delay(1500);
  createText("You can run several commands:");
  createCode("whoami", "Who am i and what do i do.");
  createCode("all", "See all commands.");
  createCode("social -a", "All my social networks.");
  await delay(500);
  new_line();
}


function new_line(){
  const div = document.createElement("div");
  div.setAttribute("class", "type")
  const span1 = document.createElement("span");
  const span2 = document.createElement("span");
  const span3 = document.createElement("span");
  div.setAttribute("class", "path")
  span1.textContent = "┏━━(";
  span1.setAttribute("class", "white")
  span2.textContent = "Joshua㉿Robbins";
  span3.textContent = ")-[~]";
  span3.setAttribute("class", "white")
  div.appendChild(span1);
  div.appendChild(span2);
  div.appendChild(span3);
  const lineBreak = document.createElement("br");
  div.appendChild(lineBreak);
  const span4 = document.createElement("span");
  span4.textContent = "┗━$ ";
  span4.setAttribute("class", "white")
  div.appendChild(span4);
  const input = document.createElement("input");
  input.setAttribute("maxlength", "30")
  div.appendChild(input);
  app.appendChild(div);
  input.focus();
}

function removeInput(){
  const div = document.querySelector(".path");
  app.removeChild(div);
}

async function getInputValue(){
  const dirtyValue = document.querySelector("input").value;
  let value;
  const regexp = /^[a-zA-Z0-9-_ ]+$/;
  if (dirtyValue.search(regexp) === -1){ 
    value = "XSS";
  }
  else{ 
    value = dirtyValue.toLowerCase();
  }

  if(value === "all"){
    trueValue(dirtyValue);
    createCode("projects", "Where to find my projects.");
    createCode("whoami", "What I do and who I am.");
    createCode("social -a", "All my social networks.");
    createCode("certs", "Certifications I hold.");
    createCode("clear", "Clean the terminal.");
  }
  else if(value === "projects"){
    trueValue(dirtyValue);
    createText("<a href='https://blog.joshuarobbins.tech' target='_blank'><i class='fab fa-wordpress white'></i> blog.joshuarobbins.tech</a>")
    createText("<a href='https://github.com/JoshRSec' target='_blank'><i class='fab fa-github white'></i> github.com/JoshRSec</a>")
  }
  else if(value === "whoami"){
    trueValue(dirtyValue);
    createText("My name is Joshua Robbins, I currently work as a Security Analyst.")
    createText("I am passionate about CyberSec, keeping up with new trends and completing CTFs.")
    createText("Having graduated with a BSc in Computer Science, I also have experience as an infrastructure engineer.")
  }
  else if(value === "social -a"){
    trueValue(dirtyValue);
    createText("<a href='https://www.linkedin.com/in/joshua-robbins-335152123/' target='_blank'><i class='fab fa-linkedin white'></i> linkedin.com/in/joshua-robbins-335152123/</a>")
    createText("<a href='https://twitter.com/Piv0tSec' target='_blank'><i class='fab fa-twitter white'></i> twitter.com/Piv0tSec/</a>")
    createText("<a href='https://tryhackme.com/p/piv0t' target='_blank'><i class='fa fa-user-secret white'></i> tryhackme.com/p/piv0t/</a>")
  }
  else if(value === "social"){
    falseValue(dirtyValue);
    createText(`Command '${value}' not found, did you meant social -a ?`)
  }
  else if(value === "certs"){
    falseValue(dirtyValue);
    createText("<a href='https://www.credly.com/users/joshua-robbins.34758ae2/badges' target='_blank'><i class='fa fa-certificate white'></i> credly.com/users/joshua-robbins.34758ae2/badges/</a>")
  }
  else if(value === "XSS"){
    falseValue(dirtyValue);
    createText(`Are you really trying XSS? I'm not mad, I am disappointed.`)
  }
  else if(value === "clear"){
    document.querySelectorAll("p").forEach(e => e.parentNode.removeChild(e));
    document.querySelectorAll("section").forEach(e => e.parentNode.removeChild(e));
  }
  else{
    falseValue(dirtyValue);
    createText(`${dirtyValue}: command not found`)
  }
}

function trueValue(value){
  const div = document.createElement("section");
  div.setAttribute("class", "path-history")
  const span1 = document.createElement("span");
  const span2 = document.createElement("span");
  const span3 = document.createElement("span");
  span1.textContent = "┏━━(";
  span1.setAttribute("class", "white")
  span2.textContent = "Joshua㉿Robbins";
  span3.textContent = ")-[~]";
  span3.setAttribute("class", "white")
  div.appendChild(span1);
  div.appendChild(span2);
  div.appendChild(span3);
  const lineBreak = document.createElement("br");
  div.appendChild(lineBreak);
  const span4 = document.createElement("span");
  span4.textContent = "┗━$ ";
  span4.setAttribute("class", "white")
  div.appendChild(span4);
  const message = document.createElement("h2");
  message.setAttribute("class", "success")
  message.textContent = `${value}`;
  div.appendChild(message);
  app.appendChild(div);
}

function falseValue(value){
  const div = document.createElement("section");
  div.setAttribute("class", "path-history")
  const span1 = document.createElement("span");
  const span2 = document.createElement("span");
  const span3 = document.createElement("span");
  span1.textContent = "┏━━(";
  span1.setAttribute("class", "white")
  span2.textContent = "Joshua㉿Robbins";
  span3.textContent = ")-[~]";
  span3.setAttribute("class", "white")
  div.appendChild(span1);
  div.appendChild(span2);
  div.appendChild(span3);
  const lineBreak = document.createElement("br");
  div.appendChild(lineBreak);
  const span4 = document.createElement("span");
  span4.textContent = "┗━$ ";
  span4.setAttribute("class", "white")
  div.appendChild(span4);
  const message = document.createElement("h2");
  message.setAttribute("class", "error")
  message.textContent = `${value}`;
  div.appendChild(message);
  app.appendChild(div);
}

function createText(text){
  const p = document.createElement("p");
  p.innerHTML = text;
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

function createCode(code, text){
  const p = document.createElement("p");
  p.setAttribute("class", "code");
  p.innerHTML =
 `${code} <br/><span class='text'> ${text} </span>`;
  app.appendChild(p);
}

function getRandomMOTD(){
  const messages = ["Starting the server...","Entering the matrix...","Connecting to TOR exit node...","Thinking of something smart..."];
  const random = Math.floor(Math.random() * messages.length);
  return messages[random];
}

open_terminal();