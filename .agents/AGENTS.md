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
