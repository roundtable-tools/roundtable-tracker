---
applyTo: "native-roundtable-tracker/**"
description: "Use when working in the Expo native app, including app routes, components, hooks, tests, and NativeWind styling under native-roundtable-tracker."
---

# Native App Instructions

This scope covers the native application in `native-roundtable-tracker`.

Favor the existing native stack and project structure:

- Expo with React Native and TypeScript
- Expo Router for file-based routing under `app/`
- Shared native components under `components/`
- Hooks and constants under `hooks/` and `constants/`
- NativeWind and the current styling setup already configured in the app

When making changes, work within the current Expo Router and React Native patterns instead of bringing in browser-only assumptions or web component structure.

Use the existing scripts in `native-roundtable-tracker/package.json` for validation:

- `yarn workspace native-roundtable-tracker lint`
- `yarn workspace native-roundtable-tracker typecheck`
- `yarn workspace native-roundtable-tracker test`

Prefer `lint` or `typecheck` for fast validation after code changes. Be aware that the native `test` script runs `jest --watchAll`, so it is not the best default for non-interactive verification.

Keep React Native changes platform-appropriate and avoid DOM-specific APIs, browser globals, or web-only packages unless the target file already supports web behavior explicitly.