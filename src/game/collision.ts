
import { GameObject, PlayerCar, PowerUpType } from './types';

export class CollisionManager {
  static isColliding(obj1: GameObject, obj2: GameObject): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }
  
  static checkPreciseCollision(player: PlayerCar, enemy: GameObject, collisionMargin: number = 10): boolean {
    // Create tighter collision box for more precise collision detection
    const playerBox = {
      x: player.x + collisionMargin,
      y: player.y + collisionMargin,
      width: player.width - (collisionMargin * 2),
      height: player.height - (collisionMargin * 2)
    };
    
    const enemyBox = {
      x: enemy.x + collisionMargin,
      y: enemy.y + collisionMargin,
      width: enemy.width - (collisionMargin * 2),
      height: enemy.height - (collisionMargin * 2)
    };
    
    // Check if the tighter boxes are colliding
    return (
      playerBox.x < enemyBox.x + enemyBox.width &&
      playerBox.x + playerBox.width > enemyBox.x &&
      playerBox.y < enemyBox.y + enemyBox.height &&
      playerBox.y + playerBox.height > enemyBox.y
    );
  }
}
