# 🖥️ Joshua Robbins — Terminal‑Style Homepage

**Live at:** https://www.joshuarobbins.tech

A fully interactive, terminal‑inspired personal homepage built with vanilla JavaScript, HTML, and CSS. Visitors can explore your projects, socials, certifications, and bio through a simulated command‑line interface.

This site is intentionally lightweight, fast, and playful — designed to feel like booting into a hacker console.

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

Invalid commands return styled error messages, and attempts at XSS get a cheeky response.

### **Boot‑Up Typewriter Sequence**

On load, the terminal animates:

-   A welcome message
    
-   A random MOTD (e.g., “Entering the matrix…”)
    
-   A list of available commands
    

All rendered with a typewriter effect for extra immersion.

### **Dynamic Prompt Rendering**

Each command line is generated with your custom prompt:

Code

    ┏━━(Joshua㉿Robbins)-[~]
    ┗━$ 
    

New prompts appear automatically after each command is processed.

### **Security‑Aware Input Handling**

User input is validated with a regex:

-   Only alphanumeric characters, hyphens, underscores, and spaces allowed
    
-   Anything else is treated as `"XSS"` and triggers a playful warning
    

This keeps the terminal fun without exposing the DOM to unsafe input.

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
    site.webmanifest
    

## 🚀 How It Works

### **main.js** handles:

-   Boot sequence
    
-   Command parsing
    
-   DOM manipulation
    
-   Typewriter animation
    
-   Prompt creation
    
-   Input sanitization
    
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