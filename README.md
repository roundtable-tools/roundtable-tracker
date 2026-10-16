# Roundtable Tracker 🛡️🎲

Roundtable Tracker is a web app for game masters running **Pathfinder 2e (PF2e)** encounters. It runs entirely in the browser and keeps its data in the browser's local storage.

**Live demo:** <https://roundtable-tools.github.io/roundtable-tracker/>

> **Note**: The project is in early development. Expect frequent changes, including to the saved data format.

## Features ✨

- **Encounter builder**: build encounters from creatures, hazards and reinforcements, with the PF2e XP budget and threat level for your party, elite/weak adjustments and a set of encounter templates.
- **Encounter directory**: save, load and import encounters.
- **Party setup**: save parties of player characters and reuse them across encounters.
- **Initiative tracker**: run the encounter round by round: turn order, delay, knock-out, health and temporary HP, reinforcements and hazards.
- **Undo/redo**: tracker actions can be undone and redone, also after a page reload.
- **Player view**: a read-only initiative view for players. The tracker opens it in a separate window (e.g. on a second screen), which follows the tracker live.

## Project Structure 🗂️

This repository is a Yarn workspace with one workspace:

- **`web-roundtable-tracker`**: the web app (React, TypeScript, Vite). See its [README](web-roundtable-tracker/README.md) for architecture notes.

## Prerequisites 📋

- Node.js 24 (the version in `mise.toml` and CI)
- Yarn 4 (v4.9.0 or higher), through Corepack

> **Note**: Node 25 and later no longer bundle Corepack. If `corepack` is missing, install it with `npm install -g corepack`, then run `corepack enable` so `yarn` picks up the version from `packageManager` in `package.json`.

## Setup 🚀

1. Clone the repository:

   ```bash
   git clone https://github.com/roundtable-tools/roundtable-tracker.git
   cd roundtable-tracker
   ```

2. Enable Corepack (once per Node installation) and install dependencies:

   ```bash
   corepack enable
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

   Vite prints the local URL. The app is served under `/roundtable-tracker/`, for example `http://localhost:5173/roundtable-tracker/`.

## Scripts 🛠️

From the repository root:

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `yarn dev`          | Start the Vite development server         |
| `yarn test`         | Run the unit tests (Vitest)               |
| `yarn verify:types` | Typecheck the web app, then run its tests |

Everything else runs in the web workspace, either with `yarn workspace web-roundtable-tracker <script>` from the root or `yarn <script>` inside `web-roundtable-tracker/`:

| Script      | What it does                                         |
| ----------- | ---------------------------------------------------- |
| `lint`      | ESLint                                               |
| `prettier`  | Check formatting with Prettier                       |
| `typecheck` | TypeScript check of both projects (`tsc -b`)         |
| `test`      | Unit tests (Vitest)                                  |
| `coverage`  | Unit tests with a coverage report                    |
| `build`     | TypeScript build, then a production build to `dist/` |
| `preview`   | Serve the production build locally                   |

To fix formatting, run `yarn exec prettier --write .` inside `web-roundtable-tracker/`.

## Before opening a pull request ✅

CI (`.github/workflows/test.yaml`) runs these checks on every pull request to `main`. Run them inside `web-roundtable-tracker/` first:

```bash
yarn prettier
yarn lint
yarn typecheck
yarn test
yarn build
```

## Deployment 🌐

Every push to `main` builds the app and deploys it to GitHub Pages (`.github/workflows/gh-pages.yaml`).

## Contributing 🤝

Contributions are welcome:

1. Fork the repository.
2. Create a branch for your feature or bug fix.
3. Run the checks above, commit your changes and open a pull request.

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙌

- Built with [React](https://react.dev/), [Vite](https://vite.dev/), [TanStack Router](https://tanstack.com/router), [Zustand](https://zustand.docs.pmnd.rs/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) and [Vitest](https://vitest.dev/).
- Inspired by tabletop RPG enthusiasts, especially fans of **Pathfinder 2e**.
