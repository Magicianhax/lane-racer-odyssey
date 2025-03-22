
import { GameObject, ExplosionParticle } from './types';

// Collision detection utility
export function isColliding(obj1: GameObject, obj2: GameObject): boolean {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Create explosion particles
export function createExplosionParticles(x: number, y: number): ExplosionParticle[] {
  const particles: ExplosionParticle[] = [];
  const particleCount = 20;
  const colors = ['#ff6600', '#ffcc00', '#ff3300', '#ff9900'];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const size = 2 + Math.random() * 6;
    const lifetime = 500 + Math.random() * 1000;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particles.push({
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
  
  return particles;
}

// Draw seed fallback when image is not available
export function drawSeedFallback(ctx: CanvasRenderingContext2D, seed: GameObject): void {
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

// Update explosion particles
export function updateExplosionParticles(particles: ExplosionParticle[], deltaTime: number): ExplosionParticle[] {
  // Update particles
  particles.forEach(particle => {
    particle.x += particle.vx * deltaTime * 0.05;
    particle.y += particle.vy * deltaTime * 0.05;
    particle.currentLife -= deltaTime;
    particle.alpha = particle.currentLife / particle.lifetime;
  });
  
  // Return only active particles
  return particles.filter(particle => particle.currentLife > 0);
}

// Draw road background
export function drawRoad(
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number, 
  roadWidth: number, 
  roadCenterX: number
): void {
  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Road background
  ctx.fillStyle = '#1a1a2a'; // Dark color for the road
  ctx.fillRect(roadCenterX - roadWidth / 2, 0, roadWidth, canvasHeight);
  
  // Green grass on the sides
  ctx.fillStyle = '#3a5a3a'; // Dark green for grass
  ctx.fillRect(0, 0, roadCenterX - roadWidth / 2, canvasHeight); // Left side
  ctx.fillRect(roadCenterX + roadWidth / 2, 0, canvasWidth - (roadCenterX + roadWidth / 2), canvasHeight); // Right side
}

// Draw UI elements (score, lives, etc.)
export function drawUI(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  score: number,
  lives: number,
  seedCount: number,
  gameState: number
): void {
  ctx.save();
  
  // Set text style
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  
  // Draw score
  ctx.fillText(`Score: ${score}`, 20, 30);
  
  // Draw seeds
  ctx.fillText(`Seeds: ${seedCount}`, 20, 60);
  
  // Draw lives
  ctx.fillText(`Lives: ${lives}`, canvasWidth - 120, 30);
  
  ctx.restore();
}

// Render explosion particles
export function renderExplosions(ctx: CanvasRenderingContext2D, explosions: ExplosionParticle[]): void {
  ctx.save();
  
  explosions.forEach(particle => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.alpha;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}
