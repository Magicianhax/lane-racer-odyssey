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

export interface GameConfig {
  canvas: HTMLCanvasElement;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  onPowerUpStart: (type: PowerUpType, duration: number) => void;
  onPowerUpEnd: (type: PowerUpType) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState = GameState.START_SCREEN;
  private lastFrameTime: number = 0;
  private accumulatedTime: number = 0;
  
  // Game objects
  private player: PlayerCar;
  private enemies: GameObject[] = [];
  private seeds: GameObject[] = [];
  private powerUps: GameObject[] = [];
  
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
    
    // Initialize player
    this.player = this.createPlayer();
    
    // Set up event listeners
    this.setupEventListeners();
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
    const width = this.laneWidth * 0.7;
    const height = width * 1.8;
    const lane = 1; // Start in middle lane
    
    return {
      x: this.lanePositions[lane],
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
        // Draw player car
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
        
        // Car body
        ctx.fillStyle = '#f5f5f7';
        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Windows
        ctx.fillStyle = '#1c1c1c';
        const windowWidth = this.player.width * 0.7;
        const windowX = this.player.x + (this.player.width - windowWidth) / 2;
        
        // Front window
        ctx.fillRect(
          windowX,
          this.player.y + this.player.height * 0.15,
          windowWidth,
          this.player.height * 0.2
        );
        
        // Rear window
        ctx.fillRect(
          windowX,
          this.player.y + this.player.height * 0.6,
          windowWidth,
          this.player.height * 0.2
        );
        
        // Headlights
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(
          this.player.x + this.player.width * 0.15,
          this.player.y,
          this.player.width * 0.15,
          this.player.height * 0.05
        );
        ctx.fillRect(
          this.player.x + this.player.width * 0.7,
          this.player.y,
          this.player.width * 0.15,
          this.player.height * 0.05
        );
        
        // Taillights
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(
          this.player.x + this.player.width * 0.15,
          this.player.y + this.player.height * 0.95,
          this.player.width * 0.15,
          this.player.height * 0.05
        );
        ctx.fillRect(
          this.player.x + this.player.width * 0.7,
          this.player.y + this.player.height * 0.95,
          this.player.width * 0.15,
          this.player.height * 0.05
        );
        
        ctx.restore();
      }
    };
  }
  
  private createEnemy(lane: number): GameObject {
    const width = this.laneWidth * 0.7;
    const height = width * 1.8;
    
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
        // Draw enemy car
        ctx.save();
        
        // Car body
        ctx.fillStyle = '#ff5252';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Windows
        ctx.fillStyle = '#1c1c1c';
        const windowWidth = enemy.width * 0.7;
        const windowX = enemy.x + (enemy.width - windowWidth) / 2;
        
        // Front window
        ctx.fillRect(
          windowX,
          enemy.y + enemy.height * 0.15,
          windowWidth,
          enemy.height * 0.2
        );
        
        // Rear window
        ctx.fillRect(
          windowX,
          enemy.y + enemy.height * 0.6,
          windowWidth,
          enemy.height * 0.2
        );
        
        // Headlights
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(
          enemy.x + enemy.width * 0.15,
          enemy.y + enemy.height * 0.95,
          enemy.width * 0.15,
          enemy.height * 0.05
        );
        ctx.fillRect(
          enemy.x + enemy.width * 0.7,
          enemy.y + enemy.height * 0.95,
          enemy.width * 0.15,
          enemy.height * 0.05
        );
        
        // Taillights
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(
          enemy.x + enemy.width * 0.15,
          enemy.y,
          enemy.width * 0.15,
          enemy.height * 0.05
        );
        ctx.fillRect(
          enemy.x + enemy.width * 0.7,
          enemy.y,
          enemy.width * 0.15,
          enemy.height * 0.05
        );
        
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
    if (this.player.lane > 0 && !this.player.transitioning) {
      this.player.targetLane = this.player.lane - 1;
      this.player.transitioning = true;
    }
  }
  
  private movePlayerRight(): void {
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
  
  // Changed from private to public to allow access from the Game component
  public resizeCanvas(): void {
    // Update canvas and game dimensions
    this.calculateDimensions();
    
    // Update player position
    this.player.lanePosition = this.lanePositions[this.player.lane];
    this.player.x = this.player.lanePosition - (this.player.width / 2);
  }
  
  public startGame(): void {
    // Reset game state
    this.resetGame();
    
    // Start game loop
    this.gameState = GameState.GAMEPLAY;
    this.onGameStateChange(this.gameState);
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }
  
  private resetGame(): void {
    // Reset game parameters
    this.score = 0;
    this.gameSpeed = 1;
    this.gameTime = 0;
    this.enemies = [];
    this.seeds = [];
    this.powerUps = [];
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
    this.player = this.createPlayer();
    
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
    if (this.gameState !== GameState.GAMEPLAY) {
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
    this.player.update(deltaTime);
    
    // Update enemies
    this.enemies.forEach(enemy => enemy.update(deltaTime));
    this.enemies = this.enemies.filter(enemy => enemy.active);
    
    // Update seeds
    this.seeds.forEach(seed => seed.update(deltaTime));
    this.seeds = this.seeds.filter(seed => seed.active);
    
    // Update power-ups
    this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
    this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
    
    // Check collisions
    this.checkCollisions();
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
    } else if (this.gameTime > 120000) { // 2+ minutes - more complex patterns
      const pattern = Math.floor(Math.random() * 3);
      if (pattern === 0) {
        // Two adjacent lanes
        const startLane = Math.floor(Math.random() * 2);
        this.enemies.push(this.createEnemy(startLane));
        this.enemies.push(this.createEnemy(startLane + 1));
        return;
      } else {
        lane = Math.floor(Math.random() * 3);
      }
    } else if (this.gameTime > 60000) { // 1+ minute - simple patterns
      // Alternating lanes
      const usedLanes = this.enemies
        .filter(e => e.y < 0)
        .map(e => e.lane);
      
      if (usedLanes.length > 0) {
        // Avoid last used lane
        const availableLanes = [0, 1, 2].filter(l => !usedLanes.includes(l));
        lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      } else {
        lane = Math.floor(Math.random() * 3);
      }
    } else {
      // Early game - completely random
      lane = Math.floor(Math.random() * 3);
    }
    
    this.enemies.push(this.createEnemy(lane));
  }
  
  private spawnSeed(): void {
    // Determine seed lane
    const lane = Math.floor(Math.random() * 3);
    this.seeds.push(this.createSeed(lane));
  }
  
  private spawnPowerUp(): void {
    // Determine power-up type and lane
    let powerUpType: PowerUpType;
    
    // Weighted probability based on rarity
    const rand = Math.random();
    if (rand < 0.6) {
      powerUpType = PowerUpType.SLOW_SPEED; // 60% chance
    } else if (rand < 0.9) {
      powerUpType = PowerUpType.SHIELD; // 30% chance
    } else {
      powerUpType = PowerUpType.EXTRA_LIFE; // 10% chance
    }
    
    const lane = Math.floor(Math.random() * 3);
    this.powerUps.push(this.createPowerUp(lane, powerUpType));
  }
  
  private increaseDifficulty(): void {
    // Increase game speed
    if (this.gameSpeed < 2) { // Cap at 2x speed
      this.gameSpeed += 0.1;
    }
    
    // Decrease enemy spawn interval
    if (this.enemySpawnInterval > 500) { // Min 0.5 seconds
      this.enemySpawnInterval *= 0.9;
    }
  }
  
  private checkCollisions(): void {
    // Check player collision with enemies
    for (const enemy of this.enemies) {
      if (this.checkObjectCollision(this.player, enemy)) {
        if (!this.player.shield) {
          this.handlePlayerCrash();
        }
        enemy.active = false;
      }
    }
    
    // Check player collision with seeds
    for (const seed of this.seeds) {
      if (this.checkObjectCollision(this.player, seed)) {
        this.collectSeed();
        seed.active = false;
      }
    }
    
    // Check player collision with power-ups
    for (const powerUp of this.powerUps) {
      if (this.checkObjectCollision(this.player, powerUp)) {
        this.collectPowerUp(powerUp);
        powerUp.active = false;
      }
    }
  }
  
  private checkObjectCollision(obj1: GameObject, obj2: GameObject): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }
  
  private handlePlayerCrash(): void {
    // Decrease player lives
    this.player.lives--;
    this.onLivesChange(this.player.lives);
    
    // Check game over
    if (this.player.lives <= 0) {
      this.gameOver();
    }
  }
  
  private collectSeed(): void {
    // Increase score
    this.score += 10;
    this.onScoreChange(this.score);
    
    // Play sound effect (to be implemented)
  }
  
  private collectPowerUp(powerUp: GameObject): void {
    if (powerUp.powerUpType === undefined) return;
    
    // Fix the PowerUpType comparison by using proper enum comparison
    if (powerUp.powerUpType === PowerUpType.SLOW_SPEED) {
      this.activateSlowMode();
    } else if (powerUp.powerUpType === PowerUpType.SHIELD) {
      this.activateShield();
    } else if (powerUp.powerUpType === PowerUpType.EXTRA_LIFE) {
      this.giveExtraLife();
    }
    
    // Play sound effect (to be implemented)
  }
  
  private activateSlowMode(): void {
    this.slowModeActive = true;
    this.slowModeTimer = this.slowModeDuration;
    this.onPowerUpStart(PowerUpType.SLOW_SPEED, this.slowModeDuration);
  }
  
  private activateShield(): void {
    this.player.shield = true;
    this.player.shieldTimer = 3000; // 3 seconds
    this.onPowerUpStart(PowerUpType.SHIELD, 3000);
  }
  
  private giveExtraLife(): void {
    this.player.lives++;
    this.onLivesChange(this.player.lives);
    this.onPowerUpStart(PowerUpType.EXTRA_LIFE, 0);
  }
  
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw lanes
    this.drawLanes();
    
    // Draw game objects
    this.seeds.forEach(seed => seed.render(this.ctx));
    this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    this.player.render(this.ctx);
  }
  
  private drawBackground(): void {
    // Draw road background
    this.ctx.fillStyle = '#1c1c1c';
    this.ctx.fillRect(
      this.roadCenterX - this.roadWidth / 2,
      0,
      this.roadWidth,
      this.canvas.height
    );
    
    // Draw side areas
    this.ctx.fillStyle = '#121212';
    this.ctx.fillRect(
      0,
      0,
      this.roadCenterX - this.roadWidth / 2,
      this.canvas.height
    );
    this.ctx.fillRect(
      this.roadCenterX + this.roadWidth / 2,
      0,
      this.canvas.width - (this.roadCenterX + this.roadWidth / 2),
      this.canvas.height
    );
  }
  
  private drawLanes(): void {
    // Draw lane dividers
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 5;
    this.ctx.setLineDash([20, 20]); // Dashed line
    
    // Animate lane dividers
    const dashOffset = (this.gameTime * 0.1) % 40;
    this.ctx.lineDashOffset = dashOffset;
    
    // Left lane divider
    this.ctx.beginPath();
    this.ctx.moveTo(this.roadCenterX - this.laneWidth / 2, 0);
    this.ctx.lineTo(this.roadCenterX - this.laneWidth / 2, this.canvas.height);
    this.ctx.stroke();
    
    // Right lane divider
    this.ctx.beginPath();
    this.ctx.moveTo(this.roadCenterX + this.laneWidth / 2, 0);
    this.ctx.lineTo(this.roadCenterX + this.laneWidth / 2, this.canvas.height);
    this.ctx.stroke();
    
    // Reset line dash
    this.ctx.setLineDash([]);
  }
  
  public handleTouchLeft(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.movePlayerLeft();
    }
  }
  
  public handleTouchRight(): void {
    if (this.gameState === GameState.GAMEPLAY) {
      this.movePlayerRight();
    }
  }
  
  public cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove event listeners if needed
  }
}
