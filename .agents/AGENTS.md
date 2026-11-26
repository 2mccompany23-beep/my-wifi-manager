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

## Kiosk Dashboard Automatic Online Deploy Rule (`abh2026-vote-kiosk`)
Whenever code modifications are made to the Kiosk Dashboard (`abh2026-vote-kiosk/`):
ALWAYS automatically execute:
```bash
node abh2026-vote-kiosk/deploy-alwaysdata.js
```
This deploys the dashboard, API, static files, and background services directly to AlwaysData (`https://charmeldev.alwaysdata.net`) via SFTP and restarts the remote server immediately.

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

## Kiosk Hotspot Routers Upload (Routeur 1 & Routeur 2)
When modifications are made to the Kiosk Hotspot captive portal files (`abh2026-vote-kiosk/router-config/`):
- Run:
  ```bash
  npm run upload:kiosk:routers
  ```
  or:
  ```bash
  node scripts/upload-all-to-routers.cjs
  ```
  This uploads the full pack (`login.html`, `admin.html`, `status.html`, `index.html`, `redirect.html`, `rlogin.html`, `alogin.html`) directly into `ftp://192.168.1.71/hotspot/` (Routeur 1) and `ftp://192.168.1.72/hotspot/` (Routeur 2).
