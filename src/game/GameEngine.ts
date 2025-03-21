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

export interface GameConfig {
  canvas: HTMLCanvasElement;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  onPowerUpStart: (type: PowerUpType, duration: number) => void;
  onPowerUpEnd: (type: PowerUpType) => void;
  customAssets?: {
    playerCarURL: string;
    enemyCarURL: string;
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
  
  // Car images
  private playerCarImage: HTMLImageElement;
  private enemyCarImage: HTMLImageElement;
  private playerCarLoaded: boolean = false;
  private enemyCarLoaded: boolean = false;
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
    this.enemyCarImage = new Image();
    this.enemyCarImage.crossOrigin = "anonymous"; // Try to fix CORS issues
    
    // Use custom assets if provided
    if (config.customAssets) {
      console.log("Using custom car assets:", config.customAssets);
      
      // Set up event handlers before setting src
      this.playerCarImage.onload = () => {
        console.log("Player car image loaded successfully");
        this.playerCarLoaded = true;
        this.checkAllImagesLoaded();
      };
      
      this.enemyCarImage.onload = () => {
        console.log("Enemy car image loaded successfully");
        this.enemyCarLoaded = true;
        this.checkAllImagesLoaded();
      };
      
      this.playerCarImage.onerror = (e) => {
        console.error("Error loading player car image:", e);
        this.imageLoadErrors = true;
        this.playerCarLoaded = true; // Consider it "loaded" so we can continue with fallbacks
        this.checkAllImagesLoaded();
      };
      
      this.enemyCarImage.onerror = (e) => {
        console.error("Error loading enemy car image:", e);
        this.imageLoadErrors = true;
        this.enemyCarLoaded = true; // Consider it "loaded" so we can continue with fallbacks
        this.checkAllImagesLoaded();
      };
      
      // Now set the src attributes
      this.playerCarImage.src = config.customAssets.playerCarURL;
      this.enemyCarImage.src = config.customAssets.enemyCarURL;
    } else {
      console.error("No custom assets provided, game cannot initialize properly");
      // Mark as loaded but with errors, so we can use fallbacks
      this.playerCarLoaded = true;
      this.enemyCarLoaded = true;
      this.imageLoadErrors = true;
      this.imagesLoaded = true;
      // Initialize player after images are loaded or failed
      this.player = this.createPlayer();
    }
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private checkAllImagesLoaded(): void {
    if (this.playerCarLoaded && this.enemyCarLoaded) {
      console.log("All car images processed, can continue with game initialization");
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
    // Use a shorter aspect ratio for the car image (width/height)
    const aspectRatio = 0.8; // Modified from 0.55 to 0.8 to reduce height
    const width = this.laneWidth * 0.8;
    const height = width / aspectRatio; // This will make the car shorter
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
    // Use a shorter aspect ratio for the car image (width/height)
    const aspectRatio = 0.8; // Modified from 0.55 to 0.8 to reduce height
    const width = this.laneWidth * 0.8;
    const height = width / aspectRatio; // This will make the car shorter
    
    const enemy = {
      x: this.lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'enemy',
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
          // Draw the enemy car image
          ctx.drawImage(
            this.enemyCarImage, 
            enemy.x, 
            enemy.y, 
            enemy.width, 
            enemy.height
          );
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
  
  private createSeed(lane: number): GameObject {
    const size = this.laneWidth * 0.2;
    
    const seed = {
      x: this.lanePositions[lane] - (size / 2),
      y: -size,
      width: size,
      height: size,
      lane,
      active: true,
      type: 'seed',
      update: (delta: number) => {
        // Move downward
        const speed = 0.25 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        // Use a direct reference to the seed object instead of this
        seed.y += speed * delta;
        
        // Check if out of bounds
        if (seed.y > this.canvas.height) {
          seed.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        // Draw seed
        ctx.save();
        ctx.fillStyle = '#ffcd3c';
        
        // Seed with pulsing effect
        const pulseScale = 1 + 0.1 * Math.sin(Date.now() * 0.005);
        const centerX = seed.x + seed.width / 2;
        const centerY = seed.y + seed.height / 2;
        const scaledSize = seed.width * pulseScale;
        
        // Create rounded rectangle
        const radius = scaledSize / 4;
        
        ctx.beginPath();
        ctx.moveTo(centerX - scaledSize / 2 + radius, centerY - scaledSize / 2);
        ctx.lineTo(centerX + scaledSize / 2 - radius, centerY - scaledSize / 2);
        ctx.arc(centerX + scaledSize / 2 - radius, centerY - scaledSize / 2 + radius, radius, -Math.PI / 2, 0);
        ctx.lineTo(centerX + scaledSize / 2, centerY + scaledSize / 2 - radius);
        ctx.arc(centerX + scaledSize / 2 - radius, centerY + scaledSize / 2 - radius, radius, 0, Math.PI / 2);
        ctx.lineTo(centerX - scaledSize / 2 + radius, centerY + scaledSize / 2);
        ctx.arc(centerX - scaledSize / 2 + radius, centerY + scaledSize / 2 - radius, radius, Math.PI / 2, Math.PI);
        ctx.lineTo(centerX - scaledSize / 2, centerY - scaledSize / 2 + radius);
        ctx.arc(centerX - scaledSize / 2 + radius, centerY - scaledSize / 2 + radius, radius, Math.PI, 3 * Math.PI / 2);
        ctx.closePath();
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, scaledSize / 2
        );
        gradient.addColorStop(0, '#fff9c4');
        gradient.addColorStop(1, '#ffcd3c');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#ffcd3c';
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        ctx.restore();
      }
    };
    
    return seed;
  }
  
  private createPowerUp(lane: number, type: PowerUpType): GameObject {
    const size = this.laneWidth * 0.35;
    
    const powerUp = {
      x: this.lanePositions[lane] - (size / 2),
      y: -size,
      width: size,
      height: size,
      lane,
      active: true,
      type: 'powerup',
      powerUpType: type,
      update: (delta: number) => {
        // Move downward
        const speed = 0.2 * this.gameSpeed * (this.slowModeActive ? 0.5 : 1);
        // Use a direct reference to the powerUp object instead of this
        powerUp.y += speed * delta;
        
        // Check if out of bounds
        if (powerUp.y > this.canvas.height) {
          powerUp.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        const centerX = powerUp.x + powerUp.width / 2;
        const centerY = powerUp.y + powerUp.height / 2;
        const radius = powerUp.width / 2;
        
        ctx.save();
        
        // Base circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        // Fill based on power-up type
        let fillColor, iconColor;
        if (powerUp.powerUpType === PowerUpType.SLOW_SPEED) {
          fillColor = '#A170FC';
          iconColor = '#ffffff';
        } else if (powerUp.powerUpType === PowerUpType.SHIELD) {
          fillColor = '#64D2FF';
          iconColor = '#ffffff';
        } else { // EXTRA_LIFE
          fillColor = '#FF6B6B';
          iconColor = '#ffffff';
        }
        
        // Create gradient fill
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, radius
        );
        gradient.addColorStop(0, iconColor);
        gradient.addColorStop(0.7, fillColor);
        ctx.fillStyle = gradient;
        
        // Add glow
        ctx.shadowColor = fillColor;
        ctx.shadowBlur = 15;
        ctx.fill();
        
        // Draw icon based on power-up type
        ctx.fillStyle = iconColor;
        if (powerUp.powerUpType === PowerUpType.SLOW_SPEED) {
          // Clock icon
          const clockRadius = radius * 0.6;
          ctx.beginPath();
          ctx.arc(centerX, centerY, clockRadius, 0, Math.PI * 2);
          ctx.strokeStyle = iconColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Clock hands
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX, centerY - clockRadius * 0.6);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + clockRadius * 0.4, centerY);
          ctx.stroke();
        } else if (powerUp.powerUpType === PowerUpType.SHIELD) {
          // Shield icon
          const shieldWidth = radius * 1.2;
          const shieldHeight = radius * 1.4;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - shieldHeight / 2);
          ctx.lineTo(centerX + shieldWidth / 2, centerY - shieldHeight / 4);
          ctx.lineTo(centerX + shieldWidth / 2, centerY);
          ctx.quadraticCurveTo(
            centerX + shieldWidth / 4, centerY + shieldHeight / 2,
            centerX, centerY + shieldHeight / 2
          );
          ctx.quadraticCurveTo(
            centerX - shieldWidth / 4, centerY + shieldHeight / 2,
            centerX - shieldWidth / 2, centerY
          );
          ctx.lineTo(centerX - shieldWidth / 2, centerY - shieldHeight / 4);
          ctx.closePath();
          
          ctx.strokeStyle = iconColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else { // EXTRA_LIFE
          // Heart icon
          const heartSize = radius * 0.7;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY + heartSize * 0.3);
          ctx.bezierCurveTo(
            centerX, centerY, 
            centerX - heartSize, centerY, 
            centerX - heartSize, centerY - heartSize * 0.5
          );
          ctx.bezierCurveTo(
            centerX - heartSize, centerY - heartSize * 1.1,
            centerX, centerY - heartSize * 0.8,
            centerX, centerY - heartSize * 0.4
          );
          ctx.bezierCurveTo(
            centerX, centerY - heartSize * 0.8,
            centerX + heartSize, centerY - heartSize * 1.1,
            centerX + heartSize, centerY - heartSize * 0.5
          );
          ctx.bezierCurveTo(
            centerX + heartSize, centerY, 
            centerX, centerY, 
            centerX, centerY + heartSize * 0.3
          );
          
          ctx.strokeStyle = iconColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        ctx.restore();
      }
    };
    
    return powerUp;
  }
  
  private setupEventListeners(): void {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (this.gameState !== GameState.GAMEPLAY) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.movePlayerLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        this.movePlayerRight();
      } else if (e.key === 'p' || e.key === 'Escape') {
        this.togglePause();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
  
  private movePlayerLeft(): void {
    if (!this.player) return;
    
    if (this.player.lane > 0 && !this.player.transitioning) {
      this.player.targetLane = this.player.lane - 1;
      this.player.transitioning = true;
    }
  }
  
  private movePlayerRight(): void {
    if (!this.player) return;
    
    if (this.player.lane < 2 && !this.player.transitioning) {
      this.player.targetLane = this.player.lane + 1;
      this.player.transitioning = true;
    }
  }
  
  private togglePause(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.gameState = GameState.PAUSED;
    } else if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.GAMEPLAY;
      // Reset last frame time to avoid large delta
      this.lastFrameTime = performance.now();
    }
    
    this.onGameStateChange(this.gameState);
  }
  
  public resizeCanvas(): void {
    // Update canvas and game dimensions
    this.calculateDimensions();
    
    // Update player position
    if (this.player) {
      this.player.lanePosition = this.lanePositions[this.player.lane];
      this.player.x = this.player.lanePosition - (this.player.width / 2);
    }
  }
  
  public startGame(): void {
    console.log("startGame called, images processed:", this.imagesLoaded);
    
    // Make sure images are processed before starting
    if (!this.imagesLoaded) {
      console.log("Images not processed yet, retrying in 100ms");
      setTimeout(() => this.startGame(), 100);
      return;
    }
    
    // Make sure player is initialized
    if (!this.player) {
      console.log("Player not initialized yet, creating player");
      this.player = this.createPlayer();
    }
    
    // Reset game state
    this.resetGame();
    
    // Start game loop
    this.gameState = GameState.GAMEPLAY;
    this.onGameStateChange(this.gameState);
    this.lastFrameTime = performance.now();
    console.log("Starting game loop");
    
    // Use try/catch for safety
    try {
      this.gameLoop(this.lastFrameTime);
    } catch (error) {
      console.error("Error starting game loop:", error);
      this.gameState = GameState.START_SCREEN;
      this.onGameStateChange(this.gameState);
    }
  }
  
  private resetGame(): void {
    // Reset game parameters
    this.score = 0;
    this.gameSpeed = 1;
    this.gameTime = 0;
    this.enemies = [];
    this.seeds = [];
    this.powerUps = [];
    this.explosions = []; // Clear any active explosions
    this.enemySpawnInterval = 2000;
    this.seedSpawnInterval = 1000;
    this.powerUpSpawnInterval = 15000;
    this.enemySpawnTimer = 0;
    this.seedSpawnTimer = 0;
    this.powerUpSpawnTimer = 0;
    this.difficultyTimer = 0;
    this.slowModeActive = false;
    this.slowModeTimer = 0;
    
    // Reset player
    if (!this.player) {
      this.player = this.createPlayer();
    } else {
      this.player.lives = 3;
      this.player.shield = false;
      this.player.shieldTimer = 0;
      this.player.lane = 1;
      this.player.targetLane = 1;
      this.player.transitioning = false;
      this.player.lanePosition = this.lanePositions[1];
      this.player.x = this.player.lanePosition - (this.player.width / 2);
    }
    
    // Update UI
    this.onScoreChange(this.score);
    this.onLivesChange(this.player.lives);
  }
  
  public gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    this.onGameStateChange(this.gameState);
    
    // Stop game loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Save high score
    this.saveHighScore();
  }
  
  private saveHighScore(): void {
    const currentHighScore = localStorage.getItem('highScore');
    if (!currentHighScore || parseInt(currentHighScore) < this.score) {
      localStorage.setItem('highScore', this.score.toString());
    }
  }
  
  public getHighScore(): number {
    const highScore = localStorage.getItem('highScore');
    return highScore ? parseInt(highScore) : 0;
  }
  
  public getCurrentScore(): number {
    return this.score;
  }
  
  private gameLoop(timestamp: number): void {
    // Check if we're in gameplay state
    if (this.gameState !== GameState.GAMEPLAY) {
      console.log("Game loop called but not in GAMEPLAY state:", this.gameState);
      this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
      return;
    }
    
    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Update game state
    this.update(deltaTime);
    
    // Render game
    this.render();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  private update(deltaTime: number): void {
    // Update game timers
    this.gameTime += deltaTime;
    this.enemySpawnTimer += deltaTime;
    this.seedSpawnTimer += deltaTime;
    this.powerUpSpawnTimer += deltaTime;
    this.difficultyTimer += deltaTime;
    
    // Update slow mode timer if active
    if (this.slowModeActive) {
      this.slowModeTimer -= deltaTime;
      if (this.slowModeTimer <= 0) {
        this.slowModeActive = false;
        this.onPowerUpEnd(PowerUpType.SLOW_SPEED);
      }
    }
    
    // Spawn enemies
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }
    
    // Spawn seeds
    if (this.seedSpawnTimer >= this.seedSpawnInterval) {
      this.spawnSeed();
      this.seedSpawnTimer = 0;
    }
    
    // Spawn power-ups
    if (this.powerUpSpawnTimer >= this.powerUpSpawnInterval) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }
    
    // Increase difficulty
    if (this.difficultyTimer >= this.difficultyInterval) {
      this.increaseDifficulty();
      this.difficultyTimer = 0;
    }
    
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
    
    // Update explosion particles
    this.updateExplosions(deltaTime);
    
    // Check collisions
    this.checkCollisions();
  }
  
  private updateExplosions(deltaTime: number): void {
    // Update and filter out expired explosion particles
    this.explosions = this.explosions.filter(particle => {
      particle.x += particle.vx * deltaTime / 50;
      particle.y += particle.vy * deltaTime / 50;
      particle.currentLife -= deltaTime;
      particle.alpha = particle.currentLife / particle.lifetime;
      return particle.currentLife > 0;
    });
  }
  
  private spawnEnemy(): void {
    // Determine enemy lane
    let lane: number;
    
    // As game progresses, create more complex patterns
    if (this.gameTime > 240000) { // 4+ minutes - very challenging
      // Complex patterns including times when all lanes are filled
      const pattern = Math.floor(Math.random() * 5);
      if (pattern === 0) {
        // All lanes filled with slight delay
        this.enemies.push(this.createEnemy(0));
        setTimeout(() => this.enemies.push(this.createEnemy(1)), 400);
        setTimeout(() => this.enemies.push(this.createEnemy(2)), 800);
        return;
      } else {
        lane = Math.floor(Math.random() * 3);
      }
    } else if (this.gameTime > 120000) { // 2+ minutes - challenging
      // More frequent double-lane enemies
      const pattern = Math.floor(Math.random() * 4);
      if (pattern === 0) {
        // Two lanes filled
        const lane1 = Math.floor(Math.random() * 3);
        let lane2 = (lane1 + 1) % 3;
        this.enemies.push(this.createEnemy(lane1));
        setTimeout(() => this.enemies.push(this.createEnemy(lane2)), 300);
        return;
      } else {
        lane = Math.floor(Math.random() * 3);
      }
    } else {
      // Standard random lane selection
      lane = Math.floor(Math.random() * 3);
    }
    
    this.enemies.push(this.createEnemy(lane));
  }
  
  private spawnSeed(): void {
    // Random lane, opposite to recent enemies to make it fair
    let availableLanes = [0, 1, 2];
    
    // Try to avoid placing seeds where there are enemies
    if (this.enemies.length > 0) {
      const recentEnemies = this.enemies.slice(-3);
      const enemyLanes = recentEnemies.map(enemy => enemy.lane);
      availableLanes = availableLanes.filter(lane => !enemyLanes.includes(lane));
    }
    
    // If all lanes have enemies, just pick a random one
    if (availableLanes.length === 0) {
      availableLanes = [0, 1, 2];
    }
    
    const laneIndex = Math.floor(Math.random() * availableLanes.length);
    const lane = availableLanes[laneIndex];
    
    this.seeds.push(this.createSeed(lane));
  }
  
  private spawnPowerUp(): void {
    // Random power-up type
    const powerUpTypes = [
      PowerUpType.SLOW_SPEED,
      PowerUpType.SHIELD,
      PowerUpType.EXTRA_LIFE
    ];
    
    const typeIndex = Math.floor(Math.random() * powerUpTypes.length);
    const powerUpType = powerUpTypes[typeIndex];
    
    // Random lane (try to avoid lanes with enemies)
    let availableLanes = [0, 1, 2];
    if (this.enemies.length > 0) {
      const recentEnemies = this.enemies.slice(-3);
      const enemyLanes = recentEnemies.map(enemy => enemy.lane);
      availableLanes = availableLanes.filter(lane => !enemyLanes.includes(lane));
    }
    
    if (availableLanes.length === 0) {
      availableLanes = [0, 1, 2];
    }
    
    const laneIndex = Math.floor(Math.random() * availableLanes.length);
    const lane = availableLanes[laneIndex];
    
    this.powerUps.push(this.createPowerUp(lane, powerUpType));
  }
  
  private increaseDifficulty(): void {
    // Increase game speed
    this.gameSpeed = Math.min(this.gameSpeed + 0.2, 3.0);
    
    // Increase enemy spawn rate
    this.enemySpawnInterval = Math.max(this.enemySpawnInterval - 100, 800);
    
    // Increase seed spawn rate
    this.seedSpawnInterval = Math.max(this.seedSpawnInterval - 50, 500);
  }
  
  private checkCollisions(): void {
    if (!this.player) return;
    
    // Check if player is invulnerable due to shield
    const isInvulnerable = this.player.shield;
    
    // Check collisions with enemies
    for (const enemy of this.enemies) {
      if (this.detectCollision(this.player, enemy)) {
        if (!isInvulnerable) {
          // Player hit an enemy car
          this.handlePlayerHit();
        }
        // Create explosion at collision point
        this.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          '#FF5555'
        );
        // Remove enemy
        enemy.active = false;
      }
    }
    
    // Check collisions with seeds
    for (const seed of this.seeds) {
      if (this.detectCollision(this.player, seed)) {
        // Player collected a seed
        this.score += 10;
        this.onScoreChange(this.score);
        
        // Create small visual effect
        this.createExplosion(
          seed.x + seed.width / 2,
          seed.y + seed.height / 2,
          '#FFDD00',
          10, // fewer particles
          0.5 // smaller particles
        );
        
        // Remove seed
        seed.active = false;
      }
    }
    
    // Check collisions with power-ups
    for (const powerUp of this.powerUps) {
      if (this.detectCollision(this.player, powerUp)) {
        // Apply power-up effect
        this.applyPowerUp(powerUp.powerUpType!);
        
        // Create visual effect
        this.createExplosion(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.powerUpType === PowerUpType.SLOW_SPEED ? '#A170FC' :
            powerUp.powerUpType === PowerUpType.SHIELD ? '#64D2FF' : '#FF6B6B',
          15, // more particles
          1.0 // normal-sized particles
        );
        
        // Remove power-up
        powerUp.active = false;
      }
    }
  }
  
  private detectCollision(obj1: GameObject, obj2: GameObject): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }
  
  private handlePlayerHit(): void {
    if (!this.player) return;
    
    // Decrease player lives
    this.player.lives--;
    this.onLivesChange(this.player.lives);
    
    // Check for game over
    if (this.player.lives <= 0) {
      this.gameOver();
    }
  }
  
  private applyPowerUp(type: PowerUpType): void {
    if (!this.player) return;
    
    switch (type) {
      case PowerUpType.SLOW_SPEED:
        // Activate slow mode
        this.slowModeActive = true;
        this.slowModeTimer = this.slowModeDuration;
        this.onPowerUpStart(PowerUpType.SLOW_SPEED, this.slowModeDuration);
        break;
      case PowerUpType.SHIELD:
        // Activate shield
        this.player.shield = true;
        this.player.shieldTimer = 3000; // 3 seconds of shield
        this.onPowerUpStart(PowerUpType.SHIELD, 3000);
        break;
      case PowerUpType.EXTRA_LIFE:
        // Add extra life (max 5)
        if (this.player.lives < 5) {
          this.player.lives++;
          this.onLivesChange(this.player.lives);
        }
        break;
    }
  }
  
  private createExplosion(x: number, y: number, color: string, count: number = 20, size: number = 1.0): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      const particleSize = (Math.random() * 5 + 5) * size;
      
      this.explosions.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: particleSize,
        color,
        alpha: 1,
        lifetime: 500 + Math.random() * 500,
        currentLife: 500 + Math.random() * 500
      });
    }
  }
  
  private render(): void {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw game objects
    this.seeds.forEach(seed => seed.render(this.ctx));
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
    
    // Draw player
    if (this.player) {
      this.player.render(this.ctx);
    }
    
    // Draw explosion particles
    this.drawExplosions();
  }
  
  private drawBackground(): void {
    // Draw sky
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGradient.addColorStop(0, '#1a202c');
    skyGradient.addColorStop(1, '#2d3748');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw road
    const roadX = this.roadCenterX - this.roadWidth / 2;
    this.ctx.fillStyle = '#1c1c20';
    this.ctx.fillRect(roadX, 0, this.roadWidth, this.canvas.height);
    
    // Draw lane markers
    this.ctx.strokeStyle = '#f7cc42';
    this.ctx.lineWidth = 5;
    this.ctx.setLineDash([30, 30]);
    
    // Left lane marker
    this.ctx.beginPath();
    this.ctx.moveTo(this.lanePositions[0], 0);
    this.ctx.lineTo(this.lanePositions[0], this.canvas.height);
    this.ctx.stroke();
    
    // Right lane marker
    this.ctx.beginPath();
    this.ctx.moveTo(this.lanePositions[2], 0);
    this.ctx.lineTo(this.lanePositions[2], this.canvas.height);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }
  
  private drawExplosions(): void {
    if (!this.ctx) return;
    
    for (const particle of this.explosions) {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
  
  public cleanup(): void {
    // Stop game loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }
  
  // Methods for touch controls (used in mobile mode)
  public handleTouchLeft(): void {
    this.movePlayerLeft();
  }
  
  public handleTouchRight(): void {
    this.movePlayerRight();
  }
  
  // For clean event listener removal
  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.gameState !== GameState.GAMEPLAY) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      this.movePlayerLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      this.movePlayerRight();
    } else if (e.key === 'p' || e.key === 'Escape') {
      this.togglePause();
    }
  };
  
  private handleResize = () => {
    this.resizeCanvas();
  };
}

