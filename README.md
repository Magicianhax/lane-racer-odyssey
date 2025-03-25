# Superseed Lane Runner

A fast-paced lane-switching car game where you collect seeds while avoiding obstacles.

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

## Blockchain Integration

The game integrates with the Superseed blockchain, allowing players to record their high scores on-chain. The game uses a smart contract to store and track player scores.

### Smart Contract Details

Contract Address: [0x705C86Ee2e1423E5E869A297105Aa1333D92CCa4](https://sepolia-explorer.superseed.xyz/address/0x705C86Ee2e1423E5E869A297105Aa1333D92CCa4)

The `GameScoreTracker` smart contract handles all score-related functionality:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GameScoreTracker {
    struct Score {
        address player;
        uint256 score;
        uint256 timestamp;
    }
    
    // Map player addresses to their best score
    mapping(address => Score) public playerHighScores;
    
    // Array to keep track of all high scores
    Score[] public topScores;
    uint256 public constant MAX_TOP_SCORES = 10;
    
    // Events
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event NewHighScore(address indexed player, uint256 score, uint256 timestamp);
    
    // Submit a new score
    function submitScore(uint256 _score) external {
        // Update player's high score if this is better
        if (_score > playerHighScores[msg.sender].score || playerHighScores[msg.sender].player == address(0)) {
            playerHighScores[msg.sender] = Score({
                player: msg.sender,
                score: _score,
                timestamp: block.timestamp
            });
            
            emit NewHighScore(msg.sender, _score, block.timestamp);
            
            // Check if this score qualifies for the top scores
            _updateTopScores(Score({
                player: msg.sender,
                score: _score,
                timestamp: block.timestamp
            }));
        }
        
        emit ScoreSubmitted(msg.sender, _score, block.timestamp);
    }
    
    // Get player's high score
    function getPlayerHighScore() external view returns (uint256) {
        return playerHighScores[msg.sender].score;
    }
    
    // Get all top scores
    function getTopScores() external view returns (Score[] memory) {
        return topScores;
    }
    
    // Internal function to update top scores
    function _updateTopScores(Score memory newScore) internal {
        // If we have fewer than MAX_TOP_SCORES, just add it
        if (topScores.length < MAX_TOP_SCORES) {
            topScores.push(newScore);
            // Sort the array
            _sortTopScores();
            return;
        }
        
        // Check if the new score is higher than the lowest score
        if (newScore.score > topScores[topScores.length - 1].score) {
            // Replace the lowest score
            topScores[topScores.length - 1] = newScore;
            // Sort the array
            _sortTopScores();
        }
    }
    
    // Simple bubble sort for the top scores (fine for small arrays)
    function _sortTopScores() internal {
        for (uint i = 0; i < topScores.length - 1; i++) {
            for (uint j = 0; j < topScores.length - i - 1; j++) {
                if (topScores[j].score < topScores[j + 1].score) {
                    Score memory temp = topScores[j];
                    topScores[j] = topScores[j + 1];
                    topScores[j + 1] = temp;
                }
            }
        }
    }
}
```

### Contract Functionality

1. **Score Submission**: When players finish a game, their score is submitted to the blockchain if they have a wallet connected.
2. **High Score Tracking**: The contract stores each player's personal high score.
3. **Global Leaderboard**: The top 10 highest scores across all players are maintained and can be viewed in the game's leaderboard.
4. **Sorting and Ranking**: Scores are automatically sorted in descending order.

## How to Play

1. Start the game by clicking the "Start Game" button
2. Use arrow keys or click/tap to switch lanes
3. Collect seeds while avoiding enemy cars
4. Use power-ups strategically to survive longer
5. Try to beat your high score with each play
6. Connect to the blockchain to record your scores
7. Check the leaderboard to see how you rank globally

## Game Implementation Details

The game is built using a canvas-based rendering engine with React for the UI components:

- `GameEngine.ts`: Core game logic, collision detection, and state management
- `Game.tsx`: React component that integrates the game engine with the UI
- Custom sound management for game effects
- Responsive design that works on both desktop and mobile devices
- Blockchain integration for score tracking and leaderboards
