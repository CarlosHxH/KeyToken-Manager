# AGENTS.md — KeyToken Manager

## What this is
Chrome/Firefox extension (Manifest V3) that obtains and manages Keycloak OIDC access tokens. No build step — load unpacked directly.

## Key structural facts
- **No bundler or build tool.** Files are served as-is. After any change, reload via `chrome://extensions/` → Reload.
- **ES modules live in `js/`**. `popup.html` references `<script type="module" src="js/popup.js">`.
- **Module entry points:**
  - `js/popup.js` — orchestrator; imports from `ui.js`, `api.js`, `timer.js`, `storage.js`
  - `decode.js` — standalone script loaded by `decode.html` (classic script, not a module)
- **Browser API shim:** both popup and decode use `const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;` for Chrome/Firefox compat.
- `manifest.json` is v3, no `background.js` (not needed).

## Commands / verification
- No test, lint, or typecheck tooling exists.
- Verification = load unpacked in browser, open popup, exercise the flow.
- Use browser devtools on the popup (right-click → Inspect) for debugging.

## Conventions
- UI texts are in **pt-BR**. Keep user-facing strings in Portuguese.
- Modules use `export` / `import` (ESM). `decode.js` uses classic script (no imports).
- No `package.json`, no node_modules, no lockfiles.
- Use emojis in UI text and comments when they add clarity or visual cues (e.g., button labels, status indicators).
