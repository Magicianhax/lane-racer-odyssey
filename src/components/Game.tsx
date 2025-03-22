import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, PowerUpType } from '../game/GameEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Heart, Shield, Clock, Trophy, Loader2 } from 'lucide-react';
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
  const [seedCount, setSeedCount] = useState<number>(0);
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
  
  const isMobile = useIsMobile();
  
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
                resolve(DEFAULT_ENEMY_CARS[0]); // Use first car as fallback
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
        onGameStateChange: (newState) => setGameState(newState),
        onSeedCollected: (count) => {
          setSeedCount(count);
        },
        onPowerUpStart: (type, duration) => {
          switch (type) {
            case PowerUpType.SLOW_SPEED:
              setActiveSlowMode(true);
              setSlowModeTimer(duration);
              toast.success('Slow mode activated!', {
                description: `Traffic speed reduced for ${Math.ceil(duration/1000)} seconds`,
                icon: <Clock className="h-5 w-5 text-blue-500" />,
                position: 'top-center',
                duration: 3000,
              });
              break;
            case PowerUpType.SHIELD:
              setActiveShield(true);
              setShieldTimer(duration);
              toast.success('Shield activated!', {
                description: `Invulnerable for ${Math.ceil(duration/1000)} seconds`,
                icon: <Shield className="h-5 w-5 text-cyan-500" />,
                position: 'top-center',
                duration: 3000,
              });
              break;
            case PowerUpType.EXTRA_LIFE:
              toast.success('Extra life collected!', {
                icon: <Heart className="h-5 w-5 text-red-500" />,
                position: 'top-center',
                duration: 3000,
              });
              break;
          }
        },
        onPowerUpEnd: (type) => {
          switch (type) {
            case PowerUpType.SLOW_SPEED:
              setActiveSlowMode(false);
              setSlowModeTimer(0);
              toast.info('Slow mode ended', {
                position: 'top-center',
                duration: 2000,
              });
              break;
            case PowerUpType.SHIELD:
              setActiveShield(false);
              setShieldTimer(0);
              toast.info('Shield deactivated', {
                position: 'top-center',
                duration: 2000,
              });
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
      toast.error("Error initializing game. Please refresh the page.");
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
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
  
  const handleStartGame = () => {
    console.log("Start game clicked, gameEngine exists:", !!gameEngineRef.current);
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
      toast.success('Game started!', {
        description: 'Use left and right arrow keys to move'
      });
    } else {
      console.error("Game engine not initialized");
      toast.error('Game engine not ready. Please refresh the page.');
    }
  };
  
  const handleTryAgain = () => {
    if (gameEngineRef.current) {
      setHighScore(gameEngineRef.current.getHighScore());
      gameEngineRef.current.startGame();
    }
  };
  
  const handleTouchLeft = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleTouchLeft();
    }
  };
  
  const handleTouchRight = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.handleTouchRight();
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="game-canvas-container relative w-full max-w-[600px]">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <div className="flex items-center space-x-2 glassmorphism px-3 py-1 rounded-full">
            {Array.from({ length: lives }).map((_, i) => (
              <Heart key={i} className="w-5 h-5 text-red-500 fill-red-500" />
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 glassmorphism px-3 py-1 rounded-full">
              <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center">
                <span className="text-[10px] text-amber-800 font-bold">S</span>
              </div>
              <span className="text-sm font-medium">{seedCount}</span>
            </div>
            
            <div className="glassmorphism px-4 py-1 rounded-full">
              <div className="hud-text text-xl font-medium">{score}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeSlowMode && (
              <div className="flex items-center space-x-1 glassmorphism px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">{Math.ceil(slowModeTimer / 1000)}s</span>
              </div>
            )}
            
            {activeShield && (
              <div className="flex items-center space-x-1 glassmorphism px-3 py-1 rounded-full">
                <Shield className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium">{Math.ceil(shieldTimer / 1000)}s</span>
              </div>
            )}
          </div>
        </div>
        
        {gameState === GameState.START_SCREEN && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/20 to-black/80 backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">Lane Runner</h1>
              <div className="chip text-xs bg-primary/10 text-primary px-3 py-1 rounded-full mb-4 inline-block">FAST-PACED ACTION</div>
              <p className="text-gray-300 mb-6">Navigate through traffic, collect seeds, and survive as long as possible!</p>
              
              <div className="flex flex-col space-y-4 items-center">
                <Button 
                  onClick={handleStartGame}
                  className="game-button w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-6 text-lg font-medium"
                  disabled={!gameInitialized}
                >
                  {gameInitialized ? 'Start Game' : <Loader2 className="h-5 w-5 animate-spin" />}
                </Button>
                
                {highScore > 0 && (
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Trophy className="w-5 h-5" />
                    <span>High Score: {highScore}</span>
                  </div>
                )}
              </div>
              
              {isFirstTime && (
                <div className="mt-8 text-sm text-gray-300 p-4 border border-white/10 rounded-lg bg-black/20">
                  <h3 className="font-bold mb-2">How to Play:</h3>
                  <ul className="text-left space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Use <span className="px-2 py-0.5 mx-1 rounded bg-black/30">←</span> and <span className="px-2 py-0.5 mx-1 rounded bg-black/30">→</span> keys to switch lanes
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Collect seeds to increase your score
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Avoid crashing into other cars
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Look for special power-ups to help you survive
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/20 to-black/80 backdrop-blur-sm transition-all duration-500 animate-fade-in">
            <div className="game-over-modal glassmorphism rounded-3xl p-8 max-w-md mx-auto text-center">
              <h2 className="text-3xl font-bold mb-2">Game Over</h2>
              
              <div className="my-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">YOUR SCORE</p>
                  <p className="text-4xl font-bold">{score}</p>
                </div>
                
                {score > highScore ? (
                  <div className="py-2 px-4 bg-amber-500/20 text-amber-300 rounded-full inline-flex items-center space-x-2 animate-pulse">
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
                  className="game-button w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-6 text-lg font-medium"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {isMobile && gameState === GameState.GAMEPLAY && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-between px-8">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "w-16 h-16 rounded-full glassmorphism border-white/20 touch-control",
                "active:bg-white/30 transition-all"
              )}
              onTouchStart={handleTouchLeft}
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "w-16 h-16 rounded-full glassmorphism border-white/20 touch-control",
                "active:bg-white/30 transition-all"
              )}
              onTouchStart={handleTouchRight}
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
        )}
        
        {(!carAssetsLoaded || !gameInitialized) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading game assets...</p>
          </div>
        )}
        
        <div className="bg-noise absolute inset-0 pointer-events-none opacity-5"></div>
      </div>
    </div>
  );
};

export default Game;
