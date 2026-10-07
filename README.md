# 🖥️ Joshua Robbins — Terminal‑Style Homepage

**Live at:** https://www.joshuarobbins.tech

A fully interactive, terminal‑inspired personal homepage built with vanilla JavaScript, HTML, and CSS. Visitors can explore your projects, socials, certifications, and bio through a simulated command‑line interface.

This site is intentionally lightweight, fast, and playful — designed to feel like booting into a kali console.

## ✨ Features

### **Interactive Command Line**

Users can type commands directly into the terminal:

| Command | Description |
| --- | --- |
| `whoami` | Shows a short bio |
| `projects` | Links to your blog + GitHub |
| `social -a` | Displays all social profiles |
| `certs` | Shows your Credly certifications |
| `all` | Lists all available commands |
| `clear` | Clears the terminal output |
| `ls [-la] [dir]` | List files in the fake filesystem |
| `cd <dir>` | Change directory (the prompt path updates) |
| `cat <file>` | Read a file, e.g. `cat about.txt` |
| `pwd` / `tree` | Show where you are / the whole tree |
| `history` | Previously run commands |
| `neofetch` | System info with the Kali dragon |

Invalid commands return zsh-style errors (`zsh: command not found: foo`), and attempts at XSS get a cheeky response. There are also a few hidden commands and flags to find...

### **Real Shell Behaviour**

-   **↑ / ↓** browse command history
-   **Tab** autocompletes commands and file paths (multiple matches are listed)
-   **Ctrl+L** clears the screen, **Ctrl+C** cancels the current line
-   Live zsh-syntax-highlighting: the command turns green when valid, red when not
-   Blinking block cursor, plus working minimise / maximise / close window buttons

### **Boot‑Up Typewriter Sequence**

On load, the terminal animates:

-   A welcome message
    
-   A random MOTD (e.g., “Entering the matrix…”)
    
-   A list of available commands
    

All rendered with a typewriter effect for extra immersion.

### **Dynamic Prompt Rendering**

Each command line is generated with your custom prompt:

Code

    ┌──(Joshua㉿Robbins)-[~]
    └─$ 
    

This matches Kali's default zsh theme, including the colours. The path updates as you `cd` around, and the prompt switches to the red `root㉿Robbins` / `#` theme if you manage to get root.

### **Zero Dependencies**

-   No frameworks
    
-   No build tools
    
-   No external JS libraries
    
-   Works on any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.)
    

## 📁 Project Structure

Code

    index.html
    styles/
      main.css
      all.css
    scripts/
      main.js
    images/
      favicon-16x16.png
      favicon-32x32.png
      apple-touch-icon.png
      og-image.png          (1200x630 link-preview image)
      kali-cubism-16x9.webp (background, JPG kept as fallback)
    site.webmanifest
    robots.txt
    sitemap.xml
    

## 🚀 How It Works

### **main.js** handles:

-   Boot sequence
    
-   Command parsing
    
-   DOM manipulation
    
-   Typewriter animation
    
-   Prompt creation
    
-   "Input sanitization"
    
-   Command history rendering
    

The flow is simple:

1.  User presses Enter
    
2.  Input is validated
    
3.  Matching command logic runs
    
4.  Output is printed
    
5.  A new prompt is created
    

## 🔗 Live Site

My homepage is live at:

👉 https://www.joshuarobbins.tech