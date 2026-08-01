# Project Rules & Workflows

## Build Rule for Backend Modifications
Whenever `server.js` is modified, ALWAYS automatically execute the bundle command:
```bash
npx esbuild server.js --bundle --platform=node --format=cjs --external:fs --external:path --external:net --external:url --outfile=server.bundle.cjs
```
This ensures `server.bundle.cjs` stays perfectly in sync with `server.js` for AlwaysData deployment.
