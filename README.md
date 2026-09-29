# 🛒 Mini Grocery App

<div align="center">

<!-- TODO: Add project logo (e.g., `public/logo.png`) -->

[![GitHub stars](https://img.shields.io/github/stars/thiennguyenk01/-mini-grocery-app?style=for-the-badge)](https://github.com/thiennguyenk01/-mini-grocery-app/stargazers)

[![GitHub forks](https://img.shields.io/github/forks/thiennguyenk01/-mini-grocery-app?style=for-the-badge)](https://github.com/thiennguyenk01/-mini-grocery-app/network)

[![GitHub issues](https://img.shields.io/github/issues/thiennguyenk01/-mini-grocery-app?style=for-the-badge)](https://github.com/thiennguyenk01/-mini-grocery-app/issues)

[![GitHub license](https://img.shields.io/badge/license-UNLICENSED-blue.svg?style=for-the-badge)](LICENSE) <!-- TODO: Add an explicit LICENSE file (e.g., MIT, Apache) -->

**A mobile-first grocery management solution designed for small, one-person businesses.**

<!-- TODO: Add live demo link if deployed as a PWA -->
<!-- [Live Demo](https://demo-link.com) | -->
<!-- TODO: Add documentation link if external documentation exists -->
<!-- [Documentation](https://docs-link.com) -->

</div>

## 📖 Overview

The Mini Grocery App is a client-side mobile application tailored for individual entrepreneurs running small grocery businesses. It aims to simplify daily operations by providing essential tools for managing products, tracking inventory, and facilitating sales, all within an intuitive and responsive mobile interface. Built with modern web technologies and wrapped for native mobile platforms using Capacitor, it offers a seamless experience across devices.

## ✨ Features

-   **Product Management**: Easily add, view, update, and delete grocery items.
-   **Inventory Tracking**: Monitor stock levels and manage product quantities.
-   **Sales Processing**: Streamlined interface for recording sales and managing customer orders.
-   **Mobile-First Design**: Optimized user experience for smartphones and tablets using Ionic Framework.
-   **Cross-Platform Deployment**: Deployable as a native Android app via Capacitor, with potential for iOS.
-   **Robust Type Safety**: Built with TypeScript for enhanced code quality and maintainability.
-   **Fast Development**: Leverages Vite for a rapid development and build process.

## 🖥️ Screenshots

<!-- TODO: Add actual screenshots of the application (e.g., homepage, product list, add item form) -->
<!-- ![Screenshot 1](path-to-screenshot-1.png) -->
<!-- ![Screenshot 2](path-to-screenshot-2.png) -->
<!-- ![Screenshot 3](path-to-screenshot-3.png) -->

## 🛠️ Tech Stack

**Frontend:**

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![Ionic Framework](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)](https://ionicframework.com/)

[![Ionicons](https://img.shields.io/badge/Ionicons-3880FF?style=for-the-badge&logo=ionic&logoColor=white)](https://ionic.io/ionicons)

**Build Tools & Mobile:**

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[![Capacitor](https://img.shields.io/badge/Capacitor-313131?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

**Development & Linting:**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)

[![Oxlint](https://img.shields.io/badge/Oxlint-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://oxlint.rs/)

## 🚀 Quick Start

Follow these steps to get a development environment up and running.

### Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: `^18.12.0` or higher (LTS recommended)
-   **npm**: Comes with Node.js
-   **Android Studio**: Required for building and running the Android native app (for Capacitor functionality).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/thiennguyenk01/-mini-grocery-app.git
    cd -mini-grocery-app
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start development server (Web)**
    This will launch the application in your browser as a Progressive Web App (PWA).
    ```bash
    npm run dev
    ```
    The app should be accessible at `http://localhost:5173` (or another port if 5173 is in use).

### Mobile App Setup (Android)

To run the application as a native Android app:

1.  **Build the web assets for production**
    ```bash
    npm run build
    ```

2.  **Add Android platform to Capacitor**
    ```bash
    npx cap add android
    ```
    *This will create an `android` directory with the native Android project.*

3.  **Sync web assets to native project**
    ```bash
    npx cap sync android
    ```

4.  **Open Android Studio**
    ```bash
    npx cap open android
    ```
    From Android Studio, you can run the app on an emulator or a connected device.

## 📁 Project Structure

```
.
├── android/              # Native Android project (generated by Capacitor)
├── dist/                 # Production build output of the web application
├── public/               # Static assets (e.g., index.html, favicon, images)
├── src/                  # Application source code
│   ├── assets/           # Images, icons, and other static media
│   ├── components/       # Reusable React components
│   ├── pages/            # Main application views/screens
│   ├── services/         # Logic for data handling, API interactions (if any)
│   ├── theme/            # Global styling, Ionic theme variables
│   ├── App.tsx           # Main application component
│   └── main.tsx          # React application entry point
├── .oxlintrc.json        # Oxlint configuration for code quality
├── capacitor.config.ts   # Capacitor configuration file
├── index.html            # Main HTML file for the web application
├── package-lock.json     # Node.js dependency lock file
├── package.json          # Project metadata, scripts, and dependencies
├── tsconfig.app.json     # TypeScript configuration for the application
├── tsconfig.json         # Base TypeScript configuration
├── tsconfig.node.json    # TypeScript configuration for Node.js environment
├── vite.config.ts        # Vite build tool configuration
└── .gitignore            # Specifies intentionally untracked files to ignore
```

## ⚙️ Configuration

### Configuration Files

-   `capacitor.config.ts`: Configures the Capacitor project, including app ID, app name, and web directory.
-   `vite.config.ts`: Configures Vite for development and production builds, including plugins and server settings.
-   `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript compiler configurations.
-   `.oxlintrc.json`: Defines linting rules and configurations for Oxlint.

## 🔧 Development

### Available Scripts

The `package.json` includes several scripts for development and building:

| Command           | Description                                       |

| :---------------- | :------------------------------------------------ |

| `npm run dev`     | Starts the development server for the web app.    |

| `npm run build`   | Builds the app for production (web assets).       |

| `npm run lint`    | Runs Oxlint to check code for errors and style issues. |

| `npm run preview` | Serves the production build locally.              |

### Capacitor CLI Commands

Useful Capacitor commands for mobile development:

-   `npx cap add [platform]`: Adds a native platform (e.g., `android`, `ios`).
-   `npx cap sync [platform]`: Copies web assets into the native platform project and updates dependencies.
-   `npx cap open [platform]`: Opens the native project in the appropriate IDE (e.g., Android Studio).

## 🧪 Testing

The project uses Oxlint for static code analysis.

```bash

# Run the linter to check for code quality issues
npm run lint
```
No dedicated unit or integration test setup was detected.

## 🚀 Deployment

The application can be deployed as a Progressive Web App (PWA) or as a native mobile application.

### Production Build (Web)

To create a production-ready build of the web application:

```bash
npm run build
```
This command compiles the application into the `dist/` directory, which can then be served by any static web host.

### Mobile App Deployment

For native mobile deployment (e.g., to Google Play Store):

1.  Perform `npm run build` and `npx cap sync android`.
2.  Open the Android project in Android Studio using `npx cap open android`.
3.  Use Android Studio's built-in tools to generate a signed APK or AAB bundle for release.

## 🤝 Contributing

We welcome contributions to the Mini Grocery App! If you're interested in improving the project, please consider:

-   Reporting bugs or suggesting features via [GitHub Issues](https://github.com/thiennguyenk01/-mini-grocery-app/issues).
-   Submitting pull requests with improvements.

### Development Setup for Contributors

The development setup is the same as the Quick Start guide. Ensure you follow the linting rules when contributing code.

## 📄 License

This project is currently **UNLICENSED**. Please choose and add a license (e.g., MIT, Apache 2.0) to define how others can use, modify, and distribute your work.

## 🙏 Acknowledgments

-   Built with [React](https://react.dev/), [Ionic Framework](https://ionicframework.com/), and [Capacitor](https://capacitorjs.com/).
-   Powered by [Vite](https://vitejs.dev/) for a fast development experience.
-   Code quality enforced by [Oxlint](https://oxlint.rs/).

## 📞 Support & Contact

-   🐛 Issues: [GitHub Issues](https://github.com/thiennguyenk01/-mini-grocery-app/issues)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [thiennguyenk01](https://github.com/thiennguyenk01)

</div>
```
