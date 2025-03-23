// Main game engine class

export enum GameState {
  START_SCREEN,
  GAMEPLAY,
  PAUSED,
  GAME_OVER
}

export enum PowerUpType {
  SLOW_SPEED,
  SHIELD,
  EXTRA_LIFE
}

// Extended GameObject interface to include powerUpType for power-ups
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
  active: boolean;
  type?: string;
  powerUpType?: PowerUpType; // Ensure this is defined in the interface
  update: (delta: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export interface PlayerCar extends GameObject {
  lives: number;
  shield: boolean;
  shieldTimer: number;
  lanePosition: number;
  targetLane: number;
  transitioning: boolean;
}

// New interface for explosion particles
export interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  currentLife: number;
}

// New interface for road marking
export interface RoadMarking {
  y: number;
  active: boolean;
  update: (delta: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

// New interface for decorative elements
export interface Decoration {
  x: number;
  y: number;
  type: 'tree' | 'bush';
  size: number;
  active: boolean;
  update: (delta: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export interface GameConfig {
  canvas: HTMLCanvasElement;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  onPowerUpStart: (type: PowerUpType, duration: number) => void;
  onPowerUpEnd: (type: PowerUpType) => void;
  onCollision?: () => void; // New collision callback
  customAssets?: {
    playerCarURL: string;
    enemyCarURLs: string[];
    seedImageURL?: string; // Added support for seed image
    useDefaultsIfBroken?: boolean;
  };
}

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
  private seedImage: HTMLImageElement | null = null; // Added seed image
  private playerCarLoaded: boolean = false;
  private enemyCarLoaded: boolean = false;
  private seedImageLoaded: boolean = false; // Added seed image loaded flag
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
  
  // Add new collision callback
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
    this.onCollision = config.onCollision; // Set collision callback
    
    // Initialize game dimensions
    this.calculateDimensions();
    
    // Set flag for fallbacks
    if (config.customAssets?.useDefaultsIfBroken) {
      this.useDefaultsIfBroken = true;
    }
    
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
          backupImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgNjQgMTI4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjQ0IiBoZWlnaHQ9IjEwOCIgcng9IjYiIGZpbGw9IiNERDM3M0MiLz48cmVjdCB4PSIxNiIgeT0iMzIiIHdpZHRoPSIzMiIgaGVpZ2h0PSIyNCIgZmlsbD0iIzIyMjgzOCIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMTAwIiByPSI4IiBmaWxsPSIjMjIyIi8+PGNpcmNsZSBjeD0iNDQiIGN5PSIxMDAiIHI9IjgiIGZpbGw9IiMyMjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI0IiBmaWxsPSIjRkZGRjAwIi8+PGNpcmNsZSBjeD0iNDgiIGN5PSIxNiIgcj0iNCIgZmlsbD0iI0ZGRkYwMCIvPjwvc3ZnPg==';
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
    
    // Set up event listeners
    this.setupEventListeners();

    // Load high score from local storage
    this.loadHighScore();
  }

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
      if (this.isColliding(this.player!, seed)) {
        seed.active = false;
        this.score += 10;
        this.onScoreChange(this.score);
      }
    });
    
    // Check power-up collisions
    this.powerUps.forEach(powerUp => {
      if (this.isColliding(this.player!, powerUp) && powerUp.powerUpType !== undefined) {
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

  private isColliding(obj1: GameObject, obj2: GameObject): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  private createExplosion(x: number, y: number): void {
    const particleCount = 20;
    const colors = ['#ff6600', '#ffcc00', '#ff3300', '#ff9900'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const size = 2 + Math.random() * 6;
      const lifetime = 500 + Math.random() * 1000;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.explosions.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        alpha: 1,
        lifetime,
        currentLife: lifetime
      });
    }
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
    this.enemies.push(this.createEnemy(lane));
  }

  private spawnSeed(): void {
    // Create a seed at a random lane
    const lane = Math.floor(Math.random() * 3);
    
    // Seed size is DOUBLED from the original size (2x bigger)
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
            this.drawSeedFallback(ctx, seed);
          }
        } else {
          // No image available, use fallback
          this.drawSeedFallback(ctx, seed);
        }
        
        ctx.restore();
      }
    };
    
    this.seeds.push(seed);
  }

  private drawSeedFallback(ctx: CanvasRenderingContext2D, seed: GameObject): void {
    // Draw seed (a small circle)
    ctx.fillStyle = '#ffdb4d';
    ctx.beginPath();
    ctx.arc(
      seed.x + seed.width / 2,
      seed.y + seed.height / 2,
      seed.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Add a small glow effect
    ctx.shadowColor = '#ffdb4d';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
      seed.x + seed.width / 2,
      seed.y + seed.height / 2,
      seed.width / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  private spawnPowerUp(): void {
    // Create a power-up at a random lane
    const lane = Math.floor(Math.random() * 3);
    
    // Randomly choose power-up type
    const powerUpType = Math.floor(Math.random() * 3);
    
    // Power-up size is medium (between seed and car)
    const width = this.laneWidth * 0.3;
    const height = width;
    
    const powerUp: GameObject = {
      x: this.lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'powerUp',
      powerUpType: powerUpType as PowerUpType,
      update: (delta: number) => {
        const speed = 0.25 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        powerUp.y += speed * delta;
        
        // Check if out of bounds
        if (powerUp.y > this.canvas.height) {
          powerUp.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        let color = '#ffffff';
        
        // Set color based on power-up type
        switch (powerUp.powerUpType) {
          case PowerUpType.SLOW_SPEED:
            color = '#9b87f5'; // Purple
            break;
          case PowerUpType.SHIELD:
            color = '#4cc9f0'; // Cyan
            break;
          case PowerUpType.EXTRA_LIFE:
            color = '#ff5e5e'; // Red
            break;
        }
        
        // Draw power-up shape (circled hexagon)
        ctx.fillStyle = color;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Draw icon based on power-up type
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const centerX = powerUp.x + powerUp.width / 2;
        const centerY = powerUp.y + powerUp.height / 2;
        const iconSize = powerUp.width * 0.35;
        
        switch (powerUp.powerUpType) {
          case PowerUpType.SLOW_SPEED:
            // Draw clock icon
            ctx.beginPath();
            ctx.arc(centerX, centerY, iconSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw clock hands
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, centerY - iconSize * 0.7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + iconSize * 0.5, centerY + iconSize * 0.3);
            ctx.stroke();
            break;
            
          case PowerUpType.SHIELD:
            // Draw shield icon
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - iconSize);
            ctx.quadraticCurveTo(
              centerX + iconSize * 1.2, centerY - iconSize * 0.6,
              centerX, centerY + iconSize
            );
            ctx.quadraticCurveTo(
              centerX - iconSize * 1.2, centerY - iconSize * 0.6,
              centerX, centerY - iconSize
            );
            ctx.stroke();
            break;
            
          case PowerUpType.EXTRA_LIFE:
            // Draw heart icon
            const heartSize = iconSize * 0.8;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + heartSize * 0.3);
            ctx.bezierCurveTo(
              centerX, centerY, 
              centerX - heartSize, centerY, 
              centerX - heartSize, centerY - heartSize * 0.5
            );
            ctx.bezierCurveTo(
              centerX - heartSize, centerY - heartSize * 1.1,
              centerX, centerY - heartSize * 1.1,
              centerX, centerY - heartSize * 0.6
            );
            ctx.bezierCurveTo(
              centerX, centerY - heartSize * 1.1,
              centerX + heartSize, centerY - heartSize * 1.1,
              centerX + heartSize, centerY - heartSize * 0.5
            );
            ctx.bezierCurveTo(
              centerX + heartSize, centerY, 
              centerX, centerY, 
              centerX, centerY + heartSize * 0.3
            );
            ctx.fill();
            break;
        }
        
        // Add a glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        
        ctx.restore();
      }
    };
    
    this.powerUps.push(powerUp);
  }

  private createRoadMarking(y: number): void {
    // Create a road marking at the specified y position
    const marking: RoadMarking = {
      y,
      active: true,
      update: (delta: number) => {
        const speed = 0.3 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        marking.y += speed * delta;
        
        // Check if out of bounds
        if (marking.y > this.canvas.height) {
          marking.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Draw lane markings
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5;
        
        // Left lane divider
        const leftX = this.lanePositions[0] + this.laneWidth / 2;
        ctx.beginPath();
        ctx.moveTo(leftX, marking.y);
        ctx.lineTo(leftX, marking.y + 40);
        ctx.stroke();
        
        // Right lane divider
        const rightX = this.lanePositions[1] + this.laneWidth / 2;
        ctx.beginPath();
        ctx.moveTo(rightX, marking.y);
        ctx.lineTo(rightX, marking.y + 40);
        ctx.stroke();
        
        ctx.restore();
      }
    };
    
    this.roadMarkings.push(marking);
  }

  private spawnDecoration(): void {
    // 50% chance to spawn on left or right side
    const isLeftSide = Math.random() > 0.5;
    
    // Randomize decoration type (70% trees, 30% bushes)
    const type = Math.random() > 0.3 ? 'tree' : 'bush';
    
    // Calculate x position (distance from road edge)
    const roadEdge = isLeftSide ? 
      this.roadCenterX - this.roadWidth / 2 : 
      this.roadCenterX + this.roadWidth / 2;
    
    // Randomize distance from road (10-80px)
    const distanceFromRoad = 10 + Math.random() * 70;
    
    // Calculate final x position
    const x = isLeftSide ? 
      roadEdge - distanceFromRoad : 
      roadEdge + distanceFromRoad;
    
    // Randomize size based on type
    const baseSize = type === 'tree' ? 60 : 30;
    const sizeVariation = type === 'tree' ? 30 : 15;
    const size = baseSize + Math.random() * sizeVariation;
    
    // Always set tree type to oak (removed pine trees)
    const treeType = type === 'tree' ? 'oak' : null;
    
    const decoration: Decoration = {
      x: isLeftSide ? x - size : x,
      y: -size,
      type,
      size,
      active: true,
      update: (delta: number) => {
        const speed = 0.3 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        decoration.y += speed * delta;
        
        // Check if out of bounds
        if (decoration.y > this.canvas.height) {
          decoration.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        if (type === 'tree') {
          // Create slight shadow beneath the tree
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(
            decoration.x + decoration.size / 2,
            decoration.y + decoration.size * 0.95,
            decoration.size * 0.4,
            decoration.size * 0.1,
            0, 0, Math.PI * 2
          );
          ctx.fill();
          
          // Draw tree trunk with texture
          ctx.fillStyle = '#6B4226';
          const trunkWidth = decoration.size * 0.2;
          const trunkHeight = decoration.size * 0.5;
          
          // Trunk base color
          ctx.fillRect(
            decoration.x + (decoration.size - trunkWidth) / 2,
            decoration.y + decoration.size - trunkHeight,
            trunkWidth,
            trunkHeight
          );
          
          // Trunk texture/details
          ctx.fillStyle = '#5e3b14';
          ctx.fillRect(
            decoration.x + (decoration.size - trunkWidth) / 2 + trunkWidth * 0.2,
            decoration.y + decoration.size - trunkHeight,
            trunkWidth * 0.2,
            trunkHeight
          );
          
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(
            decoration.x + (decoration.size - trunkWidth) / 2 + trunkWidth * 0.6,
            decoration.y + decoration.size - trunkHeight,
            trunkWidth * 0.3,
            trunkHeight
          );
          
          // Oak tree (round shape)
          
          // Draw tree crown (circular shape with variations)
          const centerX = decoration.x + decoration.size / 2;
          const centerY = decoration.y + decoration.size * 0.4;
          const radius = decoration.size * 0.4;
          
          // Draw shadow
          ctx.fillStyle = '#1C3F1C';
          ctx.beginPath();
          ctx.arc(
            centerX + radius * 0.1,
            centerY + radius * 0.1,
            radius * 1.05,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Main foliage gradient
          const gradient = ctx.createRadialGradient(
            centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.1,
            centerX, centerY, radius
          );
          gradient.addColorStop(0, '#3A7D44');
          gradient.addColorStop(0.7, '#2A5A30');
          gradient.addColorStop(1, '#1C3F1C');
          
          // Draw main crown
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add smaller circles for texture/foliage detail
          ctx.fillStyle = '#3A7D44';
          
          // Create variations in the foliage
          for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = radius * 0.5 * Math.random();
            const blobRadius = radius * (0.4 + Math.random() * 0.3);
            
            ctx.beginPath();
            ctx.arc(
              centerX + Math.cos(angle) * distance,
              centerY + Math.sin(angle) * distance,
              blobRadius,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          
          // Add highlights
          ctx.fillStyle = '#4A8D54';
          ctx.globalAlpha = 0.3;
          
          ctx.beginPath();
          ctx.arc(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          ctx.globalAlpha = 1;
        } else {
          // Draw bush (circular shape with improved texture)
          
          // Draw shadow beneath bush
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.beginPath();
          ctx.ellipse(
            decoration.x + decoration.size / 2,
            decoration.y + decoration.size * 0.95,
            decoration.size * 0.4,
            decoration.size * 0.1,
            0, 0, Math.PI * 2
          );
          ctx.fill();
          
          // Create gradient for more realistic bush
          const gradient = ctx.createRadialGradient(
            decoration.x + decoration.size * 0.3,
            decoration.y + decoration.size * 0.3,
            decoration.size * 0.1,
            decoration.x + decoration.size / 2,
            decoration.y + decoration.size / 2,
            decoration.size / 2
          );
          gradient.addColorStop(0, '#4A8D54');
          gradient.addColorStop(0.6, '#3A7D44');
          gradient.addColorStop(1, '#2D6A3A');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size / 2,
            decoration.y + decoration.size / 2,
            decoration.size / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Add some detail to the bush
          ctx.fillStyle = '#2D6A3A';
          ctx.globalAlpha = 0.5;
          
          // First blob
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size * 0.3,
            decoration.y + decoration.size * 0.4,
            decoration.size * 0.25,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Second blob
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size * 0.7,
            decoration.y + decoration.size * 0.5,
            decoration.size * 0.2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Add highlights
          ctx.fillStyle = '#5A9D64';
          ctx.globalAlpha = 0.3;
          
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size * 0.4,
            decoration.y + decoration.size * 0.3,
            decoration.size * 0.15,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          ctx.globalAlpha = 1;
        }
        
        ctx.restore();
      }
    };
    
    this.decorations.push(decoration);
  }

  private updateDifficulty(deltaTime: number): void {
    this.difficultyTimer += deltaTime;
    if (this.difficultyTimer >= this.difficultyInterval) {
      this.gameSpeed = Math.min(this.gameSpeed + 0.2, 2.5);
      this.enemySpawnInterval = Math.max(this.enemySpawnInterval - 100, 1000);
      this.difficultyTimer = 0;
    }
  }

  private updatePowerUps(deltaTime: number): void {
    // Update slow mode
    if (this.slowModeActive) {
      this.slowModeTimer -= deltaTime;
      if (this.slowModeTimer <= 0) {
        this.slowModeActive = false;
        this.onPowerUpEnd(PowerUpType.SLOW_SPEED);
      }
    }
  }

  private activateSlowMode(): void {
    this.slowModeActive = true;
    this.slowModeTimer = this.slowModeDuration;
    this.onPowerUpStart(PowerUpType.SLOW_SPEED, this.slowModeDuration);
  }

  private activateShield(): void {
    if (this.player) {
      this.player.shield = true;
      this.player.shieldTimer = 3000; // 3 seconds
      this.onPowerUpStart(PowerUpType.SHIELD, 3000);
    }
  }

  private addExtraLife(): void {
    if (this.player) {
      this.player.lives = Math.min(this.player.lives + 1, 5); // Max 5 lives
      this.onLivesChange(this.player.lives);
      this.onPowerUpStart(PowerUpType.EXTRA_LIFE, 0);
    }
  }

  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    this.onGameStateChange(GameState.GAME_OVER);
    this.saveHighScore();
  }

  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw grass
    this.drawGrass();
    
    // Draw road
    this.drawRoad();
    
    // Draw decorations (behind the cars)
    this.decorations.forEach(decoration => decoration.render(this.ctx));
    
    // Draw game objects
    this.drawGameObjects();
    
    // Draw UI
    this.drawUI();
  }

  private drawBackground(): void {
    // Draw sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a2b45');
    gradient.addColorStop(1, '#2d4b6e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw some stars in the background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height * 0.7;
      const size = Math.random() * 2 + 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawGrass(): void {
    // Draw grass on both sides of the road
    const roadLeft = this.roadCenterX - this.roadWidth / 2;
    const roadRight = this.roadCenterX + this.roadWidth / 2;
    
    // Left side grass
    const grassGradient = this.ctx.createLinearGradient(0, 0, roadLeft, 0);
    grassGradient.addColorStop(0, '#1C3F1C');  // Darker at the edge
    grassGradient.addColorStop(1, '#2A5A30');  // Lighter near the road
    
    this.ctx.fillStyle = grassGradient;
    this.ctx.fillRect(0, 0, roadLeft, this.canvas.height);
    
    // Right side grass
    const grassGradient2 = this.ctx.createLinearGradient(roadRight, 0, this.canvas.width, 0);
    grassGradient2.addColorStop(0, '#2A5A30');  // Lighter near the road
    grassGradient2.addColorStop(1, '#1C3F1C');  // Darker at the edge
    
    this.ctx.fillStyle = grassGradient2;
    this.ctx.fillRect(roadRight, 0, this.canvas.width - roadRight, this.canvas.height);
    
    // Add grass texture
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    
    // Left side texture
    for (let i = 0; i < roadLeft; i += 20) {
      for (let j = 0; j < this.canvas.height; j += 20) {
        if (Math.random() > 0.8) {
          this.ctx.fillRect(i, j, 5, 5);
        }
      }
    }
    
    // Right side texture
    for (let i = roadRight; i < this.canvas.width; i += 20) {
      for (let j = 0; j < this.canvas.height; j += 20) {
        if (Math.random() > 0.8) {
          this.ctx.fillRect(i, j, 5, 5);
        }
      }
    }
  }

  private drawRoad(): void {
    // Calculate road dimensions
    const roadLeft = this.roadCenterX - this.roadWidth / 2;
    const roadRight = this.roadCenterX + this.roadWidth / 2;
    
    // Draw road background with asphalt texture
    const roadGradient = this.ctx.createLinearGradient(roadLeft, 0, roadRight, 0);
    roadGradient.addColorStop(0, '#333333');
    roadGradient.addColorStop(0.5, '#444444');
    roadGradient.addColorStop(1, '#333333');
    
    this.ctx.fillStyle = roadGradient;
    this.ctx.fillRect(roadLeft, 0, this.roadWidth, this.canvas.height);
    
    // Add asphalt texture
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = roadLeft; i < roadRight; i += 10) {
      for (let j = 0; j < this.canvas.height; j += 10) {
        if (Math.random() > 0.9) {
          this.ctx.fillRect(i, j, 2, 2);
        }
      }
    }
    
    // Draw road edges
    this.ctx.strokeStyle = '#f6f6a3'; // Yellow road edge
    this.ctx.lineWidth = 3;
    
    // Left edge
    this.ctx.beginPath();
    this.ctx.moveTo(roadLeft, 0);
    this.ctx.lineTo(roadLeft, this.canvas.height);
    this.ctx.stroke();
    
    // Right edge
    this.ctx.beginPath();
    this.ctx.moveTo(roadRight, 0);
    this.ctx.lineTo(roadRight, this.canvas.height);
    this.ctx.stroke();
    
    // Draw lane markings from the road marking objects
    this.roadMarkings.forEach(marking => marking.render(this.ctx));
  }

  private drawGameObjects(): void {
    // Draw player
    if (this.player) {
      this.player.render(this.ctx);
    }
    
    // Draw enemies
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    
    // Draw seeds
    this.seeds.forEach(seed => seed.render(this.ctx));
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
    
    // Draw explosions
    this.drawExplosions();
  }

  private drawExplosions(): void {
    this.explosions.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  private drawUI(): void {
    // Draw game state UI
    if (this.gameState === GameState.START_SCREEN) {
      // Start screen UI is handled in the React component
    } else if (this.gameState === GameState.PAUSED) {
      // Draw pause screen
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '18px Arial';
      this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
    } else if (this.gameState === GameState.GAME_OVER) {
      // Game over UI is handled in the React component
    }
  }
  
  private checkAllImagesLoaded(): void {
    if (this.playerCarLoaded && this.enemyCarLoaded && this.seedImageLoaded) {
      console.log("All game images processed, can continue with game initialization");
      this.imagesLoaded = true;
      // Initialize player after images are loaded or failed
      this.player = this.createPlayer();
    }
  }
  
  private calculateDimensions(): void {
    // Calculate lane and road dimensions based on canvas size
    this.roadWidth = this.canvas.width * 0.6;
    this.roadCenterX = this.canvas.width / 2;
    this.laneWidth = this.roadWidth / 3;
    
    // Calculate lane positions (center x of each lane)
    this.lanePositions = [
      this.roadCenterX - this.laneWidth,
      this.roadCenterX,
      this.roadCenterX + this.laneWidth
    ];
  }
  
  private createPlayer(): PlayerCar {
    // Use the same aspect ratio for all cars (0.7 is a balanced ratio)
    const aspectRatio = 0.7; 
    const width = this.laneWidth * 0.9; // 90% of lane width
    const height = width / aspectRatio;
    const lane = 1; // Start in middle lane
    
    return {
      x: this.lanePositions[lane] - (width / 2),
      y: this.canvas.height - height - 20,
      width,
      height,
      lane,
      lanePosition: this.lanePositions[lane],
      targetLane: lane,
      transitioning: false,
      lives: 3,
      shield: false,
      shieldTimer: 0,
      active: true,
      update: (delta: number) => {
        if (!this.player) return;
        
        // Handle lane transitions
        if (this.player.transitioning) {
          const transitionSpeed = 0.01 * delta;
          const target = this.lanePositions[this.player.targetLane];
          const diff = target - this.player.lanePosition;
          
          if (Math.abs(diff) < 2) {
            this.player.lanePosition = target;
            this.player.transitioning = false;
            this.player.lane = this.player.targetLane;
          } else {
            this.player.lanePosition += diff * transitionSpeed;
          }
        }
        
        this.player.x = this.player.lanePosition - (this.player.width / 2);
        
        // Update shield timer if active
        if (this.player.shield) {
          this.player.shieldTimer -= delta;
          if (this.player.shieldTimer <= 0) {
            this.player.shield = false;
            this.onPowerUpEnd(PowerUpType.SHIELD);
          }
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        if (!this.player) return;
        
        ctx.save();
        
        // Draw shield effect if active
        if (this.player.shield) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(100, 210, 255, 0.3)';
          ctx.ellipse(
            this.player.x + this.player.width / 2, 
            this.player.y + this.player.height / 2,
            this.player.width * 0.8, 
            this.player.height * 0.8, 
            0, 0, Math.PI * 2
          );
          ctx.fill();
          
          // Shield border
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(100, 210, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.ellipse(
            this.player.x + this.player.width / 2, 
            this.player.y + this.player.height / 2,
            this.player.width * 0.8, 
            this.player.height * 0.8, 
            0, 0, Math.PI * 2
          );
          ctx.stroke();
        }
        
        try {
          // Draw the player car image
          ctx.drawImage(
            this.playerCarImage, 
            this.player.x, 
            this.player.y, 
            this.player.width, 
            this.player.height
          );
        } catch (e) {
          // Fallback to drawing a simple car if image fails
          console.warn("Error drawing player car image, using fallback:", e);
          this.drawCarFallback(
            ctx, 
            this.player.x, 
            this.player.y, 
            this.player.width, 
            this.player.height, 
            '#3cbbbb'
          );
        }
        
        ctx.restore();
      }
    };
  }
  
  private drawCarFallback(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string): void {
    // Draw car body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Draw car details (windows, etc.)
    ctx.fillStyle = '#222';
    
    // Draw windows (top part of car)
    const windowHeight = height * 0.3;
    const windowWidth = width * 0.7;
    const windowX = x + (width - windowWidth) / 2;
    const windowY = y + height * 0.15;
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
    
    // Draw headlights or taillights
    ctx.fillStyle = '#ffdd00';
    
    // Front lights
    const lightSize = width * 0.15;
    ctx.fillRect(x + width * 0.1, y + height * 0.1, lightSize, lightSize);
    ctx.fillRect(x + width - width * 0.1 - lightSize, y + height * 0.1, lightSize, lightSize);
  }
  
  private createEnemy(lane: number): GameObject {
    // Use the same aspect ratio as the player car
    const aspectRatio = 0.7; 
    const width = this.laneWidth * 0.9; // 90% of lane width
    const height = width / aspectRatio;
    
    // Choose a random enemy car image if multiple are available
    const enemyImageIndex = this.enemyCarImages.length > 0 
      ? Math.floor(Math.random() * this.enemyCarImages.length) 
      : 0;
    
    const enemy = {
      x: this.lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'enemy',
      imageIndex: enemyImageIndex,
      update: (delta: number) => {
        // Move downward
        const speed = 0.3 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        // Use a direct reference to the enemy object instead of this
        enemy.y += speed * delta;
        
        // Check if out of bounds
        if (enemy.y > this.canvas.height) {
          enemy.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        try {
          // Get the specific enemy car image to use
          const enemyImage = this.enemyCarImages[enemy.imageIndex];
          if (enemyImage) {
            // Draw the enemy car image
            ctx.drawImage(
              enemyImage, 
              enemy.x, 
              enemy.y, 
              enemy.width, 
              enemy.height
            );
          } else {
            throw new Error("Enemy car image not available");
          }
        } catch (e) {
          // Fallback to drawing a simple car if image fails
          console.warn("Error drawing enemy car image, using fallback");
          this.drawCarFallback(
            ctx, 
            enemy.x, 
            enemy.y, 
            enemy.width, 
            enemy.height, 
            '#dd373c'
          );
        }
        
        ctx.restore();
      }
    };
    
    return enemy;
  }
}
