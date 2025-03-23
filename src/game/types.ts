
// Game state and type definitions

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

// Game object interfaces
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
  active: boolean;
  type?: string;
  powerUpType?: PowerUpType;
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

export interface RoadMarking {
  y: number;
  active: boolean;
  update: (delta: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

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
  onCollision?: () => void;
  customAssets?: {
    playerCarURL: string;
    enemyCarURLs: string[];
    seedImageURL?: string;
    useDefaultsIfBroken?: boolean;
  };
}
