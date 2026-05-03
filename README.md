# Arrows Escape

A sleek, grid-based puzzle game built with React, TypeScript, and Vite. 

Players navigate through progressively challenging levels, manage resources like Shards, and can customize their experience through a built-in shop and various thematic settings.

## 🚀 Technologies Used

- **React** for the UI and component architecture
- **TypeScript** for robust type-safety
- **Vite** for blazing fast builds and development
- **Tailwind CSS** for styling and layout
- **Framer Motion** for smooth, complex animations
- **Firebase** for backend player state management
- **Lucide React** for beautiful iconography

## 🎮 Features

- **Dynamic Grid Puzzles**: A canvas-based interactive grid that scales in complexity based on the level.
- **Game Engine**: Custom hook-based (`useGameEngine`) game logic handling interactions, mechanics, deadlocks, and hints.
- **Player State & Progression**: Persistent tracking of highest unlocked levels, acquired shards, and equipped skins.
- **Shop System**: Spend earned shards to unlock new aesthetics.
- **Customization**: Toggleable settings for sound, haptics, particles, and multiple visual themes.

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd games
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Build

To create a production build, run:
```bash
npm run build
```

You can preview the built app using:
```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── components/
│   ├── Canvas/      # Game grid rendering
│   ├── HUD/         # Heads-up display components (Lives, Top HUD)
│   └── Modals/      # UI overlays (Shop, Settings, Win, Fail, Levels)
├── constants/       # Game configuration, themes, cost settings
├── hooks/           # Core logic (useGameEngine, usePlayerState)
├── lib/             # Utility integrations (Firebase, Audio)
├── types/           # TypeScript definitions
├── App.tsx          # Main application container
└── main.tsx         # Entry point
```

## 🛠️ Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Previews the production build locally.
- `npm run deploy`: Builds and deploys the app using gh-pages.

## 📄 License

This project is private and intended for personal development/portfolio use.
