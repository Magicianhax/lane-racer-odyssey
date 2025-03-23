
export class AudioManager {
  private engineSound: HTMLAudioElement | null = null;
  private crashSound: HTMLAudioElement | null = null;
  private isInitialized: boolean = false;
  private isEnginePlaying: boolean = false;
  private isPlayingCrashSound: boolean = false;

  constructor() {
    this.initAudio();
  }

  private async initAudio() {
    try {
      this.engineSound = new Audio('/car.m4a');
      this.crashSound = new Audio('/crash.m4a');
      
      // Configure engine sound for looping
      if (this.engineSound) {
        this.engineSound.loop = true;
        this.engineSound.volume = 0.4; // Appropriate volume level
      }
      
      // Configure crash sound
      if (this.crashSound) {
        this.crashSound.loop = false;
        this.crashSound.volume = 0.7; // Slightly louder for impact
      }
      
      // Setup crash sound ended listener to restart engine
      if (this.crashSound) {
        this.crashSound.addEventListener('ended', () => {
          this.isPlayingCrashSound = false;
          // Small delay before restarting engine sound
          setTimeout(() => {
            this.playEngineSound();
          }, 100);
        });
      }
      
      this.isInitialized = true;
      console.info("Audio assets loaded successfully");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  }

  public playEngineSound() {
    if (!this.engineSound || this.isPlayingCrashSound) return;
    
    try {
      if (!this.isEnginePlaying) {
        // Reset engine sound to start from beginning
        this.engineSound.currentTime = 0;
        
        // Play with a small delay to ensure context is ready
        const playPromise = this.engineSound.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.isEnginePlaying = true;
            console.info("Car sound started successfully");
          }).catch(error => {
            // Auto-play was prevented or there was another error
            console.error("Error playing engine sound:", error);
            // Try again after user interaction
            setTimeout(() => this.playEngineSound(), 200);
          });
        }
      }
    } catch (error) {
      console.error("Error in playEngineSound:", error);
    }
  }

  public stopEngineSound() {
    if (!this.engineSound) return;
    
    try {
      this.engineSound.pause();
      this.engineSound.currentTime = 0;
      this.isEnginePlaying = false;
    } catch (error) {
      console.error("Error stopping engine sound:", error);
    }
  }

  public pauseEngineSound() {
    if (!this.engineSound || !this.isEnginePlaying) return;
    
    try {
      this.engineSound.pause();
      // Don't reset currentTime when pausing
      this.isEnginePlaying = false;
    } catch (error) {
      console.error("Error pausing engine sound:", error);
    }
  }

  public resumeEngineSound() {
    if (!this.engineSound || this.isPlayingCrashSound) return;
    
    try {
      const playPromise = this.engineSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isEnginePlaying = true;
        }).catch(error => {
          console.error("Error resuming engine sound:", error);
        });
      }
    } catch (error) {
      console.error("Error resuming engine sound:", error);
    }
  }

  public playCrashSound() {
    if (!this.crashSound || this.isPlayingCrashSound) return;
    
    try {
      // First stop the engine sound
      this.pauseEngineSound();
      
      // Mark that we're playing crash sound
      this.isPlayingCrashSound = true;
      
      // Reset and play crash sound
      this.crashSound.currentTime = 0;
      
      console.info("Playing crash sound");
      const playPromise = this.crashSound.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing crash sound:", error);
          this.isPlayingCrashSound = false;
          // If crash sound fails, resume engine after a delay
          setTimeout(() => this.playEngineSound(), 100);
        });
      }
    } catch (error) {
      console.error("Error in playCrashSound:", error);
      this.isPlayingCrashSound = false;
      // If crash sound fails, resume engine after a delay
      setTimeout(() => this.playEngineSound(), 100);
    }
  }

  public stopAllSounds() {
    this.stopEngineSound();
    
    if (this.crashSound) {
      this.crashSound.pause();
      this.crashSound.currentTime = 0;
      this.isPlayingCrashSound = false;
    }
  }

  public handleGameStateChange(state: 'START_SCREEN' | 'GAMEPLAY' | 'PAUSED' | 'GAME_OVER') {
    switch (state) {
      case 'START_SCREEN':
        this.stopAllSounds();
        break;
        
      case 'GAMEPLAY':
        if (!this.isPlayingCrashSound) {
          console.info("Game state changed to GAMEPLAY and no crash sound playing, starting engine sound");
          this.playEngineSound();
        }
        break;
        
      case 'PAUSED':
        this.pauseEngineSound();
        break;
        
      case 'GAME_OVER':
        this.stopAllSounds();
        break;
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

// Create a singleton instance
const audioManager = new AudioManager();
export default audioManager;
