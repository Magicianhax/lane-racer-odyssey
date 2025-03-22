
import { GameState, PowerUpType, PlayerCar, GameObject, RoadMarking, Decoration, ExplosionParticle, GameConfig } from './types';
import { createPlayer, createEnemy, createRoadMarking, createDecoration, createPowerUp, createSeed } from './factories';
import { isColliding, createExplosionParticles, drawSeedFallback, updateExplosionParticles } from './utils';
import { GameRenderer } from './renderer';

export { GameState, PowerUpType } from './types';

export class GameEngine {
  // Canvas and context
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  
  // Game state
  private gameState: GameState = GameState.START_SCREEN;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  
  // Game objects
  private player: PlayerCar | null = null;
  private enemies: GameObject[] = [];
  private seeds: GameObject[] = [];
  private powerUps: GameObject[] = [];
  private roadMarkings: RoadMarking[] = [];
  private decorations: Decoration[] = [];
  private explosions: ExplosionParticle[] = [];
  
  // Game images
  private playerCarImage: HTMLImageElement;
  private enemyCarImages: HTMLImageElement[] = [];
  private seedImage: HTMLImageElement | null = null;
  private playerCarLoaded: boolean = false;
  private enemyCarLoaded: boolean = false;
  private seedImageLoaded: boolean = false;
  private imagesLoaded: boolean = false;
  private imageLoadErrors: boolean = false;
  
  // Game parameters
  private score: number = 0;
  private seedCount: number = 0;
  private gameSpeed: number = 1;
  private laneWidth: number = 0;
  private roadWidth: number = 0;
  private roadCenterX: number = 0;
  private lanePositions: number[] = [];
  
  // Spawn timers
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
  private onSeedCollected: (count: number) => void;
  private onPowerUpStart: (type: PowerUpType, duration: number) => void;
  private onPowerUpEnd: (type: PowerUpType) => void;
  
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
    this.onSeedCollected = config.onSeedCollected;
    this.onPowerUpStart = config.onPowerUpStart;
    this.onPowerUpEnd = config.onPowerUpEnd;
    
    // Initialize game dimensions
    this.calculateDimensions();
    
    // Create renderer
    this.renderer = new GameRenderer(this.canvas, this.roadWidth, this.roadCenterX);
    
    // Set flag for fallbacks
    if (config.customAssets?.useDefaultsIfBroken) {
      this.useDefaultsIfBroken = true;
    }
    
    // Load assets
    this.loadAssets(config);
    
    // Set up event listeners
    this.setupEventListeners();

    // Load high score from local storage
    this.loadHighScore();
  }
  
  private loadAssets(config: GameConfig): void {
    // Load car images with proper error handling
    this.playerCarImage = new Image();
    this.playerCarImage.crossOrigin = "anonymous"; // Try to fix CORS issues
    
    // Create seed image
    if (config.customAssets?.seedImageURL) {
      this.seedImage = new Image();
      this.seedImage.crossOrigin = "anonymous";
    }
    
    // Use custom assets if provided
    if (config.customAssets) {
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
      
      this.playerCarImage.src = config.customAssets.playerCarURL;
      
      // Load enemy car images
      let enemyImagesLoaded = 0;
      const totalEnemyImages = config.customAssets.enemyCarURLs.length;
      
      config.customAssets.enemyCarURLs.forEach((url, index) => {
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
      if (config.customAssets.seedImageURL && this.seedImage) {
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
        
        this.seedImage.src = config.customAssets.seedImageURL;
      } else {
        // If no seed image URL provided, consider it loaded
        this.seedImageLoaded = true;
        this.checkAllImagesLoaded();
      }
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
  }
  
  private checkAllImagesLoaded(): void {
    if (this.playerCarLoaded && this.enemyCarLoaded && this.seedImageLoaded) {
      console.log("All images loaded, initializing game");
      this.imagesLoaded = true;
      
      // Initialize player after images are loaded or failed
      this.player = this.createPlayer();
    }
  }
  
  public resizeCanvas(): void {
    this.calculateDimensions();
    
    // Update renderer with new dimensions
    this.renderer = new GameRenderer(this.canvas, this.roadWidth, this.roadCenterX);
    
    // If player exists, update its position based on new dimensions
    if (this.player) {
      this.player.lanePosition = this.lanePositions[this.player.lane];
      this.player.x = this.player.lanePosition - (this.player.width / 2);
    }
  }
  
  private calculateDimensions(): void {
    // Calculate road and lane dimensions
    this.roadWidth = this.canvas.width * 0.6;
    this.roadCenterX = this.canvas.width / 2;
    this.laneWidth = this.roadWidth / 3;
    
    // Calculate lane center positions
    this.lanePositions = [
      this.roadCenterX - this.laneWidth,  // Left lane
      this.roadCenterX,                   // Center lane
      this.roadCenterX + this.laneWidth   // Right lane
    ];
  }
  
  private createPlayer(): PlayerCar {
    // Player car dimensions
    const width = this.laneWidth * 0.7;
    const height = width * 2; // Car is twice as long as it is wide
    
    // Start in the middle lane (lane 1)
    const lane = 1;
    const lanePosition = this.lanePositions[lane];
    
    // Position car at the bottom of the screen
    const x = lanePosition - (width / 2);
    const y = this.canvas.height - height - 20; // 20px buffer from bottom
    
    return {
      x,
      y,
      width,
      height,
      lane,
      lanePosition,
      targetLane: lane,
      transitioning: false,
      active: true,
      lives: 3,
      shield: false,
      shieldTimer: 0,
      update: (delta: number) => {
        // Handle lane transitions
        if (this.player!.transitioning) {
          const targetLanePos = this.lanePositions[this.player!.targetLane];
          const distance = targetLanePos - this.player!.lanePosition;
          const moveSpeed = 0.01 * delta;
          
          if (Math.abs(distance) <= moveSpeed) {
            // We've arrived at the target lane
            this.player!.lanePosition = targetLanePos;
            this.player!.lane = this.player!.targetLane;
            this.player!.transitioning = false;
          } else {
            // Move towards target lane
            this.player!.lanePosition += (distance > 0 ? moveSpeed : -moveSpeed);
          }
          
          // Update x position based on lane position
          this.player!.x = this.player!.lanePosition - (this.player!.width / 2);
        }
        
        // Update shield timer
        if (this.player!.shield && this.player!.shieldTimer > 0) {
          this.player!.shieldTimer -= delta;
          if (this.player!.shieldTimer <= 0) {
            this.player!.shield = false;
            this.onPowerUpEnd(PowerUpType.SHIELD);
          }
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // If the player has a shield, draw it
        if (this.player!.shield) {
          const glow = ctx.createRadialGradient(
            this.player!.x + this.player!.width / 2, this.player!.y + this.player!.height / 2, this.player!.width * 0.4,
            this.player!.x + this.player!.width / 2, this.player!.y + this.player!.height / 2, this.player!.width * 0.8
          );
          glow.addColorStop(0, 'rgba(76, 201, 240, 0.3)');
          glow.addColorStop(1, 'rgba(76, 201, 240, 0)');
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.ellipse(
            this.player!.x + this.player!.width / 2, 
            this.player!.y + this.player!.height / 2, 
            this.player!.width * 0.8, 
            this.player!.height * 0.6, 
            0, 0, Math.PI * 2
          );
          ctx.fill();
        }
        
        // Draw the player car image
        try {
          ctx.drawImage(this.playerCarImage, this.player!.x, this.player!.y, this.player!.width, this.player!.height);
        } catch (e) {
          console.error("Error rendering player car:", e);
          // Fallback to a basic car shape if image fails
          ctx.fillStyle = '#4cc9f0';
          ctx.fillRect(this.player!.x, this.player!.y, this.player!.width, this.player!.height);
          
          // Windows
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(this.player!.x + this.player!.width * 0.2, this.player!.y + this.player!.height * 0.2, this.player!.width * 0.6, this.player!.height * 0.25);
          
          // Wheels
          ctx.fillStyle = '#000';
          ctx.fillRect(this.player!.x - 2, this.player!.y + this.player!.height * 0.2, 4, this.player!.height * 0.15);
          ctx.fillRect(this.player!.x + this.player!.width - 2, this.player!.y + this.player!.height * 0.2, 4, this.player!.height * 0.15);
          ctx.fillRect(this.player!.x - 2, this.player!.y + this.player!.height * 0.65, 4, this.player!.height * 0.15);
          ctx.fillRect(this.player!.x + this.player!.width - 2, this.player!.y + this.player!.height * 0.65, 4, this.player!.height * 0.15);
        }
        
        ctx.restore();
      }
    };
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
  
  // Game over handler
  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    this.onGameStateChange(GameState.GAME_OVER);
    
    // Save high score
    this.saveHighScore();
  }
  
  public handleTouchLeft(): void {
    this.movePlayerLeft();
  }

  public handleTouchRight(): void {
    this.movePlayerRight();
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
    this.seedCount = 0;
    this.onSeedCollected(this.seedCount);
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
    this.explosions = updateExplosionParticles(this.explosions, deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Spawn game objects
    this.updateSpawns(deltaTime);
    
    // Update power-up timers
    this.updatePowerUps(deltaTime);
    
    // Update difficulty
    this.updateDifficulty(deltaTime);
  }

  private updatePowerUps(deltaTime: number): void {
    // Update slow mode timer
    if (this.slowModeActive) {
      this.slowModeTimer -= deltaTime;
      if (this.slowModeTimer <= 0) {
        this.slowModeActive = false;
        this.onPowerUpEnd(PowerUpType.SLOW_SPEED);
      }
    }
  }

  private updateDifficulty(deltaTime: number): void {
    // Increase difficulty over time
    this.difficultyTimer += deltaTime;
    if (this.difficultyTimer >= this.difficultyInterval) {
      this.gameSpeed += 0.1;
      this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval - 100);
      this.difficultyTimer = 0;
    }
  }

  private checkCollisions(): void {
    if (!this.player || this.gameState !== GameState.GAMEPLAY) return;
    
    // Check enemy collisions - use a smaller collision box for more precise collisions
    this.enemies.forEach(enemy => {
      const collisionMargin = 10; // Reduce collision box size by this amount on each side
      
      // Create tighter collision box for more precise collision detection
      const playerBox = {
        x: this.player!.x + collisionMargin,
        y: this.player!.y + collisionMargin,
        width: this.player!.width - (collisionMargin * 2),
        height: this.player!.height - (collisionMargin * 2)
      };
      
      const enemyBox = {
        x: enemy.x + collisionMargin,
        y: enemy.y + collisionMargin,
        width: enemy.width - (collisionMargin * 2),
        height: enemy.height - (collisionMargin * 2)
      };
      
      // Check if the tighter boxes are colliding
      if (
        playerBox.x < enemyBox.x + enemyBox.width &&
        playerBox.x + playerBox.width > enemyBox.x &&
        playerBox.y < enemyBox.y + enemyBox.height &&
        playerBox.y + playerBox.height > enemyBox.y
      ) {
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
          
          // Check game over
          if (this.player!.lives <= 0) {
            this.gameOver();
          }
        }
      }
    });
    
    // Check seed collisions
    this.seeds.forEach(seed => {
      if (isColliding(this.player!, seed)) {
        seed.active = false;
        this.score += 10;
        this.seedCount++;
        this.onScoreChange(this.score);
        this.onSeedCollected(this.seedCount);
      }
    });
    
    // Check power-up collisions
    this.powerUps.forEach(powerUp => {
      if (isColliding(this.player!, powerUp) && powerUp.powerUpType !== undefined) {
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
  
  private activateSlowMode(): void {
    this.slowModeActive = true;
    this.slowModeTimer = this.slowModeDuration;
    this.onPowerUpStart(PowerUpType.SLOW_SPEED, this.slowModeDuration);
  }
  
  private activateShield(): void {
    if (this.player) {
      this.player.shield = true;
      this.player.shieldTimer = 5000; // 5 seconds shield
      this.onPowerUpStart(PowerUpType.SHIELD, 5000);
    }
  }
  
  private addExtraLife(): void {
    if (this.player) {
      this.player.lives = Math.min(this.player.lives + 1, 5); // Max 5 lives
      this.onLivesChange(this.player.lives);
      this.onPowerUpStart(PowerUpType.EXTRA_LIFE, 0);
    }
  }

  private createExplosion(x: number, y: number): void {
    // Generate explosion particles
    const newParticles = createExplosionParticles(x, y);
    this.explosions = [...this.explosions, ...newParticles];
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

  private spawnEnemy(): void {
    const lane = Math.floor(Math.random() * 3);
    
    // Create dimensions that fit the lane
    const width = this.laneWidth * 0.7;
    const height = width * 2;
    
    // Position on the specified lane
    const lanePosition = this.lanePositions[lane];
    const x = lanePosition - (width / 2);
    
    // Start above the canvas
    const y = -height * 2;
    
    // Choose a random enemy car image
    const imageIndex = Math.floor(Math.random() * this.enemyCarImages.length);
    
    const enemy: GameObject = {
      x,
      y,
      width,
      height,
      lane,
      active: true,
      type: 'enemy',
      update: (delta: number) => {
        // Move the enemy car downward
        const speed = 0.3 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        enemy.y += speed * delta;
        
        // Check if out of bounds
        if (enemy.y > this.canvas.height) {
          enemy.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Draw the enemy car image
        try {
          if (this.enemyCarImages.length > 0 && this.enemyCarImages[imageIndex]) {
            ctx.drawImage(this.enemyCarImages[imageIndex], enemy.x, enemy.y, enemy.width, enemy.height);
          } else {
            throw new Error("Enemy car image not available");
          }
        } catch (e) {
          console.error("Error rendering enemy car:", e);
          // Fallback to a basic car shape if image fails
          ctx.fillStyle = '#ff5e5e';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Windows
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(enemy.x + enemy.width * 0.2, enemy.y + enemy.height * 0.2, enemy.width * 0.6, enemy.height * 0.25);
          
          // Wheels
          ctx.fillStyle = '#000';
          ctx.fillRect(enemy.x - 2, enemy.y + enemy.height * 0.2, 4, enemy.height * 0.15);
          ctx.fillRect(enemy.x + enemy.width - 2, enemy.y + enemy.height * 0.2, 4, enemy.height * 0.15);
          ctx.fillRect(enemy.x - 2, enemy.y + enemy.height * 0.65, 4, enemy.height * 0.15);
          ctx.fillRect(enemy.x + enemy.width - 2, enemy.y + enemy.height * 0.65, 4, enemy.height * 0.15);
        }
        
        ctx.restore();
      }
    };
    
    this.enemies.push(enemy);
  }

  private spawnSeed(): void {
    // Create a seed at a random lane
    const lane = Math.floor(Math.random() * 3);
    
    // Seed size is doubled from the original size (2x bigger)
    const width = this.laneWidth * 0.4; // 0.2 * 2 = 0.4
    const height = width;
    
    const seed: GameObject = {
      x: this.lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'seed',
      update: (delta: number) => {
        const speed = 0.25 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        seed.y += speed * delta;
        
        // Check if out of bounds
        if (seed.y > this.canvas.height) {
          seed.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Try to use the seed image if available
        if (this.seedImage) {
          try {
            ctx.drawImage(
              this.seedImage,
              seed.x,
              seed.y,
              seed.width,
              seed.height
            );
            
            // Add a subtle glow effect behind the image
            ctx.shadowColor = '#ffdb4d';
            ctx.shadowBlur = 10;
            ctx.drawImage(
              this.seedImage,
              seed.x,
              seed.y,
              seed.width,
              seed.height
            );
            ctx.shadowBlur = 0;
          } catch (e) {
            // Fall back to drawing a circle if the image fails
            drawSeedFallback(ctx, seed);
          }
        } else {
          // No image available, use fallback
          drawSeedFallback(ctx, seed);
        }
        
        ctx.restore();
      }
    };
    
    this.seeds.push(seed);
  }

  private spawnPowerUp(): void {
    // Create a power-up at a random lane
    const lane = Math.floor(Math.random() * 3);
    
    // Randomly choose power-up type
    const powerUpType = Math.floor(Math.random() * 3) as PowerUpType;
    
    // Power-up size is medium (between seed and car)
    const width = this.laneWidth * 0.3;
    const height = width;
    
    const powerUp = createPowerUp(
      lane,
      this.lanePositions,
      this.laneWidth,
      this.gameSpeed,
      this.slowModeActive,
      this.canvas.height,
      powerUpType
    );
    
    this.powerUps.push(powerUp);
  }

  private createRoadMarking(y: number): void {
    const roadMarking = createRoadMarking(
      y,
      this.roadWidth,
      this.roadCenterX,
      this.gameSpeed,
      this.slowModeActive,
      this.canvas.height
    );
    
    this.roadMarkings.push(roadMarking);
  }

  private spawnDecoration(): void {
    const decoration = createDecoration(
      this.canvas.width,
      this.roadWidth,
      this.roadCenterX,
      this.gameSpeed,
      this.slowModeActive,
      this.canvas.height
    );
    
    this.decorations.push(decoration);
  }

  private render(): void {
    // Use the renderer to draw the game
    this.renderer.render(
      this.gameState,
      this.player,
      this.enemies,
      this.seeds,
      this.powerUps,
      this.roadMarkings,
      this.decorations,
      this.explosions
    );
  }
}
