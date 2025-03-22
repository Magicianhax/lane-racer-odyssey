
import { GameObject, PlayerCar, RoadMarking, Decoration, PowerUpType } from './types';

export function createPlayer(
  canvas: HTMLCanvasElement,
  lanePositions: number[],
  laneWidth: number,
  playerCarImage: HTMLImageElement
): PlayerCar {
  // Create dimensions that fit the lane
  const width = laneWidth * 0.7;
  const height = width * 2; // Car is twice as long as it is wide
  
  // Start in the middle lane (lane 1)
  const lane = 1;
  const lanePosition = lanePositions[lane];
  
  // Position car at the bottom of the screen
  const x = lanePosition - (width / 2);
  const y = canvas.height - height - 20; // 20px buffer from bottom
  
  const player: PlayerCar = {
    x,
    y,
    width,
    height,
    lane,
    lanePosition,
    targetLane: lane,
    transitioning: false,
    active: true,
    lives: 3,
    shield: false,
    shieldTimer: 0,
    update: function(delta: number) {
      // Handle lane transitions
      if (this.lane !== this.targetLane) {
        const targetLanePos = lanePositions[this.targetLane];
        const distance = targetLanePos - this.lanePosition;
        const moveSpeed = 0.01 * delta;
        
        if (Math.abs(distance) <= moveSpeed) {
          // We've arrived at the target lane
          this.lanePosition = targetLanePos;
          this.transitioning = false;
          this.lane = this.targetLane;
        } else {
          // Move towards target lane
          this.lanePosition += (distance > 0 ? moveSpeed : -moveSpeed);
          this.transitioning = true;
        }
        
        // Update x position based on lane position
        this.x = this.lanePosition - (this.width / 2);
      }
      
      // Update shield timer
      if (this.shieldTimer > 0) {
        this.shieldTimer -= delta;
        if (this.shieldTimer <= 0) {
          this.shield = false;
          this.shieldTimer = 0;
        }
      }
    },
    render: function(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      // If the player has a shield, draw it
      if (this.shield) {
        const glow = ctx.createRadialGradient(
          this.x + this.width / 2, this.y + this.height / 2, this.width * 0.4,
          this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8
        );
        glow.addColorStop(0, 'rgba(76, 201, 240, 0.3)');
        glow.addColorStop(1, 'rgba(76, 201, 240, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(
          this.x + this.width / 2, 
          this.y + this.height / 2, 
          this.width * 0.8, 
          this.height * 0.6, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }
      
      // Draw the player car image
      try {
        ctx.drawImage(playerCarImage, this.x, this.y, this.width, this.height);
      } catch (e) {
        console.error("Error rendering player car:", e);
        // Fallback to a basic car shape if image fails
        ctx.fillStyle = '#4cc9f0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Windows
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.2, this.width * 0.6, this.height * 0.25);
        
        // Wheels
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 2, this.y + this.height * 0.2, 4, this.height * 0.15);
        ctx.fillRect(this.x + this.width - 2, this.y + this.height * 0.2, 4, this.height * 0.15);
        ctx.fillRect(this.x - 2, this.y + this.height * 0.65, 4, this.height * 0.15);
        ctx.fillRect(this.x + this.width - 2, this.y + this.height * 0.65, 4, this.height * 0.15);
      }
      
      ctx.restore();
    }
  };
  
  return player;
}

export function createEnemy(
  lane: number,
  lanePositions: number[],
  laneWidth: number,
  gameSpeed: number,
  slowModeActive: boolean,
  canvasHeight: number,
  enemyCarImages: HTMLImageElement[]
): GameObject {
  // Create dimensions that fit the lane
  const width = laneWidth * 0.7;
  const height = width * 2; // Car is twice as long as it is wide
  
  // Position on the specified lane
  const lanePosition = lanePositions[lane];
  const x = lanePosition - (width / 2);
  
  // Start above the canvas
  const y = -height * 2; // Start higher above the canvas to avoid sudden appearance
  
  // Choose a random enemy car image
  const imageIndex = Math.floor(Math.random() * enemyCarImages.length);
  
  const enemy: GameObject = {
    x,
    y,
    width,
    height,
    lane,
    active: true,
    type: 'enemy',
    update: function(delta: number) {
      // Move the enemy car downward
      const speed = 0.3 * gameSpeed * (slowModeActive ? 0.5 : 1);
      this.y += speed * delta;
      
      // Check if out of bounds
      if (this.y > canvasHeight) {
        this.active = false;
      }
    },
    render: function(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      // Draw the enemy car image
      try {
        if (enemyCarImages.length > 0 && enemyCarImages[imageIndex]) {
          ctx.drawImage(enemyCarImages[imageIndex], this.x, this.y, this.width, this.height);
        } else {
          throw new Error("Enemy car image not available");
        }
      } catch (e) {
        console.error("Error rendering enemy car:", e);
        // Fallback to a basic car shape if image fails
        ctx.fillStyle = '#ff5e5e';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Windows
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.2, this.width * 0.6, this.height * 0.25);
        
        // Wheels
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 2, this.y + this.height * 0.2, 4, this.height * 0.15);
        ctx.fillRect(this.x + this.width - 2, this.y + this.height * 0.2, 4, this.height * 0.15);
        ctx.fillRect(this.x - 2, this.y + this.height * 0.65, 4, this.height * 0.15);
        ctx.fillRect(this.x + this.width - 2, this.y + this.height * 0.65, 4, this.height * 0.15);
      }
      
      ctx.restore();
    }
  };
  
  return enemy;
}

export function createRoadMarking(
  y: number,
  roadWidth: number,
  roadCenterX: number,
  gameSpeed: number,
  slowModeActive: boolean,
  canvasHeight: number
): RoadMarking {
  const marking: RoadMarking = {
    y,
    active: true,
    update: function(delta: number) {
      // Move the road marking downward
      const speed = 0.5 * gameSpeed * (slowModeActive ? 0.5 : 1);
      this.y += speed * delta;
      
      // Check if out of bounds
      if (this.y > canvasHeight + 80) {
        this.active = false;
      }
    },
    render: function(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      // Set white color for road markings
      ctx.fillStyle = '#ffffff';
      
      // Draw left lane divider
      ctx.fillRect(
        roadCenterX - roadWidth / 6 - 5,
        this.y,
        10,
        60
      );
      
      // Draw right lane divider
      ctx.fillRect(
        roadCenterX + roadWidth / 6 - 5,
        this.y,
        10,
        60
      );
      
      ctx.restore();
    }
  };
  
  return marking;
}

export function createDecoration(
  canvasWidth: number,
  roadWidth: number,
  roadCenterX: number,
  gameSpeed: number,
  slowModeActive: boolean,
  canvasHeight: number
): Decoration {
  // Randomly choose left or right side of road
  const side = Math.random() > 0.5 ? 'left' : 'right';
  
  // Random position outside road
  const roadEdge = roadCenterX + (side === 'left' ? -roadWidth / 2 : roadWidth / 2);
  const roadSideWidth = (canvasWidth - roadWidth) / 2;
  const minDist = 20;
  const maxDist = roadSideWidth - 30;
  const distFromEdge = minDist + Math.random() * (maxDist - minDist);
  
  const x = roadEdge + (side === 'left' ? -distFromEdge : distFromEdge);
  const y = -50; // Start above canvas
  
  // Random type and size
  const type = Math.random() > 0.7 ? 'tree' : 'bush';
  const size = type === 'tree' ? 40 + Math.random() * 20 : 15 + Math.random() * 15;
  
  const decoration: Decoration = {
    x,
    y,
    type,
    size,
    active: true,
    update: function(delta: number) {
      // Move the decoration downward
      const speed = 0.4 * gameSpeed * (slowModeActive ? 0.5 : 1);
      this.y += speed * delta;
      
      // Check if out of bounds
      if (this.y > canvasHeight + size) {
        this.active = false;
      }
    },
    render: function(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      if (this.type === 'tree') {
        // Draw tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.size / 8, this.y + this.size / 3, this.size / 4, this.size * 2 / 3);
        
        // Draw tree crown
        ctx.fillStyle = '#2e8b57';
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.size / 3, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw bush
        ctx.fillStyle = '#3a9a3a';
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.size / 2, this.size / 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  };
  
  return decoration;
}

export function createPowerUp(
  lane: number,
  lanePositions: number[],
  laneWidth: number,
  gameSpeed: number,
  slowModeActive: boolean,
  canvasHeight: number,
  powerUpType: PowerUpType
): GameObject {
  // Power-up size is medium (between seed and car)
  const width = laneWidth * 0.3;
  const height = width;
  
  // Position on the specified lane
  const x = lanePositions[lane] - (width / 2);
  
  // Start above the canvas
  const y = -height;
  
  const powerUp: GameObject = {
    x,
    y,
    width,
    height,
    lane,
    active: true,
    type: 'powerUp',
    powerUpType,
    update: function(delta: number) {
      // Move the power-up downward
      const speed = 0.25 * gameSpeed * (slowModeActive ? 0.5 : 1);
      this.y += speed * delta;
      
      // Check if out of bounds
      if (this.y > canvasHeight) {
        this.active = false;
      }
    },
    render: function(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      let color = '#ffffff';
      
      // Set color based on power-up type
      switch (this.powerUpType) {
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
      
      // Draw power-up shape (circle)
      ctx.fillStyle = color;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Draw icon based on power-up type
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const iconSize = this.width * 0.35;
      
      switch (this.powerUpType) {
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
            centerX, centerY + iconSize
          );
          ctx.quadraticCurveTo(
            centerX - iconSize * 1.2, centerY - iconSize * 0.6,
            centerX, centerY - iconSize
          );
          ctx.stroke();
          break;
          
        case PowerUpType.EXTRA_LIFE:
          // Draw heart icon
          const heartSize = iconSize * 0.8;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY + heartSize * 0.3);
          ctx.bezierCurveTo(
            centerX, centerY, 
            centerX - heartSize, centerY, 
            centerX - heartSize, centerY - heartSize * 0.5
          );
          ctx.bezierCurveTo(
            centerX - heartSize, centerY - heartSize * 1.1,
            centerX - heartSize / 2, centerY - heartSize * 1.2,
            centerX, centerY - heartSize * 0.6
          );
          ctx.bezierCurveTo(
            centerX + heartSize / 2, centerY - heartSize * 1.2,
            centerX + heartSize, centerY - heartSize * 1.1,
            centerX + heartSize, centerY - heartSize * 0.5
          );
          ctx.bezierCurveTo(
            centerX + heartSize, centerY,
            centerX, centerY,
            centerX, centerY + heartSize * 0.3
          );
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
  };
  
  return powerUp;
}

export function createSeed(
  lane: number,
  lanePositions: number[],
  laneWidth: number,
  gameSpeed: number,
  slowModeActive: boolean,
  canvasHeight: number,
  seedImage: HTMLImageElement | null,
  drawSeedFallback: (ctx: CanvasRenderingContext2D, seed: GameObject) => void
): GameObject {
  // Seed size is doubled from the original size (2x bigger)
  const width = laneWidth * 0.4; // 0.2 * 2 = 0.4
  const height = width;
  
  // Position on the specified lane
  const x = lanePositions[lane] - (width / 2);
  
  // Start above the canvas
  const y = -height;
  
  const seed: GameObject = {
    x,
    y,
    width,
    height,
    lane,
    active: true,
    type: 'seed',
    update: function(delta: number) {
      // Move the seed downward
      const speed = 0.25 * gameSpeed * (slowModeActive ? 0.5 : 1);
      this.y += speed * delta;
      
      // Check if out of bounds
      if (this.y > canvasHeight) {
        this.active = false;
      }
    },
    render: function(ctx: CanvasRenderingContext2D) {
      ctx.save();
      
      // Try to use the seed image if available
      if (seedImage) {
        try {
          ctx.drawImage(
            seedImage,
            this.x,
            this.y,
            this.width,
            this.height
          );
          
          // Add a subtle glow effect behind the image
          ctx.shadowColor = '#ffdb4d';
          ctx.shadowBlur = 10;
          ctx.drawImage(
            seedImage,
            this.x,
            this.y,
            this.width,
            this.height
          );
          ctx.shadowBlur = 0;
        } catch (e) {
          // Fall back to drawing a circle if the image fails
          drawSeedFallback(ctx, this);
        }
      } else {
        // No image available, use fallback
        drawSeedFallback(ctx, this);
      }
      
      ctx.restore();
    }
  };
  
  return seed;
}
