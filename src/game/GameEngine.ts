import { Howl } from 'howler';

export enum GameState {
  START_SCREEN,
  GAMEPLAY,
  GAME_OVER,
  PAUSED
}

export enum PowerUpType {
  SLOW_SPEED,
  SHIELD,
  EXTRA_LIFE
}

interface GameEngineConfig {
  canvas: HTMLCanvasElement;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  onPowerUpStart: (type: PowerUpType, duration: number) => void;
  onPowerUpEnd: (type: PowerUpType) => void;
  customAssets?: {
    playerCarURL?: string;
    enemyCarURLs?: string[];
    seedImageURL?: string;
    useDefaultsIfBroken?: boolean;
  };
  soundEnabled?: boolean;
}

interface Car {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  image: HTMLImageElement;
}

interface PlayerCar extends Car {
  lane: number;
}

interface EnemyCar extends Car {
}

interface Seed {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
}

interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private playerCar: PlayerCar;
  private enemyCars: EnemyCar[];
  private seeds: Seed[];
  private powerUps: PowerUp[];
  private score: number;
  private lives: number;
  private gameState: GameState;
  private lastFrameTime: number;
  private animationFrameId: number | null;
  private lanePositions: number[];
  private scrollSpeed: number;
  private baseScrollSpeed: number;
  private difficulty: number;
  private lastEnemySpawnTime: number;
  private lastSeedSpawnTime: number;
  private lastPowerUpSpawnTime: number;
  private enemySpawnInterval: number;
  private seedSpawnInterval: number;
  private powerUpSpawnInterval: number;
  private playerImage: HTMLImageElement | null;
  private enemyImages: HTMLImageElement[];
  private seedImage: HTMLImageElement | null;
  private carCrashSound: HTMLAudioElement | null;
  private seedCollectSound: HTMLAudioElement | null;
  private onScoreChange: (score: number) => void;
  private onLivesChange: (lives: number) => void;
  private onGameStateChange: (state: GameState) => void;
  private onPowerUpStart: (type: PowerUpType, duration: number) => void;
  private onPowerUpEnd: (type: PowerUpType) => void;
  private activePowerUps: Map<PowerUpType, { timer: number; startTime: number; duration: number }>;
  private playerWidth: number;
  private playerHeight: number;
  private soundEnabled: boolean;

  constructor(config: GameEngineConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.playerWidth = this.canvas.width * 0.15;
    this.playerHeight = this.playerWidth * 1.5;
    this.playerCar = {
      x: 0,
      y: this.canvas.height - this.playerHeight - 20,
      width: this.playerWidth,
      height: this.playerHeight,
      speed: 0,
      lane: 1,
      image: new Image()
    };
    this.enemyCars = [];
    this.seeds = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = 3;
    this.gameState = GameState.START_SCREEN;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
    this.lanePositions = [
      this.canvas.width * 0.25,
      this.canvas.width * 0.5,
      this.canvas.width * 0.75
    ];
    this.playerCar.x = this.lanePositions[1];
    this.scrollSpeed = 5;
    this.baseScrollSpeed = 5;
    this.difficulty = 1;
    this.lastEnemySpawnTime = 0;
    this.lastSeedSpawnTime = 0;
    this.lastPowerUpSpawnTime = 0;
    this.enemySpawnInterval = 2000;
    this.seedSpawnInterval = 1000;
    this.powerUpSpawnInterval = 5000;
    this.onScoreChange = config.onScoreChange;
    this.onLivesChange = config.onLivesChange;
    this.onGameStateChange = config.onGameStateChange;
    this.onPowerUpStart = config.onPowerUpStart;
    this.onPowerUpEnd = config.onPowerUpEnd;
    this.activePowerUps = new Map();
    
    // Load custom assets or use defaults
    this.playerImage = new Image();
    this.enemyImages = [new Image(), new Image(), new Image()];
    this.seedImage = new Image();
    
    if (config.customAssets?.useDefaultsIfBroken) {
      this.playerImage.src = config.customAssets?.playerCarURL || '/playercar.png';
      this.enemyImages = (config.customAssets?.enemyCarURLs || ['/enemycar1.png', '/enemycar2.png', '/enemycar3.png']).map(url => {
        const img = new Image();
        img.src = url;
        return img;
      });
      this.seedImage.src = config.customAssets?.seedImageURL || '/seed.png';
    } else {
      this.playerImage.src = config.customAssets?.playerCarURL || '/playercar.png';
      this.enemyImages = (config.customAssets?.enemyCarURLs || ['/enemycar1.png', '/enemycar2.png', '/enemycar3.png']).map(url => {
        const img = new Image();
        img.src = url;
        return img;
      });
      this.seedImage.src = config.customAssets?.seedImageURL || '/seed.png';
    }
    
    // Initialize sounds
    this.carCrashSound = new Audio('/car.m4a');
    this.seedCollectSound = new Audio('/crash.m4a');
    this.soundEnabled = config.soundEnabled !== undefined ? config.soundEnabled : true;
    
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (this.gameState !== GameState.GAMEPLAY) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        this.movePlayerLeft();
        break;
      case 'ArrowRight':
        this.movePlayerRight();
        break;
      case 'p':
      case 'P':
        this.pauseGame();
        break;
    }
  }
  
  private movePlayerLeft(): void {
    if (this.playerCar.lane > 0) {
      this.playerCar.lane--;
      this.playerCar.x = this.lanePositions[this.playerCar.lane];
    }
  }
  
  private movePlayerRight(): void {
    if (this.playerCar.lane < 2) {
      this.playerCar.lane++;
      this.playerCar.x = this.lanePositions[this.playerCar.lane];
    }
  }
  
  private spawnEnemyCar(): void {
    if (performance.now() - this.lastEnemySpawnTime > this.enemySpawnInterval) {
      const lane = Math.floor(Math.random() * 3);
      const enemyImage = this.enemyImages[Math.floor(Math.random() * this.enemyImages.length)];
      const enemyWidth = this.canvas.width * 0.15;
      const enemyHeight = enemyWidth * 1.5;
      
      this.enemyCars.push({
        x: this.lanePositions[lane],
        y: -enemyHeight,
        width: enemyWidth,
        height: enemyHeight,
        speed: this.scrollSpeed + (this.difficulty * 0.5),
        image: enemyImage
      });
      this.lastEnemySpawnTime = performance.now();
    }
  }
  
  private spawnSeed(): void {
    if (performance.now() - this.lastSeedSpawnTime > this.seedSpawnInterval) {
      const lane = Math.floor(Math.random() * 3);
      const seedWidth = this.canvas.width * 0.05;
      const seedHeight = seedWidth;
      
      this.seeds.push({
        x: this.lanePositions[lane],
        y: -seedHeight,
        width: seedWidth,
        height: seedHeight,
        image: this.seedImage!
      });
      this.lastSeedSpawnTime = performance.now();
    }
  }
  
  private spawnPowerUp(): void {
    if (performance.now() - this.lastPowerUpSpawnTime > this.powerUpSpawnInterval) {
      const lane = Math.floor(Math.random() * 3);
      const powerUpWidth = this.canvas.width * 0.08;
      const powerUpHeight = powerUpWidth;
      const powerUpType = Math.random() < 0.5 ? PowerUpType.SLOW_SPEED : PowerUpType.SHIELD;
      
      this.powerUps.push({
        x: this.lanePositions[lane],
        y: -powerUpHeight,
        width: powerUpWidth,
        height: powerUpHeight,
        type: powerUpType
      });
      this.lastPowerUpSpawnTime = performance.now();
    }
  }
  
  private updateGameObjects(deltaTime: number): void {
    this.updateEnemyCars(deltaTime);
    this.updateSeeds(deltaTime);
    this.updatePowerUps(deltaTime);
    this.checkCollisions();
    this.checkPowerUpCollisions();
  }
  
  private updateEnemyCars(deltaTime: number): void {
    this.enemyCars.forEach(car => {
      car.y += car.speed * deltaTime / 16;
    });
    
    this.enemyCars = this.enemyCars.filter(car => car.y < this.canvas.height);
  }
  
  private updateSeeds(deltaTime: number): void {
    this.seeds.forEach(seed => {
      seed.y += this.scrollSpeed * deltaTime / 16;
    });
    
    this.seeds = this.seeds.filter(seed => seed.y < this.canvas.height);
  }
  
  private updatePowerUps(deltaTime: number): void {
    this.powerUps.forEach(powerUp => {
      powerUp.y += this.scrollSpeed * deltaTime / 16;
    });
    
    this.powerUps = this.powerUps.filter(powerUp => powerUp.y < this.canvas.height);
  }
  
  private checkCollisions(): void {
    this.enemyCars.forEach(car => {
      if (
        this.playerCar.x < car.x + car.width &&
        this.playerCar.x + this.playerCar.width > car.x &&
        this.playerCar.y < car.y + car.height &&
        this.playerCar.y + this.playerCar.height > car.y
      ) {
        if (this.activePowerUps.has(PowerUpType.SHIELD)) {
          this.enemyCars = this.enemyCars.filter(c => c !== car);
          this.playSoundEffect(this.carCrashSound);
        } else {
          this.lives--;
          this.onLivesChange(this.lives);
          this.endGame();
          this.playSoundEffect(this.carCrashSound);
        }
      }
    });
  }
  
  private checkPowerUpCollisions(): void {
    this.powerUps.forEach(powerUp => {
      if (
        this.playerCar.x < powerUp.x + powerUp.width &&
        this.playerCar.x + this.playerCar.width > powerUp.x &&
        this.playerCar.y < powerUp.y + powerUp.height &&
        this.playerCar.y + this.playerCar.height > powerUp.y
      ) {
        this.activatePowerUp(powerUp.type);
        this.powerUps = this.powerUps.filter(p => p !== powerUp);
      }
    });
    
    this.seeds.forEach(seed => {
      if (
        this.playerCar.x < seed.x + seed.width &&
        this.playerCar.x + this.playerCar.width > seed.x &&
        this.playerCar.y < seed.y + seed.height &&
        this.playerCar.y + this.playerCar.height > seed.y
      ) {
        this.score++;
        this.onScoreChange(this.score);
        this.seeds = this.seeds.filter(s => s !== seed);
        this.playSoundEffect(this.seedCollectSound);
      }
    });
  }
  
  private activatePowerUp(type: PowerUpType): void {
    let duration = 3000;
    
    switch (type) {
      case PowerUpType.SLOW_SPEED:
        this.scrollSpeed = this.baseScrollSpeed / 2;
        break;
      case PowerUpType.SHIELD:
        break;
      case PowerUpType.EXTRA_LIFE:
        this.lives++;
        this.onLivesChange(this.lives);
        this.onPowerUpStart(type, duration);
        return;
    }
    
    this.onPowerUpStart(type, duration);
    
    this.activePowerUps.set(type, {
      timer: duration,
      startTime: performance.now(),
      duration: duration
    });
  }
  
  private updatePowerUpTimers(deltaTime: number): void {
    this.activePowerUps.forEach((powerUp, type) => {
      powerUp.timer -= deltaTime;
      
      if (powerUp.timer <= 0) {
        this.deactivatePowerUp(type);
      }
    });
  }
  
  private deactivatePowerUp(type: PowerUpType): void {
    switch (type) {
      case PowerUpType.SLOW_SPEED:
        this.scrollSpeed = this.baseScrollSpeed;
        break;
    }
    
    this.onPowerUpEnd(type);
    this.activePowerUps.delete(type);
  }
  
  private drawGameObjects(): void {
    if (!this.ctx) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw road lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lanePositions[0] - this.playerCar.width / 2, 0);
    this.ctx.lineTo(this.lanePositions[0] - this.playerCar.width / 2, this.canvas.height);
    this.ctx.moveTo(this.lanePositions[1] - this.playerCar.width / 2, 0);
    this.ctx.lineTo(this.lanePositions[1] - this.playerCar.width / 2, this.canvas.height);
    this.ctx.moveTo(this.lanePositions[2] - this.playerCar.width / 2, 0);
    this.ctx.lineTo(this.lanePositions[2] - this.playerCar.width / 2, this.canvas.height);
    this.ctx.stroke();
    
    // Draw player car
    if (this.playerImage) {
      this.ctx.drawImage(this.playerImage, this.playerCar.x, this.playerCar.y, this.playerCar.width, this.playerCar.height);
    } else {
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(this.playerCar.x, this.playerCar.y, this.playerCar.width, this.playerCar.height);
    }
    
    // Draw enemy cars
    this.enemyCars.forEach(car => {
      if (car.image) {
        this.ctx.drawImage(car.image, car.x, car.y, car.width, car.height);
      } else {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(car.x, car.y, car.width, car.height);
      }
    });
    
    // Draw seeds
    this.seeds.forEach(seed => {
      if (seed.image) {
        this.ctx.drawImage(seed.image, seed.x, seed.y, seed.width, seed.height);
      } else {
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillRect(seed.x, seed.y, seed.width, seed.height);
      }
    });
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => {
      this.ctx!.fillStyle = powerUp.type === PowerUpType.SLOW_SPEED ? 'blue' : 'cyan';
      this.ctx!.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
  }
  
  private playSoundEffect(sound: HTMLAudioElement | null): void {
    if (sound && this.soundEnabled) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.error("Error playing sound:", e));
    }
  }
  
  private adjustDifficulty(): void {
    if (this.score > 0 && this.score % 5 === 0) {
      this.difficulty += 0.1;
      this.scrollSpeed = this.baseScrollSpeed + this.difficulty;
      this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval - 50);
      this.seedSpawnInterval = Math.max(200, this.seedSpawnInterval - 20);
      this.powerUpSpawnInterval = Math.max(1000, this.powerUpSpawnInterval - 100);
    }
  }
  
  private resetGame(): void {
    this.playerCar.lane = 1;
    this.playerCar.x = this.lanePositions[this.playerCar.lane];
    this.enemyCars = [];
    this.seeds = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = 3;
    this.scrollSpeed = this.baseScrollSpeed;
    this.difficulty = 1;
    this.enemySpawnInterval = 2000;
    this.seedSpawnInterval = 1000;
    this.powerUpSpawnInterval = 5000;
    this.onScoreChange(0);
    this.onLivesChange(3);
    this.activePowerUps.clear();
  }
  
  private endGame(): void {
    this.gameState = GameState.GAME_OVER;
    this.onGameStateChange(GameState.GAME_OVER);
    
    // Save high score
    const currentHighScore = localStorage.getItem('highScore');
    const currentScore = this.score;
    
    if (currentHighScore === null || currentScore > parseInt(currentHighScore, 10)) {
      localStorage.setItem('highScore', currentScore.toString());
    }
  }
  
  private gameLoop(timestamp: number): void {
    if (this.gameState !== GameState.GAMEPLAY) return;
    
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    this.updateGameObjects(deltaTime);
    this.updatePowerUpTimers(deltaTime);
    this.drawGameObjects();
    this.adjustDifficulty();
    
    if (this.lives <= 0) {
      this.endGame();
      return;
    }
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }
  
  public getHighScore(): number {
    const storedHighScore = localStorage.getItem('highScore');
    return storedHighScore ? parseInt(storedHighScore, 10) : 0;
  }
  
  public startGame(): void {
    this.resetGame();
    this.gameState = GameState.GAMEPLAY;
    this.onGameStateChange(GameState.GAMEPLAY);
    this.lastFrameTime = performance.now();
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  public resizeCanvas(): void {
    if (!this.canvas) return;
    
    this.lanePositions = [
      this.canvas.width * 0.25,
      this.canvas.width * 0.5,
      this.canvas.width * 0.75
    ];
    
    this.playerCar.x = this.lanePositions[1];
    this.playerWidth = this.canvas.width * 0.15;
    this.playerHeight = this.playerWidth * 1.5;
  }
  
  public cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
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
}
