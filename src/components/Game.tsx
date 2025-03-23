import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, PowerUpType, GameMode } from '../game/GameEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Heart, Shield, Clock, Trophy, Loader2, Pause, Play, RefreshCw, HelpCircle, ArrowLeft, Volume2, VolumeX, Globe, Blocks, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ModeSelectionScreen, UsernameCreationScreen } from './ModeSelectionComponents';

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
  const [gameState, setGameState] = useState<GameState>(GameState.MODE_SELECTION);
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
  
  // Add new state for game mode and username
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(GameMode.NONE);
  const [username, setUsername] = useState<string>('');
  
  const carSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const seedSoundRef = useRef<HTMLAudioElement | null>(null);
  const slowTimerSoundRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsLoadedRef = useRef<boolean>(false);
  
  const isMobile = useIsMobile();
  
  // Load username and game mode from localStorage if available
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    const savedGameMode = localStorage.getItem('gameMode') as GameMode;
    if (savedGameMode && (savedGameMode === GameMode.ONLINE || savedGameMode === GameMode.ONCHAIN)) {
      setSelectedGameMode(savedGameMode);
    }
  }, []);
  
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
          // Load car sound
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
          
          // Load crash sound
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
          
          // Load seed sound
          new Promise<void>((resolve) => {
            seedSound.addEventListener('canplaythrough', () => {
              console.log("Seed collection sound loaded successfully");
              resolve();
            }, { once: true });
            
            seedSound.addEventListener('error', (e) => {
              console.error("Error loading seed collection sound:", e);
              resolve();
            });
            
            seedSound.load();
          }),
          
          // Load slow timer sound
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
          
          // Load button sound
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
  
  // Existing sound handling functions...
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

  const playPickupSound = () => {
    if (!isSoundEnabled || !seedSoundRef.current) return;
    
    try {
      // Reset sound position to allow rapid overlapping plays
      seedSoundRef.current.currentTime = 0;
      
      const playPromise = seedSoundRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing pickup sound:", err);
        });
      }
    } catch (err) {
      console.error("Could not play pickup sound:", err);
    }
  };

  const playSlowTimerSound = () => {
    if (!isSoundEnabled || !slowTimerSoundRef.current) return;
    
    try {
      slowTimerSoundRef.current.currentTime = 0;
      
      const playPromise = slowTimerSoundRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing slow timer sound:", err);
        });
      }
    } catch (err) {
      console.error("Could not play slow timer sound:", err);
    }
  };

  const playButtonSound = () => {
    if (!isSoundEnabled || !buttonSoundRef.current) return;
    
    try {
      buttonSoundRef.current.currentTime = 0;
      
      const playPromise = buttonSoundRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing button sound:", err);
        });
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
    // Don't play the button sound here to avoid confusion when turning sound off
    setIsSoundEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        if (gameState === GameState.GAMEPLAY) {
          startEngineSound();
        }
        // Play button sound after enabling sound
        if (buttonSoundRef.current) {
          setTimeout(() => {
            buttonSoundRef.current?.play().catch(err => {
              console.error("Error playing button sound after enabling:", err);
            });
          }, 200);
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
      case GameState.MODE_SELECTION:
      case GameState.USERNAME_CREATION:
        console.log("Stopping all sounds due to state change");
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
      
      // Initialize GameEngine
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
              playSlowTimerSound();
              toast.success('SLOW MODE ACTIVATED', {
                description: 'Traffic speed reduced',
                icon: <Clock className="h-5 w-5 text-blue-500" />,
              });
              break;
            case PowerUpType.SHIELD:
              setActiveShield(true);
              setShieldTimer(duration);
              playPickupSound();
              toast.success('SHIELD ACTIVATED', {
                description: 'Invulnerable for 3s',
                icon: <Shield className="h-5 w-5 text-cyan-500" />,
              });
              break;
            case PowerUpType.EXTRA_LIFE:
              playPickupSound();
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
        onSeedCollect: () => {
          playPickupSound();
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
      
      // Check if user has played before and has a username
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        // If the user has a username, start with START_SCREEN
        gameEngine.setGameState(GameState.START_SCREEN);
      } else {
        // Otherwise start with MODE_SELECTION
        gameEngine.setGameState(GameState.MODE_SELECTION);
      }
      
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
  
  // Existing timer effects...
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
  
  // Handler for mode selection
  const handleModeSelection = (mode: GameMode) => {
    playButtonSound();
    setSelectedGameMode(mode);
    
    // Save game mode to localStorage
    localStorage.setItem('gameMode', mode);
    
    // If user already has a username, skip to start screen
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
      if (gameEngineRef.current) {
        gameEngineRef.current.setGameState(GameState.START_SCREEN);
      }
    } else {
      // Otherwise go to username creation
      if (gameEngineRef.current) {
        gameEngineRef.current.setGameState(GameState.USERNAME_CREATION);
      }
    }
  };
  
  // Handler for username submission
  const handleUsernameSubmit = (newUsername: string) => {
    playButtonSound();
    setUsername(newUsername);
    
    // Save username to localStorage
    localStorage.setItem('username', newUsername);
    
    // Move to start screen
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(GameState.START_SCREEN);
    }
  };
  
  // Handler for username back button
  const handleUsernameBack = () => {
    playButtonSound();
    // Go back to mode selection
    if (gameEngineRef.current) {
      gameEngineRef.current.setGameState(GameState.MODE_SELECTION);
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
      gameEngineRef.current.handleTouchLeft();
    }
  };
  
  const handleTouchRight = () => {
    if (gameEngineRef.current && gameState === GameState.GAMEPLAY) {
      gameEngineRef.current.handleTouchRight();
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
  
  // Content for how to play screens
  const howToPlayContent = [
    // Existing content...
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
          
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Plan your moves in advance to avoid getting boxed in by cars</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Prioritize collecting power-ups when traffic gets heavy</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Shield power-ups can be used offensively to intentionally crash through cars</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>Look ahead for upcoming obstacles and plan your route</div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>The game gets faster over time - be prepared!</div>
            </li>
          </ul>
        </div>
      )
    }
  ];
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="game-canvas-container relative w-full max-w-[600px]">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
        
        {gameState === GameState.GAMEPLAY && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <div className="flex items-center space-x-2 glassmorphism px-3 py-1 rounded-full">
              {Array.from({ length: lives }).map((_, i) => (
                <Heart key={i} className="w-5 h-5 text-red-500 fill-red-500" />
              ))}
            </div>
            
            <div className="glassmorphism px-4 py-1 rounded-full">
              <div className="hud-text text-xl font-medium">{score}</div>
            </div>
            
            <div className="flex items-center space-x-2">
              {activeSlowMode && (
                <div className="flex items-center space-x-1 glassmorphism px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4 text-[#a170fc]" />
                  <span className="text-sm font-medium">{Math.ceil(slowModeTimer / 1000)}s</span>
                </div>
              )}
              
              {activeShield && (
                <div className="flex items-center space-x-1 glassmorphism px-3 py-1 rounded-full">
                  <Shield className="w-4 h-4 text-[#64d2ff]" />
                  <span className="text-sm font-medium">{Math.ceil(shieldTimer / 1000)}s</span>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
                onClick={toggleSound}
                aria-label={isSoundEnabled ? "Mute sound" : "Enable sound"}
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="teal" 
                size="icon" 
                className="rounded-full hover:bg-[#7ec7c5] transition-colors"
                onClick={handlePauseGame}
                aria-label="Pause game"
              >
                <Pause className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Mode Selection Screen */}
        {gameState === GameState.MODE_SELECTION && (
          <ModeSelectionScreen onSelectMode={handleModeSelection} />
        )}
        
        {/* Username Creation Screen */}
        {gameState === GameState.USERNAME_CREATION && (
          <UsernameCreationScreen 
            onSubmit={handleUsernameSubmit}
            onBack={handleUsernameBack}
            mode={selectedGameMode}
          />
        )}
        
        {gameState === GameState.START_SCREEN && !showHowToPlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
              <h1 className="text-5xl font-bold mb-2 tracking-tight text-white text-gradient">Superseed Lane Runner</h1>
              
              {/* Display username and game mode if available */}
              {username && (
                <div className="chip text-xs bg-[#91d3d1]/20 text-[#91d3d1] px-3 py-1 rounded-full mb-2 inline-flex items-center">
                  {selectedGameMode === GameMode.ONLINE ? (
                    <Globe className="w-3 h-3 mr-1" />
                  ) : (
                    <Blocks className="w-3 h-3 mr-1" />
                  )}
                  {selectedGameMode === GameMode.ONLINE ? 'ONLINE' : 'ONCHAIN'} • 
                  <User className="w-3 h-3 mx-1" /> {username}
                </div>
              )}
              
              <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-4 inline-block">FAST-PACED ACTION</div>
              <p className="text-gray-300 mb-6">Navigate through traffic, collect seeds, and survive as long as possible!</p>
              
              <div className="flex flex-col space-y-4 items-center">
                <Button 
                  onClick={handleStartGame}
                  className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
                  disabled={!gameInitialized}
                >
                  {gameInitialized ? 'Start Game' : <Loader2 className="h-5 w-5 animate-spin" />}
                </Button>
                
                <Button 
                  onClick={handleShowHowToPlay}
                  variant="teal-outline"
                  className="w-full rounded-xl py-6 text-lg font-medium"
                >
                  <HelpCircle className="mr-2 h-5 w-5" />
                  How to Play
                </Button>
                
                <div className="flex items-center space-x-4 mt-2">
                  {highScore > 0 && (
                    <div className="flex items-center space-x-2 text-[#91d3d1]">
                      <Trophy className="w-5 h-5" />
                      <span>High Score: {highScore}</span>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
                    onClick={toggleSound}
                    aria-label={isSoundEnabled ? "Mute sound" : "Enable sound"}
                  >
                    {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-20 -left-10 opacity-10 rotate-12 transform scale-75">
              <div className="w-32 h-20 bg-white rounded-md"></div>
            </div>
            <div className="absolute top-20 -right-10 opacity-10 -rotate-12 transform scale-75">
              <div className="w-32 h-20 bg-white rounded-md"></div>
            </div>
          </div>
        )}
        
        {gameState === GameState.START_SCREEN && showHowToPlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full"
                  onClick={handleBackToMenu}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold tracking-tight text-white">How to Play</h2>
                <div className="w-9"></div>
              </div>
              
              <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-6 inline-block">
                {currentHowToPlayPage + 1} of {howToPlayContent.length}
              </div>
              
              <h3 className="text-xl font-medium mb-4 text-[#91d3d1]">{howToPlayContent[currentHowToPlayPage].title}</h3>
              
              <div className="text-left mb-6 min-h-[200px]">
                {howToPlayContent[currentHowToPlayPage].content}
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="teal-outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentHowToPlayPage === 0}
                  className={cn(
                    "rounded-full px-4",
                    currentHowToPlayPage === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="teal-outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentHowToPlayPage === howToPlayContent.length - 1}
                  className={cn(
                    "rounded-full px-4",
                    currentHowToPlayPage === howToPlayContent.length - 1 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {gameState === GameState.PAUSED && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="pause-menu glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
              <h1 className="text-3xl font-bold mb-6 tracking-tight text-white">Game Paused</h1>
              
              <div className="flex flex-col space-y-4 items-center">
                <Button 
                  onClick={handleResumeGame}
                  className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Resume Game
                </Button>
                
                <Button 
                  onClick={handleRestartGame}
                  variant="teal-outline"
                  className="w-full rounded-xl py-6 text-lg font-medium"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Restart Game
                </Button>
                
                <div className="flex items-center mt-4 space-x-3">
                  <div className="text-sm text-gray-300">
                    Current Score: <span className="font-bold text-white">{score}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
                    onClick={toggleSound}
                    aria-label={isSoundEnabled ? "Mute sound" : "Enable sound"}
                  >
                    {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="game-over-modal glassmorphism rounded-3xl p-8 max-w-md mx-auto text-center border border-[#91d3d1]/20">
              <h2 className="text-3xl font-bold mb-2">Game Over</h2>
              
              <div className="my-6 space-y-4">
                {/* Display username in game over screen */}
                {username && (
                  <div className="chip text-xs bg-[#91d3d1]/20 text-[#91d3d1] px-3 py-1 rounded-full inline-flex items-center">
                    <User className="w-3 h-3 mr-1" /> {username}
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">YOUR SCORE</p>
                  <p className="text-4xl font-bold">{score}</p>
                </div>
                
                {score > highScore ? (
                  <div className="py-2 px-4 bg-[#91d3d1]/20 text-[#91d3d1] rounded-full inline-flex items-center space-x-2 animate-pulse">
                    <Trophy className="w-5 h-5" />
                    <span>New High Score!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">HIGH SCORE</p>
                    <p className="text-2xl font-medium">{highScore}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleTryAgain}
                  className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
                >
                  Try Again
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mt-4 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
                  onClick={toggleSound}
                  aria-label={isSoundEnabled ? "Mute sound" : "Enable sound"}
                >
                  {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {isMobile && gameState === GameState.GAMEPLAY && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-between px-8">
            <button
              className={cn(
                "w-16 h-16 rounded-full glassmorphism border border-[#91d3d1]/30 touch-control flex items-center justify-center",
                "active:bg-[#91d3d1]/30 transition-all"
              )}
              onTouchStart={handleTouchLeft}
            >
              <ChevronLeft className="h-10 w-10 text-[#91d3d1]" />
            </button>
            
            <button
              className={cn(
                "w-16 h-16 rounded-full glassmorphism border border-[#91d3d1]/30 touch-control flex items-center justify-center",
                "active:bg-[#91d3d1]/30 transition-all"
              )}
              onTouchStart={handleTouchRight}
            >
              <ChevronRight className="h-10 w-10 text-[#91d3d1]" />
            </button>
          </div>
        )}
        
        {(!carAssetsLoaded || !gameInitialized) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-[#91d3d1] mb-4" />
            <p className="text-sm text-muted-foreground">Loading game assets...</p>
          </div>
        )}
        
        <div className="bg-noise absolute inset-0 pointer-events-none opacity-5"></div>
      </div>
    </div>
  );
};

export default Game;