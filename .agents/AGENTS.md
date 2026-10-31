# Project Rules & Workflows

## Automatic Build & Deploy Rule
Whenever code modifications are made (to `server.js`, `src/`, or configuration files):
1. **Backend Bundle**: ALWAYS automatically execute:
   ```bash
   npx esbuild server.js --bundle --platform=node --format=cjs --external:fs --external:path --external:net --external:url --outfile=server.bundle.cjs
   ```
2. **Frontend Build**: ALWAYS automatically execute:
   ```bash
   npm run build
   ```
3. **Automatic Deployment**: ALWAYS automatically execute:
   ```bash
   node deploy.js
   ```
This ensures that `server.bundle.cjs` and `dist/` are always compiled and immediately deployed to AlwaysData (`ssh-2mc.alwaysdata.net`) without requiring explicit user prompts.

## MikroTik Router Hotspot Portal Upload
The captive portal files (`loc/login.html` and `loc/status.html`) are served locally by the MikroTik router (`10.0.0.254` / `10.14.26.1`).
When modifications are made to the captive portal HTML/CSS/JS:
- The local developer machine is directly connected to the MikroTik router over Wi-Fi (`10.0.0.254`).
- MikroTik has port 21 (FTP) open and credentials stored in `data/db.json`.
- To upload `login.html` directly to the MikroTik router without using WinBox:
  ```bash
  npm run upload:router
  ```
  or:
  ```bash
  node scripts/upload-to-router.cjs
  ```
  This immediately pushes `loc/login.html` into `ftp://10.0.0.254/hotspot/login.html` via FTP in 1 second.
