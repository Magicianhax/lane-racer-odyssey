
import { ExplosionParticle } from './types';

export class GameUtils {
  static createExplosion(x: number, y: number): ExplosionParticle[] {
    const particleCount = 20;
    const colors = ['#ff6600', '#ffcc00', '#ff3300', '#ff9900'];
    const particles: ExplosionParticle[] = [];
    
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
}
