# Melo Chrome Extension

Chrome Extension (Manifest V3) client for the Melo music streaming platform.

## Overview

Melo Chrome Extension provides in-browser audio playback, cross-platform search, playlist management, queue management, favorites, and listening history with background streaming support.

## Architecture

- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS
- **Extension Standard**: Chrome Manifest V3
- **Audio Engine**: Chrome Offscreen Document API for continuous background playback across tabs
- **Isolation**: Shadow DOM injection with keyboard and pointer event propagation boundaries
- **State Management**: Redux Toolkit with custom async `chrome.storage.local` persistence engine
- **API Client**: Axios with background service worker message bridge to bypass host CSP and CORS

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_BACKEND_URL=http://localhost:3000/api
```

If `VITE_BACKEND_URL` is omitted, the extension defaults to `http://localhost:3000/api`.

## Installation and Build

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Commands

```bash
# Install dependencies
npm install

# Build extension for production
npm run build

# Start development server with HMR
npm run dev

# Run code linter
npm run lint
```

## Loading Extension in Chrome

1. Build the extension using `npm run build`.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** via the top-right toggle.
4. Click **Load unpacked** and select the `dist` directory.
5. Use `Alt+M` or click the floating launcher icon to open the player.

## Key Features

- **Background Audio**: Continuous playback through Chrome Offscreen API.
- **Multi-Source Streaming**: Play tracks from Jamendo and YouTube.
- **Queue System**: Reorderable playback queue with session synchronization.
- **Library Management**: Playlists, user favorites, and 30-day listening history.
- **Cross-Tab Synchronization**: Real-time state broadcasting between open browser tabs.
- **Isolated Overlay**: Shadow DOM container prevents style collisions and event leakage with host web pages.
