
import { GameState, PowerUpType, GameObject, PlayerCar, RoadMarking, Decoration, ExplosionParticle, GameConfig } from './types';
import { GameFactory } from './factory';
import { CollisionManager } from './collision';
import { GameRenderer } from './renderer';
import { GameUtils } from './utils';

export { GameState, PowerUpType } from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState = GameState.START_SCREEN;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  
  // Game objects
  private player: PlayerCar | null = null;
  private enemies: GameObject[] = [];
  private seeds: GameObject[] = [];
  private powerUps: GameObject[] = [];
  
  // Road elements
  private roadMarkings: RoadMarking[] = [];
  private decorations: Decoration[] = [];
  
  // Game images
  private playerCarImage: HTMLImageElement;
  private enemyCarImages: HTMLImageElement[] = [];
  private seedImage: HTMLImageElement | null = null;
  private playerCarLoaded: boolean = false;
  private enemyCarLoaded: boolean = false;
  private seedImageLoaded: boolean = false;
  private imagesLoaded: boolean = false;
  private imageLoadErrors: boolean = false;
  
  // Explosion animation
  private explosions: ExplosionParticle[] = [];
  
  // Game parameters
  private score: number = 0;
  private gameSpeed: number = 1;
  private laneWidth: number = 0;
  private roadWidth: number = 0;
  private roadCenterX: number = 0;
  private lanePositions: number[] = [];
  private enemySpawnTimer: number = 0;
  private enemySpawnInterval: number = 2000; // ms
  private seedSpawnTimer: number = 0;
  private seedSpawnInterval: number = 1000; // ms
  private powerUpSpawnTimer: number = 0;
  private powerUpSpawnInterval: number = 15000; // ms
  private difficultyTimer: number = 0;
  private difficultyInterval: number = 30000; // ms
  private gameTime: number = 0;
  private decorationSpawnTimer: number = 0;
  private decorationSpawnInterval: number = 800; // ms
  private roadMarkingTimer: number = 0;
  private roadMarkingInterval: number = 300; // ms
  
  // Power-up states
  private slowModeActive: boolean = false;
  private slowModeTimer: number = 0;
  private slowModeDuration: number = 5000; // ms
  
  // Event callbacks
  private onScoreChange: (score: number) => void;
  private onLivesChange: (lives: number) => void;
  private onGameStateChange: (state: GameState) => void;
  private onPowerUpStart: (type: PowerUpType, duration: number) => void;
  private onPowerUpEnd: (type: PowerUpType) => void;
  private onCollision?: () => void;
  
  // Animation frame id for cleanup
  private animationFrameId: number | null = null;
  
  // Option to use defaults if image is broken
  private useDefaultsIfBroken: boolean = false;

  // High score tracking
  private highScore: number = 0;
  
  constructor(config: GameConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Set callbacks
    this.onScoreChange = config.onScoreChange;
    this.onLivesChange = config.onLivesChange;
    this.onGameStateChange = config.onGameStateChange;
    this.onPowerUpStart = config.onPowerUpStart;
    this.onPowerUpEnd = config.onPowerUpEnd;
    this.onCollision = config.onCollision;
    
    // Initialize game dimensions
    this.calculateDimensions();
    
    // Set flag for fallbacks
    if (config.customAssets?.useDefaultsIfBroken) {
      this.useDefaultsIfBroken = true;
    }
    
    // Load car images with proper error handling
    this.playerCarImage = new Image();
    this.playerCarImage.crossOrigin = "anonymous";
    
    // Create seed image
    if (config.customAssets?.seedImageURL) {
      this.seedImage = new Image();
      this.seedImage.crossOrigin = "anonymous";
    }
    
    // Use custom assets if provided
    if (config.customAssets) {
      this.loadAssets(config);
    } else {
      console.error("No custom assets provided, game cannot initialize properly");
      // Mark as loaded but with errors, so we can use fallbacks
      this.playerCarLoaded = true;
      this.enemyCarLoaded = true;
      this.seedImageLoaded = true;
      this.imageLoadErrors = true;
      this.imagesLoaded = true;
      // Initialize player after images are loaded or failed
      this.player = this.createPlayer();
    }
    
    // Set up event listeners
    this.setupEventListeners();

    // Load high score from local storage
    this.loadHighScore();
  }

  // Public methods
  public resizeCanvas(): void {
    this.calculateDimensions();
    // If player exists, update its position based on new dimensions
    if (this.player) {
      this.player.lanePosition = this.lanePositions[this.player.lane];
      this.player.x = this.player.lanePosition - (this.player.width / 2);
    }
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public cleanup(): void {
    // Cancel animation frame if it exists
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove event listeners
    this.removeEventListeners();
  }

  public startGame(): void {
    // Reset game state
    this.resetGame();
    
    // Start game loop
    this.gameState = GameState.GAMEPLAY;
    this.onGameStateChange(GameState.GAMEPLAY);
    
    // Start game loop if not already running
    if (this.animationFrameId === null) {
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }
  }

  public handleTouchLeft(): void {
    this.movePlayerLeft();
  }

  public handleTouchRight(): void {
    this.movePlayerRight();
  }
  
  public pauseGame(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.gameState = GameState.PAUSED;
      this.onGameStateChange(GameState.PAUSED);
    }
  }
  
  public resumeGame(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.GAMEPLAY;
      this.onGameStateChange(GameState.GAMEPLAY);
      this.lastFrameTime = performance.now();
    }
  }
  
  public restartGame(): void {
    this.resetGame();
    this.gameState = GameState.GAMEPLAY;
    this.onGameStateChange(GameState.GAMEPLAY);
    this.lastFrameTime = performance.now();
    
    if (this.animationFrameId === null) {
      this.gameLoop();
    }
  }

  // Private methods
  private loadAssets(config: GameConfig): void {
    console.log("Using custom car assets:", config.customAssets);
    
    // Load player car image
    this.playerCarImage.onload = () => {
      console.log("Player car image loaded successfully");
      this.playerCarLoaded = true;
      this.checkAllImagesLoaded();
    };
    
    this.playerCarImage.onerror = (e) => {
      console.error("Error loading player car image:", e);
      this.imageLoadErrors = true;
      this.playerCarLoaded = true; // Consider it "loaded" so we can continue with fallbacks
      this.checkAllImagesLoaded();
    };
    
    this.playerCarImage.src = config.customAssets!.playerCarURL;
    
    // Load enemy car images
    let enemyImagesLoaded = 0;
    const totalEnemyImages = config.customAssets!.enemyCarURLs.length;
    
    config.customAssets!.enemyCarURLs.forEach((url, index) => {
      const enemyImg = new Image();
      enemyImg.crossOrigin = "anonymous";
      
      enemyImg.onload = () => {
        console.log(`Enemy car image ${index} loaded successfully`);
        this.enemyCarImages[index] = enemyImg;
        enemyImagesLoaded++;
        
        if (enemyImagesLoaded === totalEnemyImages) {
          this.enemyCarLoaded = true;
          this.checkAllImagesLoaded();
        }
      };
      
      enemyImg.onerror = (e) => {
        console.error(`Error loading enemy car image ${index}:`, e);
        this.imageLoadErrors = true;
        
        // Create a backup image
        const backupImg = new Image();
        backupImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgNjQgMTI4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjQ0IiBoZWlnaHQ9IjEwOCIgcng9IjYiIGZpbGw9IiNERDM3M0MiLz48cmVjdCB4PSIxNiIgeT0iMzIiIHdpZHRoPSIzMiIgaGVpZ2h0PSIyNCIgZmlsbD0iIzIyMjgzOCIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjMjIyIi8+PGNpcmNsZSBjeD0iNDQiIGN5PSIxMDAiIHI9IjgiIGZpbGw9IiMyMjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI0IiBmaWxsPSIjRkZGRjAwIi8+PGNpcmNsZSBjeD0iNDgiIGN5PSIxNiIgcj0iNCIgZmlsbD0iI0ZGRkYwMCIvPjwvc3ZnPg==';
        this.enemyCarImages[index] = backupImg;
        
        enemyImagesLoaded++;
        if (enemyImagesLoaded === totalEnemyImages) {
          this.enemyCarLoaded = true;
          this.checkAllImagesLoaded();
        }
      };
      
      enemyImg.src = url;
    });
    
    // If there are no enemy car URLs, mark as loaded
    if (totalEnemyImages === 0) {
      this.enemyCarLoaded = true;
      this.checkAllImagesLoaded();
    }
    
    // Load seed image if provided
    if (config.customAssets!.seedImageURL && this.seedImage) {
      this.seedImage.onload = () => {
        console.log("Seed image loaded successfully");
        this.seedImageLoaded = true;
        this.checkAllImagesLoaded();
      };
      
      this.seedImage.onerror = (e) => {
        console.error("Error loading seed image:", e);
        this.imageLoadErrors = true;
        this.seedImageLoaded = true; // Consider it "loaded" so we can continue with fallbacks
        this.checkAllImagesLoaded();
      };
      
      this.seedImage.src = config.customAssets!.seedImageURL;
    } else {
      // If no seed image URL provided, consider it loaded
      this.seedImageLoaded = true;
      this.checkAllImagesLoaded();
    }
  }
  
  private checkAllImagesLoaded(): void {
    // Check if all images are loaded
    if (this.playerCarLoaded && this.enemyCarLoaded && this.seedImageLoaded) {
      this.imagesLoaded = true;
      console.log("All images loaded, initializing game");
      
      // Initialize player after images are loaded
      this.player = this.createPlayer();
    }
  }
  
  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private removeEventListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.gameState !== GameState.GAMEPLAY) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        this.movePlayerLeft();
        break;
      case 'ArrowRight':
        this.movePlayerRight();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
    }
  }

  private movePlayerLeft(): void {
    if (!this.player || this.player.transitioning || this.gameState !== GameState.GAMEPLAY) return;
    
    if (this.player.lane > 0) {
      this.player.targetLane = this.player.lane - 1;
      this.player.transitioning = true;
    }
  }

  private movePlayerRight(): void {
    if (!this.player || this.player.transitioning || this.gameState !== GameState.GAMEPLAY) return;
    
    if (this.player.lane < 2) {
      this.player.targetLane = this.player.lane + 1;
      this.player.transitioning = true;
    }
  }

  private togglePause(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.gameState = GameState.PAUSED;
      this.onGameStateChange(GameState.PAUSED);
    } else if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.GAMEPLAY;
      this.onGameStateChange(GameState.GAMEPLAY);
      this.lastFrameTime = performance.now();
    }
  }

  private resetGame(): void {
    // Reset game parameters
    this.score = 0;
    this.onScoreChange(this.score);
    this.gameSpeed = 1;
    this.gameTime = 0;
    
    // Clear game objects
    this.enemies = [];
    this.seeds = [];
    this.powerUps = [];
    this.explosions = [];
    this.roadMarkings = [];
    this.decorations = [];
    
    // Reset timers
    this.enemySpawnTimer = 0;
    this.seedSpawnTimer = 0;
    this.powerUpSpawnTimer = 0;
    this.difficultyTimer = 0;
    this.decorationSpawnTimer = 0;
    this.roadMarkingTimer = 0;
    
    // Reset power-up states
    this.slowModeActive = false;
    this.slowModeTimer = 0;
    
    // Create player if it doesn't exist
    if (!this.player) {
      this.player = this.createPlayer();
    } else {
      // Reset player
      this.player.lives = 3;
      this.player.shield = false;
      this.player.shieldTimer = 0;
      this.player.lane = 1;
      this.player.lanePosition = this.lanePositions[1];
      this.player.targetLane = 1;
      this.player.transitioning = false;
      this.player.x = this.player.lanePosition - (this.player.width / 2);
      this.player.active = true;
    }
    
    // Initialize road markings
    this.initRoadMarkings();
    
    this.onLivesChange(this.player.lives);
  }

  private calculateDimensions(): void {
    // Calculate road and lane dimensions based on canvas size
    this.roadWidth = this.canvas.width * 0.8;
    this.roadCenterX = this.canvas.width / 2;
    this.laneWidth = this.roadWidth / 3;
    
    // Calculate lane center positions
    this.lanePositions = [
      this.roadCenterX - this.laneWidth,
      this.roadCenterX,
      this.roadCenterX + this.laneWidth
    ];
  }

  private initRoadMarkings(): void {
    // Add initial road markings
    const markingsPerScreen = Math.ceil(this.canvas.height / 80) + 1;
    for (let i = 0; i < markingsPerScreen; i++) {
      this.createRoadMarking(i * 80);
    }
  }

  private loadHighScore(): void {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10);
    }
  }

  private saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore.toString());
    }
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Don't update if game is paused
    if (this.gameState === GameState.GAMEPLAY) {
      this.update(deltaTime);
    }
    
    this.render();
    
    // Continue game loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number): void {
    // Update game time
    this.gameTime += deltaTime;
    
    // Accumulate time for fixed time step updates
    this.accumulatedTime += deltaTime;
    
    // Update at fixed time steps
    const timeStep = 16; // ~60 fps
    while (this.accumulatedTime >= timeStep) {
      this.updateGameState(timeStep);
      this.accumulatedTime -= timeStep;
    }
  }

  private updateGameState(deltaTime: number): void {
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
    }
    
    // Update enemies
    this.enemies.forEach(enemy => enemy.update(deltaTime));
    this.enemies = this.enemies.filter(enemy => enemy.active);
    
    // Update seeds
    this.seeds.forEach(seed => seed.update(deltaTime));
    this.seeds = this.seeds.filter(seed => seed.active);
    
    // Update power-ups
    this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
    this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
    
    // Update road markings
    this.roadMarkings.forEach(marking => marking.update(deltaTime));
    this.roadMarkings = this.roadMarkings.filter(marking => marking.active);
    
    // Update decorations
    this.decorations.forEach(decoration => decoration.update(deltaTime));
    this.decorations = this.decorations.filter(decoration => decoration.active);
    
    // Update explosions
    this.updateExplosions(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Spawn game objects
    this.updateSpawns(deltaTime);
    
    // Update power-up timers
    this.updatePowerUps(deltaTime);
    
    // Update difficulty
    this.updateDifficulty(deltaTime);
  }

  private updateExplosions(deltaTime: number): void {
    // Update explosion particles
    this.explosions.forEach(particle => {
      particle.x += particle.vx * deltaTime * 0.05;
      particle.y += particle.vy * deltaTime * 0.05;
      particle.currentLife -= deltaTime;
      particle.alpha = particle.currentLife / particle.lifetime;
    });
    
    // Remove expired particles
    this.explosions = this.explosions.filter(particle => particle.currentLife > 0);
  }

  private checkCollisions(): void {
    if (!this.player || this.gameState !== GameState.GAMEPLAY) return;
    
    // Check enemy collisions
    this.enemies.forEach(enemy => {
      if (CollisionManager.checkPreciseCollision(this.player!, enemy)) {
        if (this.player!.shield) {
          // Player has shield, destroy enemy
          enemy.active = false;
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        } else {
          // Player takes damage
          this.player!.lives--;
          this.onLivesChange(this.player!.lives);
          enemy.active = false;
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          
          // Call collision callback for sound effect
          if (this.onCollision) {
            this.onCollision();
          }
          
          // Check game over
          if (this.player!.lives <= 0) {
            this.gameOver();
          }
        }
      }
    });
    
    // Check seed collisions
    this.seeds.forEach(seed => {
      if (CollisionManager.isColliding(this.player!, seed)) {
        seed.active = false;
        this.score += 10;
        this.onScoreChange(this.score);
      }
    });
    
    // Check power-up collisions
    this.powerUps.forEach(powerUp => {
      if (CollisionManager.isColliding(this.player!, powerUp) && powerUp.powerUpType !== undefined) {
        powerUp.active = false;
        
        switch (powerUp.powerUpType) {
          case PowerUpType.SLOW_SPEED:
            this.activateSlowMode();
            break;
          case PowerUpType.SHIELD:
            this.activateShield();
            break;
          case PowerUpType.EXTRA_LIFE:
            this.addExtraLife();
            break;
        }
      }
    });
  }

  private createExplosion(x: number, y: number): void {
    const newExplosions = GameUtils.createExplosion(x, y);
    this.explosions.push(...newExplosions);
  }

  private updateSpawns(deltaTime: number): void {
    // Spawn enemies
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }
    
    // Spawn seeds
    this.seedSpawnTimer += deltaTime;
    if (this.seedSpawnTimer >= this.seedSpawnInterval) {
      this.spawnSeed();
      this.seedSpawnTimer = 0;
    }
    
    // Spawn power-ups
    this.powerUpSpawnTimer += deltaTime;
    if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }
    
    // Spawn road markings
    this.roadMarkingTimer += deltaTime;
    if (this.roadMarkingTimer >= this.roadMarkingInterval) {
      this.createRoadMarking(-80); // Start above the canvas
      this.roadMarkingTimer = 0;
    }
    
    // Spawn decorations (trees and bushes)
    this.decorationSpawnTimer += deltaTime;
    if (this.decorationSpawnTimer >= this.decorationSpawnInterval) {
      this.spawnDecoration();
      this.decorationSpawnTimer = 0;
    }
  }

  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    this.onGameStateChange(GameState.GAME_OVER);
    
    // Save high score
    this.saveHighScore();
  }

  private activateSlowMode(): void {
    this.slowModeActive = true;
    this.slowModeTimer = 0;
    this.onPowerUpStart(PowerUpType.SLOW_SPEED, this.slowModeDuration);
  }

  private activateShield(): void {
    if (this.player) {
      this.player.shield = true;
      this.player.shieldTimer = 0;
      this.onPowerUpStart(PowerUpType.SHIELD, 3000); // 3 seconds
    }
  }

  private addExtraLife(): void {
    if (this.player) {
      this.player.lives++;
      this.onLivesChange(this.player.lives);
      this.onPowerUpStart(PowerUpType.EXTRA_LIFE, 0);
    }
  }

  private updatePowerUps(deltaTime: number): void {
    // Update slow mode timer
    if (this.slowModeActive) {
      this.slowModeTimer += deltaTime;
      if (this.slowModeTimer >= this.slowModeDuration) {
        this.slowModeActive = false;
        this.slowModeTimer = 0;
        this.onPowerUpEnd(PowerUpType.SLOW_SPEED);
      }
    }
    
    // Shield is handled by the player object
    if (this.player && this.player.shield && this.player.shieldTimer >= 3000) {
      this.onPowerUpEnd(PowerUpType.SHIELD);
    }
  }

  private updateDifficulty(deltaTime: number): void {
    // Increase difficulty over time
    this.difficultyTimer += deltaTime;
    if (this.difficultyTimer >= this.difficultyInterval) {
      // Increase game speed
      this.gameSpeed *= 1.1;
      
      // Decrease spawn intervals
      this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval * 0.9);
      this.seedSpawnInterval = Math.max(300, this.seedSpawnInterval * 0.95);
      
      this.difficultyTimer = 0;
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    GameRenderer.drawBackground(this.ctx, this.canvas, this.roadWidth, this.roadCenterX);
    
    // Draw decorations
    this.decorations.forEach(decoration => decoration.render(this.ctx));
    
    // Draw road markings
    this.roadMarkings.forEach(marking => marking.render(this.ctx));
    
    // Draw game objects
    this.seeds.forEach(seed => seed.render(this.ctx));
    this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    
    // Draw player
    if (this.player && this.gameState === GameState.GAMEPLAY) {
      this.player.render(this.ctx);
    }
    
    // Draw explosions
    GameRenderer.drawExplosions(this.ctx, this.explosions);
    
    // Draw UI
    GameRenderer.drawUI(
      this.ctx, 
      this.canvas, 
      GameState[this.gameState], 
      this.score, 
      this.player ? this.player.lives : 0, 
      this.highScore
    );
  }

  // Factory methods
  private createPlayer(): PlayerCar {
    return GameFactory.createPlayer(
      this.lanePositions,
      this.laneWidth,
      this.canvas.height,
      this.playerCarImage
    );
  }

  private createEnemy(lane: number): GameObject {
    return GameFactory.createEnemy(
      lane,
      this.lanePositions,
      this.laneWidth,
      this.canvas.height,
      this.gameSpeed,
      this.enemyCarImages,
      this.slowModeActive
    );
  }

  private spawnEnemy(): void {
    const lane = Math.floor(Math.random() * 3);
    this.enemies.push(this.createEnemy(lane));
  }

  private spawnSeed(): void {
    // Create a seed at a random lane
    const lane = Math.floor(Math.random() * 3);
    const seed = GameFactory.createSeed(
      lane,
      this.lanePositions,
      this.laneWidth,
      this.canvas.height,
      this.gameSpeed,
      this.seedImage,
      this.slowModeActive,
      GameRenderer.drawSeedFallback
    );
    this.seeds.push(seed);
  }

  private spawnPowerUp(): void {
    const lane = Math.floor(Math.random() * 3);
    const powerUp = GameFactory.createPowerUp(
      lane,
      this.lanePositions,
      this.laneWidth,
      this.canvas.height,
      this.gameSpeed,
      this.slowModeActive
    );
    this.powerUps.push(powerUp);
  }

  private createRoadMarking(y: number): void {
    const roadMarking = GameFactory.createRoadMarking(
      y,
      this.canvas.width,
      this.roadWidth,
      this.roadCenterX,
      this.gameSpeed,
      this.canvas.height,
      this.slowModeActive
    );
    this.roadMarkings.push(roadMarking);
  }

  private spawnDecoration(): void {
    const decoration = GameFactory.createDecoration(
      this.canvas.width,
      this.roadWidth,
      this.canvas.height,
      this.gameSpeed,
      this.slowModeActive
    );
    this.decorations.push(decoration);
  }
}
