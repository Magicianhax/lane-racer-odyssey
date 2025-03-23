
import { GameObject, PlayerCar, RoadMarking, Decoration, PowerUpType } from './types';

export class GameFactory {
  // Factory methods will be added to create different game objects
  
  static createPlayer(
    lanePositions: number[],
    laneWidth: number,
    canvasHeight: number,
    playerCarImage: HTMLImageElement
  ): PlayerCar {
    // Position player car at the bottom center of the canvas
    const lane = 1; // Start in middle lane
    const width = laneWidth * 0.8;
    const height = width * 2; // Car is twice as tall as it is wide
    const y = canvasHeight - height - 20; // Position above bottom with small margin
    
    return {
      x: lanePositions[lane] - (width / 2),
      y,
      width,
      height,
      lane,
      lanePosition: lanePositions[lane],
      targetLane: lane,
      transitioning: false,
      lives: 3,
      shield: false,
      shieldTimer: 0,
      active: true,
      update: (delta: number) => {
        // Update player lane position if transitioning
        if (player.transitioning) {
          const targetPosition = lanePositions[player.targetLane];
          const currentPosition = player.lanePosition;
          const moveSpeed = 0.5 * delta;
          
          // Calculate new position with smooth interpolation
          if (Math.abs(targetPosition - currentPosition) < moveSpeed) {
            // Reached target lane
            player.lanePosition = targetPosition;
            player.lane = player.targetLane;
            player.transitioning = false;
          } else if (targetPosition > currentPosition) {
            // Moving right
            player.lanePosition += moveSpeed;
          } else {
            // Moving left
            player.lanePosition -= moveSpeed;
          }
          
          // Update x position based on lane position
          player.x = player.lanePosition - (player.width / 2);
        }
        
        // Update shield timer
        if (player.shield) {
          player.shieldTimer += delta;
          if (player.shieldTimer >= 3000) { // Shield lasts 3 seconds
            player.shield = false;
            player.shieldTimer = 0;
          }
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        // Draw car body
        ctx.save();
        
        // Draw shield effect if active
        if (player.shield) {
          const shieldRadius = Math.max(player.width, player.height) * 0.7;
          const shieldAlpha = 0.3 + (Math.sin(player.shieldTimer / 200) * 0.2);
          
          ctx.beginPath();
          ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            shieldRadius,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(76, 201, 240, ${shieldAlpha})`;
          ctx.fill();
        }
        
        // Try to use the player car image if available
        try {
          ctx.drawImage(
            playerCarImage,
            player.x,
            player.y,
            player.width,
            player.height
          );
        } catch (e) {
          // Fall back to drawing a rectangle if the image fails
          ctx.fillStyle = '#3282F6';
          ctx.fillRect(player.x, player.y, player.width, player.height);
          
          // Add windows (windshield and rear window)
          ctx.fillStyle = '#222832';
          ctx.fillRect(
            player.x + player.width * 0.1,
            player.y + player.height * 0.15,
            player.width * 0.8,
            player.height * 0.25
          );
          ctx.fillRect(
            player.x + player.width * 0.1,
            player.y + player.height * 0.55,
            player.width * 0.8,
            player.height * 0.2
          );
          
          // Add wheels
          ctx.fillStyle = '#222222';
          // Front left wheel
          ctx.fillRect(
            player.x - player.width * 0.1,
            player.y + player.height * 0.2,
            player.width * 0.15,
            player.height * 0.2
          );
          // Front right wheel
          ctx.fillRect(
            player.x + player.width * 0.95,
            player.y + player.height * 0.2,
            player.width * 0.15,
            player.height * 0.2
          );
          // Rear left wheel
          ctx.fillRect(
            player.x - player.width * 0.1,
            player.y + player.height * 0.6,
            player.width * 0.15,
            player.height * 0.2
          );
          // Rear right wheel
          ctx.fillRect(
            player.x + player.width * 0.95,
            player.y + player.height * 0.6,
            player.width * 0.15,
            player.height * 0.2
          );
        }
        
        ctx.restore();
      }
    };
    
    // Need to create a reference to the player to use inside the methods
    const player = arguments[0];
    return player;
  }
  
  static createEnemy(
    lane: number,
    lanePositions: number[],
    laneWidth: number,
    canvasHeight: number,
    gameSpeed: number,
    enemyCarImages: HTMLImageElement[],
    slowModeActive: boolean
  ): GameObject {
    // Create an enemy car at the specified lane
    const width = laneWidth * 0.8;
    const height = width * 2; // Car is twice as tall as it is wide
    
    // Randomly select an enemy car image
    const imageIndex = Math.floor(Math.random() * enemyCarImages.length);
    
    const enemy: GameObject = {
      x: lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'enemy',
      update: (delta: number) => {
        // Move enemy down the canvas
        const speed = 0.3 * gameSpeed * (slowModeActive ? 0.5 : 1);
        enemy.y += speed * delta;
        
        // Check if out of bounds
        if (enemy.y > canvasHeight) {
          enemy.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Try to use the enemy car image if available
        if (enemyCarImages.length > 0) {
          try {
            ctx.drawImage(
              enemyCarImages[imageIndex],
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            );
          } catch (e) {
            // Fall back to drawing a rectangle if the image fails
            ctx.fillStyle = '#E04C4C';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Add windows
            ctx.fillStyle = '#222222';
            ctx.fillRect(
              enemy.x + enemy.width * 0.1,
              enemy.y + enemy.height * 0.15,
              enemy.width * 0.8,
              enemy.height * 0.25
            );
            ctx.fillRect(
              enemy.x + enemy.width * 0.1,
              enemy.y + enemy.height * 0.55,
              enemy.width * 0.8,
              enemy.height * 0.2
            );
          }
        } else {
          // No images available, draw a red rectangle
          ctx.fillStyle = '#E04C4C';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Add windows
          ctx.fillStyle = '#222222';
          ctx.fillRect(
            enemy.x + enemy.width * 0.1,
            enemy.y + enemy.height * 0.15,
            enemy.width * 0.8,
            enemy.height * 0.25
          );
          ctx.fillRect(
            enemy.x + enemy.width * 0.1,
            enemy.y + enemy.height * 0.55,
            enemy.width * 0.8,
            enemy.height * 0.2
          );
        }
        
        ctx.restore();
      }
    };
    
    return enemy;
  }
  
  static createSeed(
    lane: number,
    lanePositions: number[],
    laneWidth: number,
    canvasHeight: number,
    gameSpeed: number,
    seedImage: HTMLImageElement | null,
    slowModeActive: boolean,
    drawSeedFallback: (ctx: CanvasRenderingContext2D, seed: GameObject) => void
  ): GameObject {
    // Seed size is DOUBLED from the original size (2x bigger)
    const width = laneWidth * 0.4;
    const height = width;
    
    const seed: GameObject = {
      x: lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'seed',
      update: (delta: number) => {
        const speed = 0.25 * gameSpeed * (slowModeActive ? 0.5 : 1);
        seed.y += speed * delta;
        
        // Check if out of bounds
        if (seed.y > canvasHeight) {
          seed.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Try to use the seed image if available
        if (seedImage) {
          try {
            ctx.drawImage(
              seedImage,
              seed.x,
              seed.y,
              seed.width,
              seed.height
            );
            
            // Add a subtle glow effect behind the image
            ctx.shadowColor = '#ffdb4d';
            ctx.shadowBlur = 10;
            ctx.drawImage(
              seedImage,
              seed.x,
              seed.y,
              seed.width,
              seed.height
            );
            ctx.shadowBlur = 0;
          } catch (e) {
            // Fall back to drawing a circle if the image fails
            drawSeedFallback(ctx, seed);
          }
        } else {
          // No image available, use fallback
          drawSeedFallback(ctx, seed);
        }
        
        ctx.restore();
      }
    };
    
    return seed;
  }
  
  static createPowerUp(
    lane: number,
    lanePositions: number[],
    laneWidth: number,
    canvasHeight: number,
    gameSpeed: number,
    slowModeActive: boolean
  ): GameObject {
    // Randomly choose power-up type
    const powerUpType = Math.floor(Math.random() * 3);
    
    // Power-up size is medium (between seed and car)
    const width = laneWidth * 0.3;
    const height = width;
    
    const powerUp: GameObject = {
      x: lanePositions[lane] - (width / 2),
      y: -height,
      width,
      height,
      lane,
      active: true,
      type: 'powerUp',
      powerUpType: powerUpType as PowerUpType,
      update: (delta: number) => {
        const speed = 0.25 * gameSpeed * (slowModeActive ? 0.5 : 1);
        powerUp.y += speed * delta;
        
        // Check if out of bounds
        if (powerUp.y > canvasHeight) {
          powerUp.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        let color = '#ffffff';
        
        // Set color based on power-up type
        switch (powerUp.powerUpType) {
          case PowerUpType.SLOW_SPEED:
            color = '#9b87f5'; // Purple
            break;
          case PowerUpType.SHIELD:
            color = '#4cc9f0'; // Cyan
            break;
          case PowerUpType.EXTRA_LIFE:
            color = '#ff5e5e'; // Red
            break;
        }
        
        // Draw power-up shape (circled hexagon)
        ctx.fillStyle = color;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          powerUp.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Draw icon based on power-up type
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const centerX = powerUp.x + powerUp.width / 2;
        const centerY = powerUp.y + powerUp.height / 2;
        const iconSize = powerUp.width * 0.35;
        
        switch (powerUp.powerUpType) {
          case PowerUpType.SLOW_SPEED:
            // Draw clock icon
            ctx.beginPath();
            ctx.arc(centerX, centerY, iconSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw clock hands
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, centerY - iconSize * 0.7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + iconSize * 0.5, centerY + iconSize * 0.3);
            ctx.stroke();
            break;
            
          case PowerUpType.SHIELD:
            // Draw shield icon
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - iconSize);
            ctx.quadraticCurveTo(
              centerX + iconSize * 1.2, centerY - iconSize * 0.6,
              centerX + iconSize * 0.5, centerY + iconSize * 0.5
            );
            ctx.quadraticCurveTo(
              centerX, centerY + iconSize * 0.8,
              centerX - iconSize * 0.5, centerY + iconSize * 0.5
            );
            ctx.quadraticCurveTo(
              centerX - iconSize * 1.2, centerY - iconSize * 0.6,
              centerX, centerY - iconSize
            );
            ctx.stroke();
            break;
            
          case PowerUpType.EXTRA_LIFE:
            // Draw heart icon
            ctx.beginPath();
            // Left half of heart
            ctx.moveTo(centerX, centerY + iconSize * 0.4);
            ctx.bezierCurveTo(
              centerX - iconSize * 0.5, centerY,
              centerX - iconSize, centerY - iconSize * 0.5,
              centerX, centerY - iconSize * 0.5
            );
            // Right half of heart
            ctx.bezierCurveTo(
              centerX + iconSize, centerY - iconSize * 0.5,
              centerX + iconSize * 0.5, centerY,
              centerX, centerY + iconSize * 0.4
            );
            ctx.fill();
            break;
        }
        
        ctx.restore();
      }
    };
    
    return powerUp;
  }
  
  static createRoadMarking(
    y: number,
    canvasWidth: number,
    roadWidth: number,
    roadCenterX: number,
    gameSpeed: number,
    canvasHeight: number,
    slowModeActive: boolean
  ): RoadMarking {
    return {
      y,
      active: true,
      update: (delta: number) => {
        // Move the road marking down
        const speed = 0.3 * gameSpeed * (slowModeActive ? 0.5 : 1);
        roadMarking.y += speed * delta;
        
        // Remove if off screen
        if (roadMarking.y > canvasHeight) {
          roadMarking.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        // Draw center dashed line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.setLineDash([20, 20]);
        
        // Left lane divider
        ctx.beginPath();
        ctx.moveTo(roadCenterX - roadWidth / 3, roadMarking.y);
        ctx.lineTo(roadCenterX - roadWidth / 3, roadMarking.y + 40);
        ctx.stroke();
        
        // Right lane divider
        ctx.beginPath();
        ctx.moveTo(roadCenterX + roadWidth / 3, roadMarking.y);
        ctx.lineTo(roadCenterX + roadWidth / 3, roadMarking.y + 40);
        ctx.stroke();
        
        ctx.restore();
      }
    };
    
    // Need to create a reference to the roadMarking to use inside the methods
    const roadMarking = arguments[0];
    return roadMarking;
  }
  
  static createDecoration(
    canvasWidth: number,
    roadWidth: number,
    canvasHeight: number,
    gameSpeed: number,
    slowModeActive: boolean
  ): Decoration {
    // Choose left or right side of the road
    const side = Math.random() > 0.5 ? 'left' : 'right';
    
    // Choose decoration type
    const type = Math.random() > 0.3 ? 'tree' : 'bush';
    
    // Calculate decoration position
    const margin = 5 + Math.random() * 50; // Random margin from road
    const roadStartX = (canvasWidth - roadWidth) / 2;
    const roadEndX = roadStartX + roadWidth;
    
    const size = type === 'tree' ? 35 + Math.random() * 15 : 20 + Math.random() * 10;
    
    // Position the decoration on the specified side of the road
    const x = side === 'left' 
      ? roadStartX - margin - size 
      : roadEndX + margin;
    
    const decoration: Decoration = {
      x,
      y: -size,
      type,
      size,
      active: true,
      update: (delta: number) => {
        const speed = 0.3 * gameSpeed * (slowModeActive ? 0.5 : 1);
        decoration.y += speed * delta;
        
        // Remove if off screen
        if (decoration.y > canvasHeight) {
          decoration.active = false;
        }
      },
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        
        if (decoration.type === 'tree') {
          // Draw tree trunk
          ctx.fillStyle = '#775035';
          ctx.fillRect(
            decoration.x + decoration.size * 0.4,
            decoration.y + decoration.size * 0.6,
            decoration.size * 0.2,
            decoration.size * 0.4
          );
          
          // Draw tree top
          ctx.fillStyle = '#2E7D32';
          ctx.beginPath();
          ctx.moveTo(decoration.x, decoration.y + decoration.size * 0.6);
          ctx.lineTo(decoration.x + decoration.size / 2, decoration.y);
          ctx.lineTo(decoration.x + decoration.size, decoration.y + decoration.size * 0.6);
          ctx.closePath();
          ctx.fill();
          
          // Add second layer of tree
          ctx.fillStyle = '#388E3C';
          ctx.beginPath();
          ctx.moveTo(decoration.x + decoration.size * 0.2, decoration.y + decoration.size * 0.4);
          ctx.lineTo(decoration.x + decoration.size / 2, decoration.y + decoration.size * 0.1);
          ctx.lineTo(decoration.x + decoration.size * 0.8, decoration.y + decoration.size * 0.4);
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw bush
          ctx.fillStyle = '#2E7D32';
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size / 2,
            decoration.y + decoration.size / 2,
            decoration.size / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Add highlights to bush
          ctx.fillStyle = '#388E3C';
          ctx.beginPath();
          ctx.arc(
            decoration.x + decoration.size * 0.3,
            decoration.y + decoration.size * 0.3,
            decoration.size / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        
        ctx.restore();
      }
    };
    
    return decoration;
  }
}
