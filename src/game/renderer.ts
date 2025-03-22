
import { GameObject, PlayerCar, RoadMarking, Decoration, ExplosionParticle, GameState } from './types';
import { drawRoad, renderExplosions } from './utils';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private roadWidth: number;
  private roadCenterX: number;
  
  constructor(canvas: HTMLCanvasElement, roadWidth: number, roadCenterX: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.roadWidth = roadWidth;
    this.roadCenterX = roadCenterX;
  }
  
  public render(
    gameState: GameState,
    player: PlayerCar | null,
    enemies: GameObject[],
    seeds: GameObject[],
    powerUps: GameObject[],
    roadMarkings: RoadMarking[],
    decorations: Decoration[],
    explosions: ExplosionParticle[]
  ): void {
    // Draw the road and background
    drawRoad(this.ctx, this.canvas.width, this.canvas.height, this.roadWidth, this.roadCenterX);
    
    // Draw decorations (trees, bushes)
    decorations.forEach(decoration => decoration.render(this.ctx));
    
    // Draw road markings
    roadMarkings.forEach(marking => marking.render(this.ctx));
    
    // Draw seeds
    seeds.forEach(seed => seed.render(this.ctx));
    
    // Draw power-ups
    powerUps.forEach(powerUp => powerUp.render(this.ctx));
    
    // Draw enemies
    enemies.forEach(enemy => enemy.render(this.ctx));
    
    // Draw player if it exists
    if (player && player.active) {
      player.render(this.ctx);
    }
    
    // Draw explosions
    renderExplosions(this.ctx, explosions);
    
    // Draw game state specific UI
    this.drawGameStateUI(gameState);
  }
  
  private drawGameStateUI(gameState: GameState): void {
    if (gameState === GameState.PAUSED) {
      this.ctx.save();
      
      // Semi-transparent overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Pause text
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
      
      this.ctx.restore();
    }
  }
}
