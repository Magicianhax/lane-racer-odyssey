
# Superseed Lane Runner

A fast-paced lane-switching car game where you collect seeds while avoiding obstacles.

## Project info

**URL**: https://lovable.dev/projects/6ac891d1-4316-46e0-87b2-c2e47b4eca71

## Game Rules

### Objective
- Drive your car down the highway, collecting seeds while avoiding enemy cars
- Survive as long as possible and achieve the highest score
- Unlock achievements by reaching specific milestones

### Core Mechanics
- **Movement**: Switch between three lanes using left/right arrow keys or by tapping/clicking the lane you want to move to
- **Scoring**: Earn points by collecting seeds and surviving longer
- **Lives**: You start with 3 lives; lose a life when you crash into an enemy car
- **Difficulty**: Game speed gradually increases over time, making it progressively challenging

### Power-ups
- **Shield**: Temporary protection from crashes
- **Slow Timer**: Temporarily reduces game speed
- **Extra Life**: Adds one additional life (up to the maximum)

### Controls
- **Arrow Keys**: Switch lanes (left/right)
- **Mouse/Touch**: Click/tap on a lane to move there
- **P Key**: Pause/resume game
- **M Key**: Mute/unmute sounds

## Game Features

### Sound Effects
- Engine sound during gameplay
- Crash sound when colliding with enemy cars
- Seed collection sound
- Power-up activation sounds
- UI interaction sounds

### Visual Elements
- Player car with animation
- Enemy cars with different appearances
- Seed collectibles
- Power-up indicators
- Lives and score display
- Dynamic background

### Game States
- Start Screen
- Active Gameplay
- Paused Game
- Game Over Screen

## How to Play

1. Start the game by clicking the "Start Game" button
2. Use arrow keys or click/tap to switch lanes
3. Collect seeds while avoiding enemy cars
4. Use power-ups strategically to survive longer
5. Try to beat your high score with each play

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6ac891d1-4316-46e0-87b2-c2e47b4eca71) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- HTML5 Canvas for the game rendering

## Game Implementation Details

The game is built using a canvas-based rendering engine with React for the UI components:

- `GameEngine.ts`: Core game logic, collision detection, and state management
- `Game.tsx`: React component that integrates the game engine with the UI
- Custom sound management for game effects
- Responsive design that works on both desktop and mobile devices

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6ac891d1-4316-46e0-87b2-c2e47b4eca71) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
