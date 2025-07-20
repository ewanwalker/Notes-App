# Notes App (Electron Desktop)

A local-first notes app that stores your notes as files on your device.  
**Runs as a desktop application using Electron.**

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [npm](https://www.npmjs.com/)

---

## Setup

1. **Clone or download this repository.**

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Run the app:**

   ```
   npm start
   ```

   This will launch the Notes App in a desktop window.

---

## Packaging as an `.exe` (Windows)

1. **Install Electron Packager:**

   ```
   npm install --save-dev electron-packager
   ```

2. **Add a package script to your `package.json`:**

   ```json
   "scripts": {
     "start": "electron .",
     "package": "electron-packager . NotesApp --platform=win32 --arch=x64 --overwrite"
   }
   ```

3. **Build the executable:**

   ```
   npm run package
   ```

   The `.exe` will be in the `NotesApp-win32-x64` folder.

---

## File Structure

- `main.js` - Electron main process (entry point)
- `renderer.js` - Renderer process (UI logic, Node.js APIs)
- `index.html` - Main UI
- `css/` - Stylesheets
- `js/` - Syntax highlighting and math rendering libraries
- `notes/` - Your notes are stored here as `.json` files
- `settings.json` - App settings (theme, font size, etc.)

---

## Notes

- **All notes are stored locally** in the `notes/` folder as `.json` files.
- **No data is sent to the cloud.**
- **Requires Electron** (runs as a desktop app, not in a browser).

---

## Troubleshooting

- If you see errors about missing modules, make sure you ran `npm install`.
- If you get a blank window, check the developer console (Ctrl+Shift+I) for errors.

---


