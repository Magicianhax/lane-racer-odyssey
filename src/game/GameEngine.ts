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
          backupImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgNjQgMTI4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjQ0IiBoZWlnaHQ9IjEwOCIgcng9IjYiIGZpbGw9IiNERDM3M0MiLz48cmVjdCB4PSIxNiIgeT0iMzIiIHdpZHRoPSIzzIiBoZWlnaHQ9IjI0IiBmaWxsPSIjMjIyODM4Ii8+PGNpcmNsZSBjeD0iMjAiIGN5PSIxMDAiIHI9IjgiIGZpbGw9IiMyMjIiLz48Y2lyY2xlIGN4PSI0NCIiIGN5PSIxMDAiIHI9IjgiIGZpbGw9IiMyMjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI0IiBmaWxsPSIjRkZGRjAwIi8+PGNpcmNsZSBjeD0iNDgiIGN5PSIxNiIgcj0iNCIgZmlsbD0iI0ZGRkYwMCIvPjwvc3ZnPg==';
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
  
  public togglePause(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.gameState = GameState.PAUSED;
      this.onGameStateChange(GameState.PAUSED);
    } else if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.GAMEPLAY;
      this.onGameStateChange(GameState.GAMEPLAY);
      this.lastFrameTime = performance.now();
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
          
          // Check game over ONLY if lives are depleted
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
        
        // Add a pulsing effect
        ctx.globalAlpha = 0.5 + Math.sin(this.gameTime / 200) * 0.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 2 + 5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        ctx.restore();
      }
    };
    
    this.powerUps.push(powerUp);
  }

  private spawnDecoration(): void {
    // Choose whether to place decoration on left or right side
    const isLeft = Math.random() > 0.5;
    const distanceFromRoad = 20 + Math.random() * 100; // Distance from road edge
    const x = isLeft ? 
      this.roadCenterX - (this.roadWidth / 2) - distanceFromRoad : 
      this.roadCenterX + (this.roadWidth / 2) + distanceFromRoad;
    
    // Choose decoration type (tree or bush)
    const type = Math.random() > 0.7 ? 'tree' : 'bush';
    const size = type === 'tree' ? 30 + Math.random() * 20 : 15 + Math.random() * 10;
    
    const decoration: Decoration = {
      x: x - size / 2,
      y: -size,
      type,
      size,
      active: true,
      update: (delta: number) => {
        const speed = 0.25 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        decoration.y += speed * delta;
        
        // Check if out of bounds
        if (decoration.y > this.canvas.height) {
          decoration.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        if (type === 'tree') {
          // Draw tree
          // Tree trunk
          ctx.fillStyle = '#8d6e63';
          ctx.fillRect(
            decoration.x + decoration.size * 0.4,
            decoration.y + decoration.size * 0.6,
            decoration.size * 0.2,
            decoration.size * 0.4
          );
          
          // Tree top
          ctx.fillStyle = '#4caf50';
          ctx.beginPath();
          ctx.moveTo(decoration.x, decoration.y + decoration.size * 0.6);
          ctx.lineTo(decoration.x + decoration.size, decoration.y + decoration.size * 0.6);
          ctx.lineTo(decoration.x + decoration.size / 2, decoration.y);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(decoration.x + decoration.size * 0.1, decoration.y + decoration.size * 0.4);
          ctx.lineTo(decoration.x + decoration.size * 0.9, decoration.y + decoration.size * 0.4);
          ctx.lineTo(decoration.x + decoration.size / 2, decoration.y + decoration.size * 0.1);
          ctx.fill();
        } else {
          // Draw bush
          ctx.fillStyle = '#66bb6a';
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size / 2,
            decoration.y + decoration.size / 2,
            decoration.size / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    };
    
    this.decorations.push(decoration);
  }

  private createRoadMarking(y: number): void {
    const marking: RoadMarking = {
      y,
      active: true,
      update: (delta: number) => {
        const speed = 0.25 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        marking.y += speed * delta;
        
        // Check if out of bounds
        if (marking.y > this.canvas.height) {
          marking.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        // Draw road lane marking
        ctx.fillStyle = '#ffffff';
        
        // Left lane marking
        ctx.fillRect(
          this.roadCenterX - (this.laneWidth / 2),
          marking.y,
          10,
          40
        );
        
        // Right lane marking
        ctx.fillRect(
          this.roadCenterX + (this.laneWidth / 2) - 10,
          marking.y,
          10,
          40
        );
      }
    };
    
    this.roadMarkings.push(marking);
  }

  private updatePowerUps(deltaTime: number): void {
    // Update slow mode
    if (this.slowModeActive) {
      this.slowModeTimer += deltaTime;
      
      // Check if slow mode has expired
      if (this.slowModeTimer >= this.slowModeDuration) {
        this.slowModeActive = false;
        this.slowModeTimer = 0;
        this.onPowerUpEnd(PowerUpType.SLOW_SPEED);
      }
    }
    
    // Update shield
    if (this.player && this.player.shield) {
      this.player.shieldTimer += deltaTime;
      
      // Check if shield has expired (10 seconds)
      if (this.player.shieldTimer >= 10000) {
        this.player.shield = false;
        this.player.shieldTimer = 0;
        this.onPowerUpEnd(PowerUpType.SHIELD);
      }
    }
  }

  private updateDifficulty(deltaTime: number): void {
    // Increase difficulty over time
    this.difficultyTimer += deltaTime;
    
    if (this.difficultyTimer >= this.difficultyInterval) {
      // Increase game speed
      this.gameSpeed += 0.1;
      
      // Decrease enemy spawn interval (min 500ms)
      this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval - 200);
      
      // Reset timer
      this.difficultyTimer = 0;
    }
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
      this.onPowerUpStart(PowerUpType.SHIELD, 10000);
    }
  }

  private addExtraLife(): void {
    if (this.player) {
      this.player.lives = Math.min(this.player.lives + 1, 5); // Max 5 lives
      this.onLivesChange(this.player.lives);
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
    
    // Render different screens based on game state
    switch (this.gameState) {
      case GameState.START_SCREEN:
        this.renderStartScreen();
        break;
      case GameState.GAMEPLAY:
      case GameState.PAUSED:
        this.renderGame();
        if (this.gameState === GameState.PAUSED) {
          this.renderPauseOverlay();
        }
        break;
      case GameState.GAME_OVER:
        this.renderGame();
        this.renderGameOverOverlay();
        break;
    }
  }

  private renderStartScreen(): void {
    // Draw road background
    this.drawRoad();
    
    // Draw title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Speedy Racer', this.canvas.width / 2, this.canvas.height / 3);
    
    // Draw instructions
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Use Left/Right Arrow Keys to drive', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Collect seeds and power-ups', this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.fillText('Avoid other cars', this.canvas.width / 2, this.canvas.height / 2 + 60);
    
    // Draw start message
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('Press any key to Start', this.canvas.width / 2, this.canvas.height * 3 / 4);
    
    // Draw high score
    if (this.highScore > 0) {
      this.ctx.font = '18px Arial';
      this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height - 50);
    }
  }

  private renderGame(): void {
    // Draw road and background
    this.drawRoad();
    
    // Draw road markings
    this.roadMarkings.forEach(marking => marking.render(this.ctx));
    
    // Draw decorations
    this.decorations.forEach(decoration => decoration.render(this.ctx));
    
    // Draw seeds
    this.seeds.forEach(seed => seed.render(this.ctx));
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
    
    // Draw enemies
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    
    // Draw player
    if (this.player) {
      this.player.render(this.ctx);
    }
    
    // Draw explosions
    this.renderExplosions();
    
    // Draw HUD
    this.renderHUD();
  }

  private renderExplosions(): void {
    // Draw all explosion particles
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

  private renderHUD(): void {
    // Draw score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    
    // Draw lives
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Lives: ${this.player ? this.player.lives : 0}`, this.canvas.width - 20, 30);
    
    // Draw power-up indicators
    if (this.slowModeActive) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#9b87f5';
      this.ctx.fillText('SLOW MODE', this.canvas.width / 2, 30);
    }
    
    if (this.player && this.player.shield) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#4cc9f0';
      this.ctx.fillText('SHIELD ACTIVE', this.canvas.width / 2, this.slowModeActive ? 60 : 30);
    }
  }

  private renderPauseOverlay(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Pause message
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  private renderGameOverOverlay(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Game over message
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 3);
    
    // Final score
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
    
    // High score
    if (this.score >= this.highScore) {
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + 40);
    } else {
      this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    // Restart message
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height * 3 / 4);
  }

  private drawRoad(): void {
    // Draw grass background
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw road
    this.ctx.fillStyle = '#424242';
    this.ctx.fillRect(
      this.roadCenterX - (this.roadWidth / 2),
      0,
      this.roadWidth,
      this.canvas.height
    );
    
    // Draw road edges
    this.ctx.fillStyle = '#f5f5f5';
    
    // Left edge
    this.ctx.fillRect(
      this.roadCenterX - (this.roadWidth / 2),
      0,
      5,
      this.canvas.height
    );
    
    // Right edge
    this.ctx.fillRect(
      this.roadCenterX + (this.roadWidth / 2) - 5,
      0,
      5,
      this.canvas.height
    );
  }

  private calculateDimensions(): void {
    const screenWidth = this.canvas.width = window.innerWidth;
    const screenHeight = this.canvas.height = window.innerHeight;
    
    this.roadWidth = Math.min(screenWidth * 0.8, 500);
    this.roadCenterX = screenWidth / 2;
    this.laneWidth = this.roadWidth / 3;
    
    // Calculate lane positions (center of each lane)
    this.lanePositions = [
      this.roadCenterX - this.roadWidth / 3,
      this.roadCenterX,
      this.roadCenterX + this.roadWidth / 3
    ];
  }

  private createPlayer(): PlayerCar {
    const width = this.laneWidth * 0.8;
    const height = width * 2; // Cars are taller than they are wide
    
    const player: PlayerCar = {
      x: this.lanePositions[1] - (width / 2), // Start in middle lane
      y: this.canvas.height - height - 20, // Place near bottom
      width,
      height,
      lane: 1, // Middle lane
      lanePosition: this.lanePositions[1],
      targetLane: 1,
      transitioning: false,
      active: true,
      lives: 3,
      shield: false,
      shieldTimer: 0,
      update: (delta: number) => {
        // Handle lane transitions
        if (player.transitioning) {
          const targetPosition = this.lanePositions[player.targetLane];
          const moveSpeed = 0.4 * delta;
          const distanceToTarget = targetPosition - player.lanePosition;
          
          if (Math.abs(distanceToTarget) < 5) {
            // Close enough, snap to position
            player.lanePosition = targetPosition;
            player.lane = player.targetLane;
            player.transitioning = false;
          } else {
            // Move toward target lane
            player.lanePosition += Math.sign(distanceToTarget) * moveSpeed;
          }
          
          // Update x position
          player.x = player.lanePosition - (player.width / 2);
        }
        
        // Draw shield effect if active
        if (player.shield) {
          // Shield animation logic
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Draw shield if active
        if (player.shield) {
          const pulseSize = 5 * Math.sin(this.gameTime / 100);
          ctx.strokeStyle = 'rgba(76, 201, 240, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(
            player.x - 10 - pulseSize,
            player.y - 10 - pulseSize,
            player.width + 20 + pulseSize * 2,
            player.height + 20 + pulseSize * 2,
            10
          );
          ctx.stroke();
          
          // Add glow effect
          ctx.shadowColor = '#4cc9f0';
          ctx.shadowBlur = 15;
        }
        
        // Draw player car
        if (this.playerCarImage && this.playerCarLoaded) {
          try {
            ctx.drawImage(
              this.playerCarImage,
              player.x,
              player.y,
              player.width,
              player.height
            );
          } catch (e) {
            // Fall back to drawing a rectangle if the image fails
            this.drawPlayerFallback(ctx, player);
          }
        } else {
          // No image or not loaded, use fallback
          this.drawPlayerFallback(ctx, player);
        }
        
        ctx.restore();
      }
    };
    
    return player;
  }

  private drawPlayerFallback(ctx: CanvasRenderingContext2D, player: PlayerCar): void {
    // Draw a simple car as fallback
    ctx.fillStyle = '#3498db';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw windshield
    ctx.fillStyle = '#222';
    ctx.fillRect(
      player.x + player.width * 0.25,
      player.y + player.height * 0.1,
      player.width * 0.5,
      player.height * 0.3
    );
    
    // Draw wheels
    ctx.fillStyle = '#333';
    // Left wheels
    ctx.fillRect(
      player.x - 5,
      player.y + player.height * 0.2,
      5,
      player.height * 0.2
    );
    ctx.fillRect(
      player.x - 5,
      player.y + player.height * 0.6,
      5,
      player.height * 0.2
    );
    
    // Right wheels
    ctx.fillRect(
      player.x + player.width,
      player.y + player.height * 0.2,
      5,
      player.height * 0.2
    );
    ctx.fillRect(
      player.x + player.width,
      player.y + player.height * 0.6,
      5,
      player.height * 0.2
    );
  }

  private createEnemy(lane: number): GameObject {
    const width = this.laneWidth * 0.8;
    const height = width * 2; // Cars are taller than they are wide
    
    const enemy: GameObject = {
      x: this.lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'enemy',
      update: (delta: number) => {
        // Move the enemy down
        const speed = 0.3 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        enemy.y += speed * delta;
        
        // Check if out of bounds
        if (enemy.y > this.canvas.height) {
          enemy.active = false;
          
          // Add score for successfully passing an enemy
          this.score += 5;
          this.onScoreChange(this.score);
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        // Draw enemy car using images
        if (this.enemyCarImages.length > 0 && this.enemyCarLoaded) {
          // Select a random enemy car image from the loaded ones
          const imageIndex = Math.floor(Math.random() * this.enemyCarImages.length);
          if (this.enemyCarImages[imageIndex]) {
            try {
              ctx.drawImage(
                this.enemyCarImages[imageIndex],
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
              );
              return;
            } catch (e) {
              // Fall back to drawing a rectangle if the image fails
              console.error("Failed to draw enemy car image", e);
            }
          }
        }
        
        // Fallback to drawing a rectangle
        this.drawEnemyFallback(ctx, enemy);
      }
    };
    
    return enemy;
  }

  private drawEnemyFallback(ctx: CanvasRenderingContext2D, enemy: GameObject): void {
    // Draw a simple car as fallback
    // Base color will be random for different enemy cars
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71'];
    const colorIndex = Math.floor(Math.random() * colors.length);
    
    ctx.fillStyle = colors[colorIndex];
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Draw windshield
    ctx.fillStyle = '#222';
    ctx.fillRect(
      enemy.x + enemy.width * 0.25,
      enemy.y + enemy.height * 0.6,
      enemy.width * 0.5,
      enemy.height * 0.3
    );
    
    // Draw wheels
    ctx.fillStyle = '#333';
    // Left wheels
    ctx.fillRect(
      enemy.x - 5,
      enemy.y + enemy.height * 0.2,
      5,
      enemy.height * 0.2
    );
    ctx.fillRect(
      enemy.x - 5,
      enemy.y + enemy.height * 0.6,
      5,
      enemy.height * 0.2
    );
    
    // Right wheels
    ctx.fillRect(
      enemy.x + enemy.width,
      enemy.y + enemy.height * 0.2,
      5,
      enemy.height * 0.2
    );
    ctx.fillRect(
      enemy.x + enemy.width,
      enemy.y + enemy.height * 0.6,
      5,
      enemy.height * 0.2
    );
  }
}
