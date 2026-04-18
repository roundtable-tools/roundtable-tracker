---
applyTo: "web-roundtable-tracker/**"
description: "Use when working in the Vite web app, including React routes, components, models, stores, tests, and styling under web-roundtable-tracker."
---

# Web App Instructions

This scope covers the web application in `web-roundtable-tracker`.

Favor the existing web stack and project structure:

- React with TypeScript
- Vite for development and builds
- TanStack Router for route structure under `src/routes`
- Shared UI and app components under `src/components`
- Domain logic under `src/models`, `src/store`, and related utility modules

When implementing changes, prefer extending the current route, model, store, and component structure instead of introducing duplicate state or alternate data flows.

Keep validation aligned with the existing scripts in `web-roundtable-tracker/package.json`:

- `yarn workspace web-roundtable-tracker lint`
- `yarn workspace web-roundtable-tracker typecheck`
- `yarn workspace web-roundtable-tracker test`
- `yarn workspace web-roundtable-tracker build`

Use the narrowest command that verifies the changed behavior. For code-only changes, prefer lint or typecheck before a full build.

When editing UI, preserve the established patterns already used in the web app and keep new components consistent with the existing React and TypeScript style in nearby files.

Do not introduce React Native or Expo-specific APIs into this app.