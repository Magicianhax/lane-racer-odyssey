import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, PowerUpType } from '../game/GameEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Heart, Shield, Clock, Trophy, Loader2, Pause, Play, RefreshCw, HelpCircle, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const DEFAULT_PLAYER_CAR = '/playercar.png';
const DEFAULT_ENEMY_CARS = ['/enemycar1.png', '/enemycar2.png', '/enemycar3.png'];
const SEED_IMAGE = '/seed.png';

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
  
  const carSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const loadAudio = async () => {
      try {
        console.log("Loading audio assets...");
        
        const carSound = new Audio('/car.m4a');
        carSound.loop = true;
        carSound.volume = 0.5;
        carSoundRef.current = carSound;
        
        const crashSound = new Audio('/crash.m4a');
        crashSound.loop = false;
        crashSound.volume = 0.7;
        crashSoundRef.current = crashSound;
        
        crashSound.addEventListener('ended', () => {
          console.log("Crash sound ended, restarting engine sound from beginning");
          if (gameState === GameState.GAMEPLAY && carSoundRef.current) {
            carSoundRef.current.currentTime = 0;
            setTimeout(() => {
              if (carSoundRef.current && gameState === GameState.GAMEPLAY) {
                carSoundRef.current.play()
                  .then(() => console.log("Car sound restarted after crash"))
                  .catch(e => console.error("Error restarting car sound after crash:", e));
              }
            }, 50);
          }
        });
        
        await Promise.all([
          new Promise<void>((resolve) => {
            carSound.addEventListener('canplaythrough', () => {
              console.log("Car sound loaded");
              resolve();
            }, { once: true });
            
            carSound.addEventListener('error', (e) => {
              console.error("Error loading car sound:", e);
              resolve(); // Still resolve to continue
            });
            
            carSound.load();
          }),
          
          new Promise<void>((resolve) => {
            crashSound.addEventListener('canplaythrough', () => {
              console.log("Crash sound loaded");
              resolve();
            }, { once: true });
            
            crashSound.addEventListener('error', (e) => {
              console.error("Error loading crash sound:", e);
              resolve(); // Still resolve to continue
            });
            
            crashSound.load();
          })
        ]);
        
        setAudioLoaded(true);
        console.log("Audio assets loaded successfully");
      } catch (err) {
        console.error("Error loading audio:", err);
        setAudioLoaded(true);
      }
    };
    
    loadAudio();
    
    return () => {
      if (carSoundRef.current) {
        carSoundRef.current.pause();
        carSoundRef.current = null;
      }
      
      if (crashSoundRef.current) {
        crashSoundRef.current.pause();
        crashSoundRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    const preloadCarAssets = async () => {
      try {
        console.log("Loading car assets...");
        
        try {
          const playerImg = new Image();
          let playerLoaded = false;
          
          const playerPromise = new Promise<string>((resolve, reject) => {
            playerImg.onload = () => {
              console.log("Player image fully loaded");
              playerLoaded = true;
              resolve(playerImg.src);
            };
            
            playerImg.onerror = (e) => {
              console.error("Error loading player image:", e);
              resolve(DEFAULT_PLAYER_CAR);
            };
            
            playerImg.src = DEFAULT_PLAYER_CAR;
            
            setTimeout(() => {
              if (!playerLoaded) {
                console.warn("Player image loading timed out");
                resolve(DEFAULT_PLAYER_CAR);
              }
            }, 3000);
          });
          
          const enemyPromises = DEFAULT_ENEMY_CARS.map(url => {
            const enemyImg = new Image();
            let enemyLoaded = false;
            
            return new Promise<string>((resolve, reject) => {
              enemyImg.onload = () => {
                console.log(`Enemy image ${url} fully loaded`);
                enemyLoaded = true;
                resolve(url);
              };
              
              enemyImg.onerror = (e) => {
                console.error(`Error loading enemy image ${url}:`, e);
                resolve(DEFAULT_ENEMY_CARS[0]);
              };
              
              enemyImg.src = url;
              
              setTimeout(() => {
                if (!enemyLoaded) {
                  console.warn(`Enemy image ${url} loading timed out`);
                  resolve(DEFAULT_ENEMY_CARS[0]);
                }
              }, 3000);
            });
          });
          
          const seedImg = new Image();
          let seedLoaded = false;
          
          const seedPromise = new Promise<string>((resolve, reject) => {
            seedImg.onload = () => {
              console.log("Seed image fully loaded");
              seedLoaded = true;
              resolve(seedImg.src);
            };
            
            seedImg.onerror = (e) => {
              console.error("Error loading seed image:", e);
              resolve(SEED_IMAGE);
            };
            
            seedImg.src = SEED_IMAGE;
            
            setTimeout(() => {
              if (!seedLoaded) {
                console.warn("Seed image loading timed out");
                resolve(SEED_IMAGE);
              }
            }, 3000);
          });
          
          const [playerSrc, seedSrc, ...enemySrcs] = await Promise.all([
            playerPromise, 
            seedPromise,
            ...enemyPromises
          ]);
          
          setPlayerCarURL(playerSrc);
          setSeedImageURL(seedSrc);
          setEnemyCarURLs(enemySrcs.length > 0 ? enemySrcs : DEFAULT_ENEMY_CARS);
          
          console.log("All images processed successfully, using sources:", {
            playerSrc,
            seedSrc,
            enemySrcs
          });
          
        } catch (error) {
          console.error("Error loading images:", error);
          setPlayerCarURL(DEFAULT_PLAYER_CAR);
          setSeedImageURL(SEED_IMAGE);
          setEnemyCarURLs(DEFAULT_ENEMY_CARS);
        }
        
        setCarAssetsLoaded(true);
        setLoadingError(null);
      } catch (error) {
        console.error("Error in preloadCarAssets:", error);
        setCarAssetsLoaded(true);
        setLoadingError("Failed to load game images. Using default images instead.");
      }
    };
    
    preloadCarAssets();
  }, []);
  
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
        onGameStateChange: (newState) => {
          setGameState(newState);
        },
        onPlayerCrash: () => {
          console.log("Playing crash sound");
          if (crashSoundRef.current) {
            crashSoundRef.current.currentTime = 0;
            
            if (carSoundRef.current) {
              carSoundRef.current.pause();
            }
            
            crashSoundRef.current.play()
              .then(() => console.log("Crash sound started successfully"))
              .catch(e => console.error("Error playing crash sound:", e));
          }
        },
        onPowerUpStart: (type, duration) => {
          switch (type) {
            case PowerUpType.SLOW_SPEED:
              setActiveSlowMode(true);
              setSlowModeTimer(duration);
              toast.success('SLOW MODE ACTIVATED', {
                description: 'Traffic speed reduced',
                icon: <Clock className="h-5 w-5 text-blue-500" />,
              });
              break;
            case PowerUpType.SHIELD:
              setActiveShield(true);
              setShieldTimer(duration);
              toast.success('SHIELD ACTIVATED', {
                description: 'Invulnerable for 3s',
                icon: <Shield className="h-5 w-5 text-cyan-500" />,
              });
              break;
            case PowerUpType.EXTRA_LIFE:
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
      
      if (carSoundRef.current) {
        carSoundRef.current.pause();
      }
      
      if (crashSoundRef.current) {
        crashSoundRef.current.pause();
      }
    };
  }, [carAssetsLoaded, playerCarURL, enemyCarURLs, seedImageURL, loadingError]);
  
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
  
  useEffect(() => {
    if (gameState === GameState.GAMEPLAY) {
      console.log("Game state changed to GAMEPLAY, starting engine sound");
      if (carSoundRef.current) {
        carSoundRef.current.currentTime = 0;
        setTimeout(() => {
          if (carSoundRef.current && gameState === GameState.GAMEPLAY) {
            carSoundRef.current.play()
              .then(() => console.log("Car sound started successfully on state change"))
              .catch(e => console.error("Error playing car sound on state change:", e));
          }
        }, 100);
      }
    } else if (gameState === GameState.PAUSED) {
      console.log("Game state changed to PAUSED, pausing engine sound");
      if (carSoundRef.current) {
        carSoundRef.current.pause();
      }
    } else if (gameState === GameState.GAME_OVER || gameState === GameState.START_SCREEN) {
      console.log("Game state changed to END state, stopping all sounds");
      if (carSoundRef.current) {
        carSoundRef.current.pause();
        carSoundRef.current.currentTime = 0;
      }
      if (crashSoundRef.current) {
        crashSoundRef.current.pause();
        crashSoundRef.current.currentTime = 0;
      }
    }
  }, [gameState]);
  
  const handleStartGame = () => {
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
    setShowHowToPlay(true);
    setCurrentHowToPlayPage(0);
  };
  
  const handleBackToMenu = () => {
    setShowHowToPlay(false);
  };
  
  const handleNextPage = () => {
    setCurrentHowToPlayPage(prev => Math.min(prev + 1, howToPlayContent.length - 1));
  };
  
  const handlePrevPage = () => {
    setCurrentHowToPlayPage(prev => Math.max(prev - 1, 0));
  };
  
  const handleTryAgain = () => {
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
    if (gameEngineRef.current && gameState === GameState.GAMEPLAY) {
      gameEngineRef.current.pauseGame();
    }
  };
  
  const handleResumeGame = () => {
    if (gameEngineRef.current && gameState === GameState.PAUSED) {
      gameEngineRef.current.resumeGame();
    }
  };
  
  const handleRestartGame = () => {
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
        
        {gameState === GameState.START_SCREEN && !showHowToPlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
              <h1 className="text-5xl font-bold mb-2 tracking-tight text-white text-gradient">Superseed Lane Runner</h1>
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
                
                {highScore > 0 && (
                  <div className="flex items-center space-x-2 text-[#91d3d1] mt-2">
                    <Trophy className="w-5 h-5" />
                    <span>High Score: {highScore}</span>
                  </div>
                )}
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
                  variant="teal-outline" 
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
                
                <div className="text-sm text-gray-300 mt-4">
                  Current Score: <span className="font-bold text-white">{score}</span>
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
