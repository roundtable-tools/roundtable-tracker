# GitHub Copilot Instructions for Roundtable Tracker

This repository is a Yarn workspace monorepo with two applications:

- `web-roundtable-tracker` for the Vite and React web app
- `native-roundtable-tracker` for the Expo and React Native app

When making changes, keep edits scoped to the app you are working in unless the task clearly spans both applications.

Use the existing workspace commands instead of inventing new entry points:

- `yarn dev` starts the web app from the repo root
- `yarn start` starts the native app from the repo root
- `yarn workspace web-roundtable-tracker <script>` runs web-specific commands
- `yarn workspace native-roundtable-tracker <script>` runs native-specific commands

Prefer small, local changes that fit the existing TypeScript and React patterns already present in the codebase. Reuse nearby models, stores, routes, and components instead of introducing parallel abstractions.

When touching behavior, validate with the narrowest relevant command for the area you changed:

- Web: lint, typecheck, test, or build in `web-roundtable-tracker`
- Native: lint or typecheck in `native-roundtable-tracker`; note that the native test script runs in watch mode by default

Do not mix web-only libraries, DOM APIs, or browser assumptions into the native app. Do not mix Expo or React Native primitives into the web app.

If the task is ambiguous in this monorepo, first determine whether the change belongs to the web app, the native app, or shared repository tooling, then continue in that scope.