import { Howl } from 'howler';

export enum GameState {
  START_SCREEN,
  GAMEPLAY,
  PAUSED,
  GAME_OVER,
}

export enum PowerUpType {
  SLOW_SPEED,
  SHIELD,
  EXTRA_LIFE,
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  image?: HTMLImageElement;
}

interface Player extends GameObject {
  lives: number;
  isInvulnerable: boolean;
  invulnerableTimer: number;
}

interface Enemy extends GameObject {
}

interface Seed extends GameObject {
}

export interface GameConfig {
  canvas: HTMLCanvasElement;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  onPowerUpStart: (type: PowerUpType, duration: number) => void;
  onPowerUpEnd: (type: PowerUpType) => void;
  onCollision: () => void;
  onSeedCollected?: () => void; // New optional callback for seed collection
  customAssets?: {
    playerCarURL: string;
    enemyCarURLs: string[];
    seedImageURL: string;
    useDefaultsIfBroken?: boolean;
  };
}

export class GameEngine {
  private config: GameConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private enemies: Enemy[] = [];
  private seeds: Seed[] = [];
  private lastEnemySpawnTime: number = 0;
  private lastSeedSpawnTime: number = 0;
  private score: number = 0;
  private lives: number = 3;
  private animationFrameId: number = 0;
  private gameState: GameState = GameState.START_SCREEN;
  private powerUpTimers: { [key in PowerUpType]?: number } = {};
  private highScore: number = 0;
  private playerCarImage: HTMLImageElement | null = null;
  private enemyCarImages: HTMLImageElement[] = [];
  private seedImage: HTMLImageElement | null = null;
  private useDefaultAssets: boolean = true;
  
  constructor(config: GameConfig) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.player = {
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 100,
      width: 50,
      height: 80,
      speed: 5,
      lives: this.lives,
      isInvulnerable: false,
      invulnerableTimer: 0
    };
    
    this.loadAssets().then(() => {
      this.resetGame();
      this.drawStartScreen();
    });
    
    this.highScore = this.getHighScore();
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  private async loadAssets() {
    const { customAssets } = this.config;
    
    this.useDefaultAssets = !(customAssets && !customAssets.useDefaultsIfBroken);
    
    const playerCarURL = customAssets?.playerCarURL || '/playercar.png';
    const enemyCarURLs = customAssets?.enemyCarURLs || ['/enemycar1.png', '/enemycar2.png', '/enemycar3.png'];
    const seedImageURL = customAssets?.seedImageURL || '/seed.png';
    
    try {
      const [playerCarImage, seedImage] = await Promise.all([
        this.loadImage(playerCarURL),
        this.loadImage(seedImageURL),
      ]);
      
      this.playerCarImage = playerCarImage;
      this.seedImage = seedImage;
      this.player.image = playerCarImage;
      
      this.enemyCarImages = await Promise.all(enemyCarURLs.map(url => this.loadImage(url)));
    } catch (error) {
      console.error("Error loading custom assets, falling back to defaults:", error);
      this.useDefaultAssets = true;
      
      this.playerCarImage = await this.loadImage('/playercar.png');
      this.seedImage = await this.loadImage('/seed.png');
      this.player.image = this.playerCarImage;
      this.enemyCarImages = await Promise.all(['/enemycar1.png', '/enemycar2.png', '/enemycar3.png'].map(url => this.loadImage(url)));
    }
  }
  
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  private resetGame() {
    this.player = {
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 100,
      width: 50,
      height: 80,
      speed: 5,
      lives: 3,
      isInvulnerable: false,
      invulnerableTimer: 0,
      image: this.playerCarImage
    };
    this.enemies = [];
    this.seeds = [];
    this.score = 0;
    this.lives = 3;
    this.lastEnemySpawnTime = 0;
    this.lastSeedSpawnTime = 0;
    this.gameState = GameState.START_SCREEN;
    this.config.onScoreChange(this.score);
    this.config.onLivesChange(this.lives);
    this.config.onGameStateChange(this.gameState);
  }
  
  getHighScore(): number {
    const storedHighScore = localStorage.getItem('highScore');
    return storedHighScore ? parseInt(storedHighScore, 10) : 0;
  }
  
  setHighScore(score: number): void {
    this.highScore = score;
    localStorage.setItem('highScore', score.toString());
  }
  
  resizeCanvas() {
    this.player.x = this.canvas.width / 2 - 25;
    this.player.y = this.canvas.height - 100;
    this.draw();
  }
  
  startGame() {
    if (this.gameState !== GameState.GAMEPLAY) {
      this.resetGame();
      this.gameState = GameState.GAMEPLAY;
      this.config.onGameStateChange(this.gameState);
      this.lastEnemySpawnTime = 0;
      this.lastSeedSpawnTime = 0;
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  pauseGame() {
    if (this.gameState === GameState.GAMEPLAY) {
      this.gameState = GameState.PAUSED;
      this.config.onGameStateChange(this.gameState);
      cancelAnimationFrame(this.animationFrameId);
    }
  }
  
  resumeGame() {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.GAMEPLAY;
      this.config.onGameStateChange(this.gameState);
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  restartGame() {
    this.resetGame();
    this.startGame();
  }
  
  gameOver() {
    if (this.gameState !== GameState.GAME_OVER) {
      this.gameState = GameState.GAME_OVER;
      this.config.onGameStateChange(this.gameState);
      cancelAnimationFrame(this.animationFrameId);
      
      if (this.score > this.highScore) {
        this.setHighScore(this.score);
      }
    }
  }
  
  cleanup() {
    document.removeEventListener('keydown', this.handleKeyDown);
    cancelAnimationFrame(this.animationFrameId);
  }
  
  private gameLoop(timestamp: number) {
    if (this.gameState !== GameState.GAMEPLAY) {
      return;
    }
    
    this.update(timestamp);
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  private update(timestamp: number) {
    this.updatePlayer();
    this.updateEnemies(timestamp);
    this.updateSeeds(timestamp);
    this.checkCollisions();
    this.updatePowerUps(timestamp);
  }
  
  private updatePlayer() {
    if (this.player.isInvulnerable) {
      this.player.invulnerableTimer -= 16;
      if (this.player.invulnerableTimer <= 0) {
        this.player.isInvulnerable = false;
        this.player.invulnerableTimer = 0;
      }
    }
  }
  
  private updateEnemies(timestamp: number) {
    const difficultyFactor = Math.min(1 + (this.score / 500), 3);
    const enemySpawnInterval = Math.max(1000 / difficultyFactor, 400);
    
    if (timestamp - this.lastEnemySpawnTime > enemySpawnInterval) {
      this.spawnEnemy();
      this.lastEnemySpawnTime = timestamp;
    }
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].y += this.enemies[i].speed;
      
      if (this.enemies[i].y > this.canvas.height) {
        this.enemies.splice(i, 1);
      }
    }
  }
  
  private updateSeeds(timestamp: number) {
    const seedSpawnInterval = 2000;
    
    if (timestamp - this.lastSeedSpawnTime > seedSpawnInterval) {
      this.spawnSeed();
      this.lastSeedSpawnTime = timestamp;
    }
    
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      this.seeds[i].y += this.seeds[i].speed;
      
      if (this.seeds[i].y > this.canvas.height) {
        this.seeds.splice(i, 1);
      }
    }
  }
  
  private updatePowerUps(timestamp: number) {
    for (const type in this.powerUpTimers) {
      if (this.powerUpTimers.hasOwnProperty(type)) {
        const powerUpType = type as PowerUpType;
        if (this.powerUpTimers[powerUpType] !== undefined) {
          this.powerUpTimers[powerUpType]! -= 16;
          if (this.powerUpTimers[powerUpType]! <= 0) {
            this.endPowerUp(powerUpType);
            this.powerUpTimers[powerUpType] = undefined;
          }
        }
      }
    }
  }
  
  private checkCollisions() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.checkCollision(this.player, this.enemies[i])) {
        this.enemies.splice(i, 1);
        if (!this.player.isInvulnerable) {
          this.lives--;
          this.config.onLivesChange(this.lives);
          this.config.onCollision();
          
          if (this.lives <= 0) {
            this.gameOver();
          } else {
            this.activateShield(2000);
          }
        }
      }
    }
    
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      if (this.checkCollision(this.player, this.seeds[i])) {
        this.collectSeed(this.seeds[i]);
      }
    }
  }
  
  private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    return obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y;
  }
  
  protected collectSeed(seed: Seed): void {
    const index = this.seeds.indexOf(seed);
    if (index > -1) {
      this.seeds.splice(index, 1);
      this.score += 10;
      this.config.onScoreChange(this.score);
      
      // Call the onSeedCollected callback if provided
      if (this.config.onSeedCollected) {
        this.config.onSeedCollected();
      }
    }
  }
  
  private spawnEnemy() {
    const enemyWidth = 40;
    const enemyHeight = 60;
    const enemyX = Math.random() * (this.canvas.width - enemyWidth);
    const enemySpeed = 2 + Math.random() * 2;
    
    const enemyImage = this.enemyCarImages[Math.floor(Math.random() * this.enemyCarImages.length)];
    
    const newEnemy: Enemy = {
      x: enemyX,
      y: -enemyHeight,
      width: enemyWidth,
      height: enemyHeight,
      speed: enemySpeed,
      image: enemyImage
    };
    this.enemies.push(newEnemy);
  }
  
  private spawnSeed() {
    const seedWidth = 30;
    const seedHeight = 30;
    const seedX = Math.random() * (this.canvas.width - seedWidth);
    const seedSpeed = 2 + Math.random() * 1;
    
    const newSeed: Seed = {
      x: seedX,
      y: -seedHeight,
      width: seedWidth,
      height: seedHeight,
      speed: seedSpeed,
      image: this.seedImage
    };
    this.seeds.push(newSeed);
  }
  
  activateSlowMode(duration: number = 5000) {
    if (this.powerUpTimers[PowerUpType.SLOW_SPEED] === undefined) {
      this.enemies.forEach(enemy => enemy.speed /= 2);
      this.powerUpTimers[PowerUpType.SLOW_SPEED] = duration;
      this.config.onPowerUpStart(PowerUpType.SLOW_SPEED, duration);
    }
  }
  
  activateShield(duration: number = 3000) {
    if (!this.player.isInvulnerable) {
      this.player.isInvulnerable = true;
      this.player.invulnerableTimer = duration;
      this.config.onPowerUpStart(PowerUpType.SHIELD, duration);
    }
  }
  
  activateExtraLife() {
    this.lives = Math.min(3, this.lives + 1);
    this.config.onLivesChange(this.lives);
    this.config.onPowerUpStart(PowerUpType.EXTRA_LIFE, 0);
  }
  
  endPowerUp(type: PowerUpType) {
    this.config.onPowerUpEnd(type);
    
    if (type === PowerUpType.SLOW_SPEED) {
      this.enemies.forEach(enemy => enemy.speed *= 2);
    }
  }
  
  handleKeyDown(event: KeyboardEvent) {
    if (this.gameState === GameState.GAMEPLAY) {
      if (event.key === 'ArrowLeft') {
        this.movePlayerLeft();
      } else if (event.key === 'ArrowRight') {
        this.movePlayerRight();
      }
    }
  }
  
  handleTouchLeft = () => {
    this.movePlayerLeft();
  };
  
  handleTouchRight = () => {
    this.movePlayerRight();
  };
  
  movePlayerLeft() {
    this.player.x -= this.player.speed;
    if (this.player.x < 0) {
      this.player.x = 0;
    }
  }
  
  movePlayerRight() {
    this.player.x += this.player.speed;
    if (this.player.x > this.canvas.width - this.player.width) {
      this.player.x = this.canvas.width - this.player.width;
    }
  }
  
  draw() {
    if (this.gameState === GameState.START_SCREEN) {
      this.drawStartScreen();
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawPlayer();
      this.drawEnemies();
      this.drawSeeds();
    }
  }
  
  drawStartScreen() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#1f3a57';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press any key to start', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  drawPlayer() {
    if (this.player.image) {
      this.ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
    } else {
      this.ctx.fillStyle = 'blue';
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }
    
    if (this.player.isInvulnerable) {
      this.ctx.strokeStyle = 'cyan';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(this.player.x - 5, this.player.y - 5, this.player.width + 10, this.player.height + 10);
    }
  }
  
  drawEnemies() {
    this.enemies.forEach(enemy => {
      if (enemy.image) {
        this.ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
      } else {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }
    });
  }
  
  drawSeeds() {
    this.seeds.forEach(seed => {
      if (seed.image) {
        this.ctx.drawImage(seed.image, seed.x, seed.y, seed.width, seed.height);
      } else {
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillRect(seed.x, seed.y, seed.width, seed.height);
      }
    });
  }
}
