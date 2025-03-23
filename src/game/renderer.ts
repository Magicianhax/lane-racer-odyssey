
import { GameObject, ExplosionParticle } from './types';

export class GameRenderer {
  static drawBackground(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    roadWidth: number,
    roadCenterX: number
  ): void {
    // Fill canvas with dark color for sky/background
    ctx.fillStyle = '#15202B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(
      (canvas.width - roadWidth) / 2,
      0,
      roadWidth,
      canvas.height
    );
    
    // Draw road shoulder lines
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.setLineDash([]);
    
    // Left shoulder
    ctx.beginPath();
    ctx.moveTo(roadCenterX - roadWidth / 2, 0);
    ctx.lineTo(roadCenterX - roadWidth / 2, canvas.height);
    ctx.stroke();
    
    // Right shoulder
    ctx.beginPath();
    ctx.moveTo(roadCenterX + roadWidth / 2, 0);
    ctx.lineTo(roadCenterX + roadWidth / 2, canvas.height);
    ctx.stroke();
  }
  
  static drawSeedFallback(ctx: CanvasRenderingContext2D, seed: GameObject): void {
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
  
  static drawExplosions(ctx: CanvasRenderingContext2D, explosions: ExplosionParticle[]): void {
    explosions.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  
  static drawUI(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    state: string,
    score: number,
    lives: number,
    highScore: number
  ): void {
    // Draw UI based on game state
    if (state === 'START_SCREEN') {
      ctx.save();
      
      // Draw title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Lane Runner', canvas.width / 2, canvas.height / 2 - 50);
      
      // Draw instructions
      ctx.font = '18px Arial';
      ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Use left and right arrows to move', canvas.width / 2, canvas.height / 2 + 30);
      
      // Draw high score if exists
      if (highScore > 0) {
        ctx.font = '20px Arial';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 80);
      }
      
      ctx.restore();
    } else if (state === 'PAUSED') {
      ctx.save();
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw paused text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
      
      // Draw instructions
      ctx.font = '18px Arial';
      ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 20);
      
      ctx.restore();
    } else if (state === 'GAME_OVER') {
      ctx.save();
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw game over text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
      
      // Draw score
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
      
      // Draw high score
      if (score > highScore) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + 40);
      } else {
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
      }
      
      // Draw instructions
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Arial';
      ctx.fillText('Press any key to restart', canvas.width / 2, canvas.height / 2 + 80);
      
      ctx.restore();
    } else if (state === 'GAMEPLAY') {
      // Draw HUD with score and lives during gameplay
      ctx.save();
      
      // Draw score
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
      
      // Draw lives
      ctx.fillText(`Lives: ${lives}`, 20, 60);
      
      ctx.restore();
    }
  }
}
