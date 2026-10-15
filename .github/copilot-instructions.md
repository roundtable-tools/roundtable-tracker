# GitHub Copilot Instructions for Roundtable Tracker

This repository is a Yarn workspace monorepo with one application:

- `web-roundtable-tracker` for the Vite and React web app

Use the existing workspace commands instead of inventing new entry points:

- `yarn dev` starts the web app from the repo root
- `yarn workspace web-roundtable-tracker <script>` runs web-specific commands

Prefer small, local changes that fit the existing TypeScript and React patterns already present in the codebase. Reuse nearby models, stores, routes, and components instead of introducing parallel abstractions.

When touching behavior, validate with the narrowest relevant command for the area you changed:

- Web: lint, typecheck, test, or build in `web-roundtable-tracker`

If the task is ambiguous, first determine whether the change belongs to the web app or to shared repository tooling, then continue in that scope.
