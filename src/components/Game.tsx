import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, PowerUpType } from '../game/GameEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Heart, Shield, Clock, Trophy, Loader2, Pause, Play, RefreshCw, HelpCircle, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const DEFAULT_PLAYER_CAR = '/playercar.png';
const DEFAULT_ENEMY_CARS = ['/enemycar1.png', '/enemycar2.png', '/enemycar3.png'];
const SEED_IMAGE = '/seed.png';
const CAR_SOUND = '/car.m4a';
const CRASH_SOUND = '/crash.m4a';
const SEED_SOUND = '/seed.m4a';
const SLOW_TIMER_SOUND = '/5 sec.m4a';
const BUTTON_SOUND = '/tap.mp3';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [highScore, setHighScore] = useState<number>(0);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [activeSlowMode, setActiveSlowMode] = useState<boolean>(false);
  const [activeShield, setActiveShield] = useState<boolean>(false);
  const [slowModeTimer, setSlowModeTimer] = useState<number>(0);
  const [shieldTimer, setShieldTimer] = useState<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [gameInitialized, setGameInitialized] = useState(false);
  const [carAssetsLoaded, setCarAssetsLoaded] = useState(false);
  const [playerCarURL, setPlayerCarURL] = useState<string>(DEFAULT_PLAYER_CAR);
  const [enemyCarURLs, setEnemyCarURLs] = useState<string[]>(DEFAULT_ENEMY_CARS);
  const [seedImageURL, setSeedImageURL] = useState<string>(SEED_IMAGE);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [currentHowToPlayPage, setCurrentHowToPlayPage] = useState<number>(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  
  // Track key presses for multi-lane movement
  const keyPressTimeoutRef = useRef<number | null>(null);
  const keyPressCountRef = useRef<number>(0);
  const lastKeyPressTimeRef = useRef<number>(0);
  
  // Sound references
  const carSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const seedSoundRef = useRef<HTMLAudioElement | null>(null);
  const slowTimerSoundRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsLoadedRef = useRef<boolean>(false);
  
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const preloadSounds = async () => {
      try {
        console.log("Loading sound assets...");
        
        const carSound = new Audio(CAR_SOUND);
        carSound.loop = true;
        carSound.volume = 0.3;
        carSoundRef.current = carSound;
        
        const crashSound = new Audio(CRASH_SOUND);
        crashSound.volume = 0.7;
        crashSoundRef.current = crashSound;
        
        // New sound effects
        const seedSound = new Audio(SEED_SOUND);
        seedSound.volume = 0.5;
        seedSoundRef.current = seedSound;
        
        const slowTimerSound = new Audio(SLOW_TIMER_SOUND);
        slowTimerSound.volume = 0.4;
        slowTimerSoundRef.current = slowTimerSound;
        
        const buttonSound = new Audio(BUTTON_SOUND);
        buttonSound.volume = 0.3;
        buttonSoundRef.current = buttonSound;
        
        await Promise.all([
          new Promise<void>((resolve) => {
            carSound.addEventListener('canplaythrough', () => {
              console.log("Car sound loaded successfully");
              resolve();
            }, { once: true });
            
            carSound.addEventListener('error', (e) => {
              console.error("Error loading car sound:", e);
              resolve();
            });
            
            carSound.load();
          }),
          
          new Promise<void>((resolve) => {
            crashSound.addEventListener('canplaythrough', () => {
              console.log("Crash sound loaded successfully");
              resolve();
            }, { once: true });
            
            crashSound.addEventListener('error', (e) => {
              console.error("Error loading crash sound:", e);
              resolve();
            });
            
            crashSound.load();
          }),
          
          // Load new sound effects
          new Promise<void>((resolve) => {
            seedSound.addEventListener('canplaythrough', () => {
              console.log("Seed sound loaded successfully");
              resolve();
            }, { once: true });
            
            seedSound.addEventListener('error', (e) => {
              console.error("Error loading seed sound:", e);
              resolve();
            });
            
            seedSound.load();
          }),
          
          new Promise<void>((resolve) => {
            slowTimerSound.addEventListener('canplaythrough', () => {
              console.log("Slow timer sound loaded successfully");
              resolve();
            }, { once: true });
            
            slowTimerSound.addEventListener('error', (e) => {
              console.error("Error loading slow timer sound:", e);
              resolve();
            });
            
            slowTimerSound.load();
          }),
          
          new Promise<void>((resolve) => {
            buttonSound.addEventListener('canplaythrough', () => {
              console.log("Button sound loaded successfully");
              resolve();
            }, { once: true });
            
            buttonSound.addEventListener('error', (e) => {
              console.error("Error loading button sound:", e);
              resolve();
            });
            
            buttonSound.load();
          })
        ]);
        
        console.log("All sound assets loaded");
        soundsLoadedRef.current = true;
      } catch (err) {
        console.error("Error preloading sounds:", err);
        soundsLoadedRef.current = true;
      }
    };
    
    preloadSounds();
    
    const preloadCarAssets = async () => {
      try {
        console.log("Loading car assets...");
        
        const playerCarImage = new Image();
        const enemyCar1 = new Image();
        const enemyCar2 = new Image();
        const enemyCar3 = new Image();
        const seedImage = new Image();
        
        const promises = [
          new Promise<void>((resolve, reject) => {
            playerCarImage.onload = () => {
              console.log("Player car image loaded successfully");
              resolve();
            };
            playerCarImage.onerror = (e) => {
              console.error("Error loading player car image:", e);
              reject(new Error("Failed to load player car image"));
            };
            playerCarImage.src = playerCarURL;
          }),
          
          new Promise<void>((resolve, reject) => {
            enemyCar1.onload = () => {
              console.log("Enemy car 1 image loaded successfully");
              resolve();
            };
            enemyCar1.onerror = (e) => {
              console.error("Error loading enemy car 1 image:", e);
              reject(new Error("Failed to load enemy car 1 image"));
            };
            enemyCar1.src = enemyCarURLs[0];
          }),
          
          new Promise<void>((resolve, reject) => {
            enemyCar2.onload = () => {
              console.log("Enemy car 2 image loaded successfully");
              resolve();
            };
            enemyCar2.onerror = (e) => {
              console.error("Error loading enemy car 2 image:", e);
              reject(new Error("Failed to load enemy car 2 image"));
            };
            enemyCar2.src = enemyCarURLs[1];
          }),
          
          new Promise<void>((resolve, reject) => {
            enemyCar3.onload = () => {
              console.log("Enemy car 3 image loaded successfully");
              resolve();
            };
            enemyCar3.onerror = (e) => {
              console.error("Error loading enemy car 3 image:", e);
              reject(new Error("Failed to load enemy car 3 image"));
            };
            enemyCar3.src = enemyCarURLs[2];
          }),
          
          new Promise<void>((resolve, reject) => {
            seedImage.onload = () => {
              console.log("Seed image loaded successfully");
              resolve();
            };
            seedImage.onerror = (e) => {
              console.error("Error loading seed image:", e);
              reject(new Error("Failed to load seed image"));
            };
            seedImage.src = seedImageURL;
          })
        ];
        
        try {
          await Promise.all(promises);
          console.log("All car assets loaded successfully");
        } catch (error) {
          console.error("Some car assets failed to load:", error);
          setLoadingError("Some game assets couldn't be loaded. Using fallbacks.");
        } finally {
          setCarAssetsLoaded(true);
        }
      } catch (err) {
        console.error("Error in car asset preloading:", err);
        setLoadingError("Failed to load game assets. Using fallbacks.");
        setCarAssetsLoaded(true);
      }
    };
    
    preloadCarAssets();
    
    return () => {
      stopAllSounds();
    };
  }, []);
  
  // Sound control functions
  const startEngineSound = () => {
    if (!isSoundEnabled || !carSoundRef.current) return;
    
    try {
      carSoundRef.current.pause();
      carSoundRef.current.currentTime = 0;
      
      console.log("Starting engine sound...");
      const playPromise = carSoundRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing engine sound:", err);
        });
      }
    } catch (err) {
      console.error("Could not start engine sound:", err);
    }
  };
  
  const stopEngineSound = () => {
    if (!carSoundRef.current) return;
    
    try {
      carSoundRef.current.pause();
      carSoundRef.current.currentTime = 0;
    } catch (err) {
      console.error("Could not stop engine sound:", err);
    }
  };
  
  const pauseEngineSound = () => {
    if (!carSoundRef.current) return;
    
    try {
      carSoundRef.current.pause();
    } catch (err) {
      console.error("Could not pause engine sound:", err);
    }
  };
  
  const resumeEngineSound = () => {
    if (!isSoundEnabled || !carSoundRef.current) return;
    
    try {
      const playPromise = carSoundRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error resuming engine sound:", err);
        });
      }
    } catch (err) {
      console.error("Could not resume engine sound:", err);
    }
  };
  
  const playCollisionSound = () => {
    if (!isSoundEnabled || !crashSoundRef.current) return;
    
    try {
      // Keep engine sound playing during crash
      console.log("Playing crash sound while keeping engine sound...");
      
      // Play the crash sound
      if (crashSoundRef.current) {
        crashSoundRef.current.currentTime = 0;
        
        const crashPromise = crashSoundRef.current.play();
        if (crashPromise !== undefined) {
          crashPromise.catch(err => {
            console.error("Error playing crash sound:", err);
          });
        }
      }
    } catch (err) {
      console.error("Could not play collision sound:", err);
    }
  };
  
  // New sound functions
  const playPickupSound = () => {
    if (!isSoundEnabled || !seedSoundRef.current) return;
    
    try {
      if (seedSoundRef.current) {
        seedSoundRef.current.currentTime = 0;
        
        const seedPromise = seedSoundRef.current.play();
        if (seedPromise !== undefined) {
          seedPromise.catch(err => {
            console.error("Error playing pickup sound:", err);
          });
        }
      }
    } catch (err) {
      console.error("Could not play pickup sound:", err);
    }
  };
  
  const playSlowTimerSound = () => {
    if (!isSoundEnabled || !slowTimerSoundRef.current) return;
    
    try {
      if (slowTimerSoundRef.current) {
        slowTimerSoundRef.current.currentTime = 0;
        
        const slowTimerPromise = slowTimerSoundRef.current.play();
        if (slowTimerPromise !== undefined) {
          slowTimerPromise.catch(err => {
            console.error("Error playing slow timer sound:", err);
          });
        }
      }
    } catch (err) {
      console.error("Could not play slow timer sound:", err);
    }
  };
  
  const playButtonSound = () => {
    if (!isSoundEnabled || !buttonSoundRef.current) return;
    
    try {
      if (buttonSoundRef.current) {
        buttonSoundRef.current.currentTime = 0;
        
        const buttonPromise = buttonSoundRef.current.play();
        if (buttonPromise !== undefined) {
          buttonPromise.catch(err => {
            console.error("Error playing button sound:", err);
          });
        }
      }
    } catch (err) {
      console.error("Could not play button sound:", err);
    }
  };
  
  const stopAllSounds = () => {
    stopEngineSound();
    
    if (crashSoundRef.current) {
      crashSoundRef.current.pause();
      crashSoundRef.current.currentTime = 0;
    }
    
    if (seedSoundRef.current) {
      seedSoundRef.current.pause();
      seedSoundRef.current.currentTime = 0;
    }
    
    if (slowTimerSoundRef.current) {
      slowTimerSoundRef.current.pause();
      slowTimerSoundRef.current.currentTime = 0;
    }
    
    if (buttonSoundRef.current) {
      buttonSoundRef.current.pause();
      buttonSoundRef.current.currentTime = 0;
    }
  };
  
  const toggleSound = () => {
    playButtonSound(); // Play the button sound before toggling (will only play if sound is currently enabled)
    
    setIsSoundEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        if (gameState === GameState.GAMEPLAY) {
          startEngineSound();
        }
      } else {
        stopAllSounds();
      }
      
      return newState;
    });
  };
  
  useEffect(() => {
    if (!soundsLoadedRef.current) return;
    
    console.log("Game state changed to:", gameState);
    
    switch (gameState) {
      case GameState.GAMEPLAY:
        if (isSoundEnabled) {
          console.log("Starting engine sound due to GAMEPLAY state");
          startEngineSound();
        }
        break;
      case GameState.PAUSED:
        console.log("Pausing engine sound due to PAUSED state");
        pauseEngineSound();
        break;
      case GameState.GAME_OVER:
      case GameState.START_SCREEN:
        console.log("Stopping all sounds due to GAME_OVER or START_SCREEN state");
        stopAllSounds();
        break;
    }
  }, [gameState, isSoundEnabled]);
  
  useEffect(() => {
    if (!canvasRef.current || !carAssetsLoaded) return;
    
    const hasPlayed = localStorage.getItem('hasPlayed');
    if (!hasPlayed) {
      setIsFirstTime(true);
      localStorage.setItem('hasPlayed', 'true');
    } else {
      setIsFirstTime(false);
    }
    
    const resizeCanvas = () => {
      if (!canvasRef.current) return;
      
      const gameContainer = canvasRef.current.parentElement;
      if (!gameContainer) return;
      
      const width = gameContainer.clientWidth;
      const height = window.innerHeight > 800 
        ? Math.min(800, window.innerHeight - 100) 
        : window.innerHeight - 100;
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      setCanvasSize({ width, height });
      
      if (gameEngineRef.current) {
        gameEngineRef.current.resizeCanvas();
      }
    };
    
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);
    
    try {
      console.log("Initializing game engine with assets:", {
        playerCarURL,
        enemyCarURLs,
        seedImageURL
      });
      
      const gameEngine = new GameEngine({
        canvas: canvasRef.current,
        onScoreChange: (newScore) => setScore(newScore),
        onLivesChange: (newLives) => setLives(newLives),
        onGameStateChange: (newState) => setGameState(newState),
        onPowerUpStart: (type, duration) => {
          switch (type) {
            case PowerUpType.SLOW_SPEED:
              setActiveSlowMode(true);
              setSlowModeTimer(duration);
              playSlowTimerSound(); // Play slow timer sound when activating
              toast.success('SLOW MODE ACTIVATED', {
                description: 'Traffic speed reduced',
                icon: <Clock className="h-5 w-5 text-blue-500" />,
              });
              break;
            case PowerUpType.SHIELD:
              setActiveShield(true);
              setShieldTimer(duration);
              playPickupSound(); // Play pickup sound for shield activation
              toast.success('SHIELD ACTIVATED', {
                description: 'Invulnerable for 3s',
                icon: <Shield className="h-5 w-5 text-cyan-500" />,
              });
              break;
            case PowerUpType.EXTRA_LIFE:
              playPickupSound(); // Play pickup sound for extra life
              toast.success('EXTRA LIFE', {
                icon: <Heart className="h-5 w-5 text-red-500" />,
              });
              break;
          }
        },
        onPowerUpEnd: (type) => {
          switch (type) {
            case PowerUpType.SLOW_SPEED:
              setActiveSlowMode(false);
              setSlowModeTimer(0);
              toast.info('SLOW MODE ENDED');
              break;
            case PowerUpType.SHIELD:
              setActiveShield(false);
              setShieldTimer(0);
              toast.info('SHIELD DEACTIVATED');
              break;
          }
        },
        onCollision: () => {
          playCollisionSound();
        },
        onSeedCollected: () => {
          playPickupSound(); // Play pickup sound when collecting seeds
        },
        customAssets: {
          playerCarURL,
          enemyCarURLs,
          seedImageURL,
          useDefaultsIfBroken: true
        }
      });
      
      gameEngineRef.current = gameEngine;
      setHighScore(gameEngine.getHighScore());
      setGameInitialized(true);
      
      if (loadingError) {
        toast.warning(loadingError);
      }
    } catch (err) {
      console.error("Error initializing game engine:", err);
      toast.error("Game initialization failed");
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
      }
    };
  }, [carAssetsLoaded, playerCarURL, enemyCarURLs, seedImageURL, loadingError]);
  
  // Handle keyboard input for multi-lane movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.GAMEPLAY || !gameEngineRef.current) return;
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyPressTimeRef.current;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        
        if (timeDiff < 300) {
          // Consecutive press within threshold
          keyPressCountRef.current += 1;
          
          // Clear existing timeout
          if (keyPressTimeoutRef.current) {
            window.clearTimeout(keyPressTimeoutRef.current);
          }
          
          // Set a new timeout to execute the move
          keyPressTimeoutRef.current = window.setTimeout(() => {
            const lanes = Math.min(keyPressCountRef.current, 3);
            gameEngineRef.current?.movePlayerLanes(-lanes);
            keyPressCountRef.current = 0;
          }, 50);
        } else {
          // First press or press after threshold
          keyPressCountRef.current = 1;
          
          // Clear existing timeout
          if (keyPressTimeoutRef.current) {
            window.clearTimeout(keyPressTimeoutRef.current);
          }
          
          // Set a new timeout to execute the move
          keyPressTimeoutRef.current = window.setTimeout(() => {
            gameEngineRef.current?.movePlayerLanes(-1);
            keyPressCountRef.current = 0;
          }, 50);
        }
        
        lastKeyPressTimeRef.current = currentTime;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        
        if (timeDiff < 300) {
          // Consecutive press within threshold
          keyPressCountRef.current += 1;
          
          // Clear existing timeout
          if (keyPressTimeoutRef.current) {
            window.clearTimeout(keyPressTimeoutRef.current);
          }
          
          // Set a new timeout to execute the move
          keyPressTimeoutRef.current = window.setTimeout(() => {
            const lanes = Math.min(keyPressCountRef.current, 3);
            gameEngineRef.current?.movePlayerLanes(lanes);
            keyPressCountRef.current = 0;
          }, 50);
        } else {
          // First press or press after threshold
          keyPressCountRef.current = 1;
          
          // Clear existing timeout
          if (keyPressTimeoutRef.current) {
            window.clearTimeout(keyPressTimeoutRef.current);
          }
          
          // Set a new timeout to execute the move
          keyPressTimeoutRef.current = window.setTimeout(() => {
            gameEngineRef.current?.movePlayerLanes(1);
            keyPressCountRef.current = 0;
          }, 50);
        }
        
        lastKeyPressTimeRef.current = currentTime;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (keyPressTimeoutRef.current) {
        window.clearTimeout(keyPressTimeoutRef.current);
      }
    };
  }, [gameState]);
  
  useEffect(() => {
    if (slowModeTimer > 0) {
      const interval = setInterval(() => {
        setSlowModeTimer((prev) => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [slowModeTimer]);
  
  useEffect(() => {
    if (shieldTimer > 0) {
      const interval = setInterval(() => {
        setShieldTimer((prev) => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [shieldTimer]);
  
  // Event handler functions - updated to include button sounds
  const handleStartGame = () => {
    playButtonSound();
    console.log("Start game clicked, gameEngine exists:", !!gameEngineRef.current);
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
      toast.success('GAME STARTED', {
        description: 'Use arrows to move'
      });
    } else {
      console.error("Game engine not initialized");
      toast.error('Engine not ready');
    }
  };
  
  const handleShowHowToPlay = () => {
    playButtonSound();
    setShowHowToPlay(true);
    setCurrentHowToPlayPage(0);
  };
  
  const handleBackToMenu = () => {
    playButtonSound();
    setShowHowToPlay(false);
  };
  
  const handleNextPage = () => {
    playButtonSound();
    setCurrentHowToPlayPage(prev => Math.min(prev + 1, howToPlayContent.length - 1));
  };
  
  const handlePrevPage = () => {
    playButtonSound();
    setCurrentHowToPlayPage(prev => Math.max(prev - 1, 0));
  };
  
  const handleTryAgain = () => {
    playButtonSound();
    if (gameEngineRef.current) {
      setHighScore(gameEngineRef.current.getHighScore());
      gameEngineRef.current.startGame();
    }
  };
  
  const handleTouchLeft = () => {
    if (gameEngineRef.current && gameState === GameState.GAMEPLAY) {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyPressTimeRef.current;
      
      if (timeDiff < 300) {
        // Consecutive press within threshold
        keyPressCountRef.current += 1;
        
        // Clear existing timeout
        if (keyPressTimeoutRef.current) {
          window.clearTimeout(keyPressTimeoutRef.current);
        }
        
        // Set a new timeout to execute the move
        keyPressTimeoutRef.current = window.setTimeout(() => {
          const lanes = Math.min(keyPressCountRef.current, 3);
          gameEngineRef.current?.movePlayerLanes(-lanes);
          keyPressCountRef.current = 0;
        }, 50);
      } else {
        // First press or press after threshold
        keyPressCountRef.current = 1;
        
        // Clear existing timeout
        if (keyPressTimeoutRef.current) {
          window.clearTimeout(keyPressTimeoutRef.current);
        }
        
        // Set a new timeout to execute the move
        keyPressTimeoutRef.current = window.setTimeout(() => {
          gameEngineRef.current?.movePlayerLanes(-1);
          keyPressCountRef.current = 0;
        }, 50);
      }
      
      lastKeyPressTimeRef.current = currentTime;
    }
  };
  
  const handleTouchRight = () => {
    if (gameEngineRef.current && gameState === GameState.GAMEPLAY) {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyPressTimeRef.current;
      
      if (timeDiff < 300) {
        // Consecutive press within threshold
        keyPressCountRef.current += 1;
        
        // Clear existing timeout
        if (keyPressTimeoutRef.current) {
          window.clearTimeout(keyPressTimeoutRef.current);
        }
        
        // Set a new timeout to execute the move
        keyPressTimeoutRef.current = window.setTimeout(() => {
          const lanes = Math.min(keyPressCountRef.current, 3);
          gameEngineRef.current?.movePlayerLanes(lanes);
          keyPressCountRef.current = 0;
        }, 50);
      } else {
        // First press or press after threshold
        keyPressCountRef.current = 1;
        
        // Clear existing timeout
        if (keyPressTimeoutRef.current) {
          window.clearTimeout(keyPressTimeoutRef.current);
        }
        
        // Set a new timeout to execute the move
        keyPressTimeoutRef.current = window.setTimeout(() => {
          gameEngineRef.current?.movePlayerLanes(1);
          keyPressCountRef.current = 0;
        }, 50);
      }
      
      lastKeyPressTimeRef.current = currentTime;
    }
  };
  
  const handlePauseGame = () => {
    playButtonSound();
    if (gameEngineRef.current && gameState === GameState.GAMEPLAY) {
      gameEngineRef.current.pauseGame();
    }
  };
  
  const handleResumeGame = () => {
    playButtonSound();
    if (gameEngineRef.current && gameState === GameState.PAUSED) {
      gameEngineRef.current.resumeGame();
    }
  };
  
  const handleRestartGame = () => {
    playButtonSound();
    if (gameEngineRef.current) {
      setHighScore(gameEngineRef.current.getHighScore());
      gameEngineRef.current.restartGame();
    }
  };
  
  const howToPlayContent = [
    {
      title: "Basic Controls",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Keyboard Controls:</h3>
            <div className="flex items-center space-x-3 mb-2">
              <div className="px-3 py-1 bg-black/30 rounded">←</div>
              <span>Move left</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-black/30 rounded">→</div>
              <span>Move right</span>
            </div>
          </div>
          
          {isMobile && (
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-medium">Mobile Controls:</h3>
              <p>Tap left side of screen to move left</p>
              <p>Tap right side of screen to move right</p>
            </div>
          )}
          
          <div className="mt-4">
            <p>Pause button is located at the top right of the screen</p>
          </div>
        </div>
      )
    },
    {
      title: "Game Objectives",
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Main Goal:</h3>
            <p>Drive through traffic while avoiding crashes and collect seeds to increase your score!</p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Scoring:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <div>
                  <span className="font-medium">Seeds:</span> +10 points each
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <div>
                  <span className="font-medium">Survival:</span> The longer you survive, the higher your score!
                </div>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Power-Ups",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-2">Special Power-Ups:</h3>
          
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-black/20 rounded-lg flex items-center space-x-3">
              <div className="bg-[#9b87f5] rounded-full p-2">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium">Slow Mode</div>
                <div className="text-sm text-gray-300">Slows down all traffic for 5 seconds</div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 rounded-lg flex items-center space-x-3">
              <div className="bg-[#4cc9f0] rounded-full p-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium">Shield</div>
                <div className="text-sm text-gray-300">Makes you invulnerable for 3 seconds</div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 rounded-lg flex items-center space-x-3">
              <div className="bg-[#ff5e5e] rounded-full p-2">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium">Extra Life</div>
                <div className="text-sm text-gray-300">Gives you an additional life</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Tips & Tricks",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-2">Pro Tips:</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Double-tap arrow keys to move multiple lanes at once!</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Prioritize collecting power-ups when traffic gets heavy</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Look ahead and plan your movements to avoid crashes</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Shield power-ups are best saved for intense traffic moments</div>
            </li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Game Canvas */}
      <div className="relative w-full flex-1 flex flex-col items-center">
        {/* Top UI Bar */}
        {gameState === GameState.GAMEPLAY && (
          <div className="absolute top-0 left-0 right-0 z-10 p-2 flex justify-between items-center bg-black/30 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-1" />
                <span className="font-bold">{lives}</span>
              </div>
              
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="font-bold">{score}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40"
                onClick={toggleSound}
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40"
                onClick={handlePauseGame}
              >
                <Pause className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Power-up indicators */}
        {(activeSlowMode || activeShield) && (
          <div className="absolute top-12 right-2 z-10 flex flex-col space-y-2">
            {activeSlowMode && (
              <div className="bg-[#9b87f5] p-2 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
                <div className="absolute w-full h-full rounded-full">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-white/30"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                      r="47"
                      cx="50"
                      cy="50"
                      style={{
                        strokeDasharray: 295.3,
                        strokeDashoffset: 295.3 * (1 - slowModeTimer / 5000),
                        transformOrigin: 'center',
                        transform: 'rotate(-90deg)',
                      }}
                    />
                  </svg>
                </div>
              </div>
            )}
            
            {activeShield && (
              <div className="bg-[#4cc9f0] p-2 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
                <div className="absolute w-full h-full rounded-full">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-white/30"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                      r="47"
                      cx="50"
                      cy="50"
                      style={{
                        strokeDasharray: 295.3,
                        strokeDashoffset: 295.3 * (1 - shieldTimer / 3000),
                        transformOrigin: 'center',
                        transform: 'rotate(-90deg)',
                      }}
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="bg-gray-900 w-full h-full"
        />
        
        {/* Mobile Controls */}
        {isMobile && gameState === GameState.GAMEPLAY && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div 
              className="absolute left-0 top-0 w-1/2 h-full pointer-events-auto opacity-0"
              onTouchStart={handleTouchLeft}
            />
            <div 
              className="absolute right-0 top-0 w-1/2 h-full pointer-events-auto opacity-0"
              onTouchStart={handleTouchRight}
            />
          </div>
        )}
        
        {/* Start Screen */}
        {gameState === GameState.START_SCREEN && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <div className="text-center p-6 rounded-lg max-w-md">
              <h1 className="text-4xl font-bold mb-2">Road Runner</h1>
              <p className="text-gray-300 mb-6">Dodge traffic and collect seeds!</p>
              
              {isFirstTime ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Use arrow keys (or tap screen) to move your car left and right.
                    Avoid crashing into other cars and collect seeds for points!
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4 p-3 bg-black/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-gray-300">High Score:</span>
                      </div>
                      <span className="font-bold text-xl">{highScore}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                  
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleShowHowToPlay}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      How to Play
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-10"
                      onClick={toggleSound}
                    >
                      {isSoundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* How to Play Screen */}
        {showHowToPlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
            <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleBackToMenu}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold">{howToPlayContent[currentHowToPlayPage].title}</h2>
                <div className="w-8"></div> {/* Spacer for alignment */}
              </div>
              
              <div className="min-h-[300px]">
                {howToPlayContent[currentHowToPlayPage].content}
              </div>
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentHowToPlayPage === 0}
                  onClick={handlePrevPage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex space-x-1">
                  {howToPlayContent.map((_, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === currentHowToPlayPage 
                          ? "bg-white" 
                          : "bg-gray-600"
                      )}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentHowToPlayPage === howToPlayContent.length - 1}
                  onClick={handleNextPage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Pause Screen */}
        {gameState === GameState.PAUSED && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <div className="text-center p-6 rounded-lg">
              <h2 className="text-3xl font-bold mb-6">Game Paused</h2>
              
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={handleResumeGame}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Game
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleRestartGame}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Game
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mt-4 h-10 w-10 rounded-full mx-auto"
                  onClick={toggleSound}
                >
                  {isSoundEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <div className="text-center p-6 rounded-lg max-w-md">
              <h2 className="text-3xl font-bold mb-2">Game Over</h2>
              
              <div className="mb-6 space-y-3">
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Your Score:</span>
                    <span className="font-bold text-xl">{score}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-gray-300">High Score:</span>
                    </div>
                    <span className="font-bold text-xl">{highScore}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={handleTryAgain}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading Screen */}
        {!gameInitialized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-lg">Loading game...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
