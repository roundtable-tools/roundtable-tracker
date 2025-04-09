# Roundtable Tracker 🛡️🎲

Roundtable Tracker is a tool designed to help manage encounters and track character progress in tabletop role-playing games, with a special focus on **Pathfinder 2e (PF2e)**. It provides a web-based interface and a native application for seamless tracking and management.

> **Note**: The native version is currently incomplete, and this project is still in its early development phase. Expect frequent updates and changes!

## Features ✨

- **Encounter Management**: Start and manage encounters with characters.
- **Character Tracking**: Track character stats, order, and turn states.
- **Command History**: Undo/redo actions with a command history system.
- **Cross-Platform**: Available as a web application and a native app.
- **PF2e Support**: Tailored for Pathfinder 2e encounters and mechanics.

## Project Structure 🗂️

This repository is a monorepo containing the following workspaces:

- **`web-roundtable-tracker`**: The web application built with React and Vite.
- **`native-roundtable-tracker`**: The native application built with Expo.

## Prerequisites 📋

- Node.js (v20.x or higher)
- Yarn (v4.9.0 or higher)

## Setup Instructions 🚀

1. Clone the repository:

   ```bash
   git clone https://github.com/roundtable-tools/roundtable-tracker.git
   cd roundtable-tracker
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Run the web application:

   ```bash
   yarn dev
   ```

4. Run the native application:

   ```bash
   yarn start
   ```

## Development 🛠️

### Linting and Formatting

- Run ESLint:
  ```bash
  yarn workspace web-roundtable-tracker lint
  ```
- Run Prettier:
  ```bash
  yarn workspace web-roundtable-tracker prettier
  ```

### Testing

- Run tests for the web application:
  ```bash
  yarn workspace web-roundtable-tracker test
  ```
- Run tests for the native application:
  ```bash
  yarn workspace native-roundtable-tracker test
  ```

### Building

- Build the web application:

  ```bash
  yarn workspace web-roundtable-tracker build
  ```

- Build the native application:
  ```bash
  yarn workspace native-roundtable-tracker build
  ```

## Deployment 🌐📱

### Web Application

The web application is deployed to GitHub Pages. To trigger a deployment, push changes to the `main` branch.

### Native Application

The native application can be built and deployed using Expo.

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and open a pull request.

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙌

- Built with [React](https://reactjs.org/), [Expo](https://expo.dev/), and [Zustand](https://zustand-demo.pmnd.rs/).
- Inspired by tabletop RPG enthusiasts, especially fans of **Pathfinder 2e**.
