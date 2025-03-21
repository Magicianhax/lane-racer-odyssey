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
    enemyCarURLs: string[];
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
  private enemyCarImages: HTMLImageElement[] = [];
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
  
  // ... keep existing code (remaining methods unchanged)
}
