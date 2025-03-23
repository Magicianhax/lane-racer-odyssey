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
  
  const carSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsLoadedRef = useRef<boolean>(false);
  
  const leftKeyPressTimeRef = useRef<number[]>([]);
  const rightKeyPressTimeRef = useRef<number[]>([]);
  const KEY_PRESS_THRESHOLD = 300;

  const isMobile = useIsMobile();

  const initCanvas = () => {
    if (canvasRef.current) {
      const parentDiv = canvasRef.current.parentElement;
      if (parentDiv) {
        const width = parentDiv.clientWidth;
        const height = parentDiv.clientHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        setCanvasSize({ width, height });
        return { width, height };
      }
    }
    return null;
  };

  const checkHighScore = (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem('highScore', String(currentScore));
      return true;
    }
    return false;
  };

  const loadSounds = () => {
    if (!soundsLoadedRef.current) {
      const carSound = new Audio(CAR_SOUND);
      carSound.loop = true;
      carSound.volume = 0.3;
      carSoundRef.current = carSound;

      const crashSound = new Audio(CRASH_SOUND);
      crashSound.loop = false;
      crashSound.volume = 0.5;
      crashSoundRef.current = crashSound;

      soundsLoadedRef.current = true;
      console.log('Sounds loaded successfully');
    }
  };

  const playEngineSound = () => {
    if (carSoundRef.current && isSoundEnabled) {
      try {
        if (carSoundRef.current.paused) {
          const playPromise = carSoundRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error playing engine sound:', error);
            });
          }
        }
      } catch (error) {
        console.error('Exception playing engine sound:', error);
      }
    }
  };
  
  const stopEngineSound = () => {
    if (carSoundRef.current && !carSoundRef.current.paused) {
      try {
        carSoundRef.current.pause();
        carSoundRef.current.currentTime = 0;
      } catch (error) {
        console.error('Error stopping engine sound:', error);
      }
    }
  };
  
  const playCollisionSound = () => {
    if (crashSoundRef.current && isSoundEnabled) {
      try {
        crashSoundRef.current.currentTime = 0;
        const playPromise = crashSoundRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing crash sound:', error);
          });
        }
      } catch (error) {
        console.error('Exception playing crash sound:', error);
      }
    }
  };

  const initGame = () => {
    loadSounds();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cachedHighScore = localStorage.getItem('highScore');
    if (cachedHighScore) {
      setHighScore(Number(cachedHighScore));
    }

    const dimensions = initCanvas();
    if (!dimensions) return;

    if (gameEngineRef.current === null) {
      const gameEngine = new GameEngine({
        canvas,
        dimensions,
        onScoreUpdate: (newScore) => setScore(newScore),
        onLifeLost: (livesLeft) => {
          setLives(livesLeft);
          playCollisionSound();
          if (livesLeft <= 0) {
            stopEngineSound();
            checkHighScore(score);
            setGameState(GameState.GAME_OVER);
          }
        },
        onCollectPowerUp: (type) => {
          switch (type) {
            case PowerUpType.SHIELD:
              setActiveShield(true);
              setShieldTimer(10);
              break;
            case PowerUpType.SLOW_MODE:
              setActiveSlowMode(true);
              setSlowModeTimer(10);
              break;
            case PowerUpType.EXTRA_LIFE:
              const newLives = Math.min(lives + 1, 5);
              setLives(newLives);
              break;
          }
        },
        enemyCarURLs,
        playerCarURL,
        seedImageURL
      });
      gameEngineRef.current = gameEngine;
      setGameInitialized(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (gameState !== GameState.PLAYING || !gameEngineRef.current) return;

    const now = Date.now();
    
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      leftKeyPressTimeRef.current.push(now);
      
      const recentPresses = leftKeyPressTimeRef.current.filter(
        time => now - time < KEY_PRESS_THRESHOLD
      );
      
      leftKeyPressTimeRef.current = recentPresses;
      
      const lanes = Math.min(recentPresses.length, 3);
      for (let i = 0; i < lanes; i++) {
        gameEngineRef.current.moveLeft();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      rightKeyPressTimeRef.current.push(now);
      
      const recentPresses = rightKeyPressTimeRef.current.filter(
        time => now - time < KEY_PRESS_THRESHOLD
      );
      
      rightKeyPressTimeRef.current = recentPresses;
      
      const lanes = Math.min(recentPresses.length, 3);
      for (let i = 0; i < lanes; i++) {
        gameEngineRef.current.moveRight();
      }
    } else if (e.key === 'p') {
      pauseGame();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (gameState !== GameState.PLAYING || !gameEngineRef.current) return;

    const now = Date.now();
    const direction = e.currentTarget.dataset.direction;
    
    if (direction === 'left') {
      leftKeyPressTimeRef.current.push(now);
      
      const recentPresses = leftKeyPressTimeRef.current.filter(
        time => now - time < KEY_PRESS_THRESHOLD
      );
      
      leftKeyPressTimeRef.current = recentPresses;
      
      const lanes = Math.min(recentPresses.length, 3);
      for (let i = 0; i < lanes; i++) {
        gameEngineRef.current.moveLeft();
      }
    } else if (direction === 'right') {
      rightKeyPressTimeRef.current.push(now);
      
      const recentPresses = rightKeyPressTimeRef.current.filter(
        time => now - time < KEY_PRESS_THRESHOLD
      );
      
      rightKeyPressTimeRef.current = recentPresses;
      
      const lanes = Math.min(recentPresses.length, 3);
      for (let i = 0; i < lanes; i++) {
        gameEngineRef.current.moveRight();
      }
    }
  };

  const startGame = () => {
    if (!gameEngineRef.current || !gameInitialized) return;
    
    setLives(3);
    setScore(0);
    setActiveShield(false);
    setActiveSlowMode(false);
    setSlowModeTimer(0);
    setShieldTimer(0);
    
    if (isFirstTime) {
      setShowHowToPlay(true);
      setIsFirstTime(false);
    } else {
      setGameState(GameState.PLAYING);
      gameEngineRef.current.startGame();
      playEngineSound();
    }
  };

  const restartGame = () => {
    if (!gameEngineRef.current || !gameInitialized) return;
    
    setLives(3);
    setScore(0);
    setActiveShield(false);
    setActiveSlowMode(false);
    setSlowModeTimer(0);
    setShieldTimer(0);
    setGameState(GameState.PLAYING);
    
    gameEngineRef.current.startGame();
    playEngineSound();
  };

  const pauseGame = () => {
    if (!gameEngineRef.current || gameState !== GameState.PLAYING) return;
    
    setGameState(GameState.PAUSED);
    gameEngineRef.current.pauseGame();
    stopEngineSound();
  };

  const resumeGame = () => {
    if (!gameEngineRef.current || gameState !== GameState.PAUSED) return;
    
    setGameState(GameState.PLAYING);
    gameEngineRef.current.resumeGame();
    playEngineSound();
  };

  const gameLoop = (timestamp: number) => {
    if (gameState === GameState.PLAYING && gameEngineRef.current) {
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      
      if (activeSlowMode) {
        setSlowModeTimer(prev => {
          const newTime = Math.max(0, prev - delta);
          if (newTime <= 0) {
            setActiveSlowMode(false);
            gameEngineRef.current!.disableSlowMode();
          } else {
            gameEngineRef.current!.enableSlowMode();
          }
          return newTime;
        });
      }
      
      if (activeShield) {
        setShieldTimer(prev => {
          const newTime = Math.max(0, prev - delta);
          if (newTime <= 0) {
            setActiveShield(false);
            gameEngineRef.current!.disableShield();
          } else {
            gameEngineRef.current!.enableShield();
          }
          return newTime;
        });
      }
      
      gameEngineRef.current.update();
      gameEngineRef.current.render();
    }
  };

  let animationFrameId: number;
  let lastTime = 0;

  useEffect(() => {
    if (gameInitialized && gameState === GameState.PLAYING) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, gameInitialized, activeSlowMode, activeShield]);

  useEffect(() => {
    initGame();
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopEngineSound();
      
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
    if (!isSoundEnabled) {
      if (gameState === GameState.PLAYING) {
        playEngineSound();
      }
    } else {
      stopEngineSound();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const dimensions = initCanvas();
      if (dimensions && gameEngineRef.current) {
        gameEngineRef.current.updateDimensions(dimensions);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleHowToPlayNext = () => {
    if (currentHowToPlayPage < 2) {
      setCurrentHowToPlayPage(currentHowToPlayPage + 1);
    } else {
      closeHowToPlay();
    }
  };

  const handleHowToPlayPrev = () => {
    if (currentHowToPlayPage > 0) {
      setCurrentHowToPlayPage(currentHowToPlayPage - 1);
    }
  };

  const closeHowToPlay = () => {
    setShowHowToPlay(false);
    setGameState(GameState.PLAYING);
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
      playEngineSound();
    }
  };

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const playerCarImg = new Image();
        playerCarImg.src = playerCarURL;
        await new Promise((resolve, reject) => {
          playerCarImg.onload = resolve;
          playerCarImg.onerror = reject;
        });
        
        await Promise.all(
          enemyCarURLs.map(url => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.src = url;
              img.onload = resolve;
              img.onerror = reject;
            });
          })
        );
        
        const seedImg = new Image();
        seedImg.src = seedImageURL;
        await new Promise((resolve, reject) => {
          seedImg.onload = resolve;
          seedImg.onerror = reject;
        });
        
        setCarAssetsLoaded(true);
      } catch (error) {
        console.error('Failed to load game assets', error);
        setLoadingError('Failed to load game assets. Please try refreshing the page.');
      }
    };
    
    loadAssets();
  }, [playerCarURL, enemyCarURLs, seedImageURL]);

  const renderGameUI = () => {
    switch (gameState) {
      case GameState.START_SCREEN:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-black/80 rounded-lg">
            <h1 className="text-3xl font-bold text-white mb-4">Lane Runner</h1>
            <p className="text-gray-300 mb-6">Dodge cars and collect power-ups to get the highest score!</p>
            
            {loadingError ? (
              <div className="text-red-500 mb-4">{loadingError}</div>
            ) : carAssetsLoaded ? (
              <Button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full text-lg transition"
              >
                START GAME
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading assets...</span>
              </div>
            )}
            
            {highScore > 0 && (
              <div className="mt-4 text-yellow-400 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span>High Score: {highScore}</span>
              </div>
            )}
            
            <Button
              onClick={() => setShowHowToPlay(true)}
              variant="outline"
              className="mt-2 text-gray-300 border-gray-700"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              How to Play
            </Button>
          </div>
        );

      case GameState.GAME_OVER:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-black/80 rounded-lg">
            <h1 className="text-3xl font-bold text-red-500 mb-2">Game Over</h1>
            <p className="text-2xl font-bold text-white mb-6">Score: {score}</p>
            
            {checkHighScore(score) && (
              <div className="text-yellow-400 text-xl mb-6 flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                <span>New High Score!</span>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button
                onClick={restartGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
              
              <Button
                onClick={() => setGameState(GameState.START_SCREEN)}
                variant="outline"
                className="text-gray-300 border-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Main Menu
              </Button>
            </div>
          </div>
        );

      case GameState.PAUSED:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-black/80 rounded-lg">
            <h1 className="text-3xl font-bold text-white mb-6">Game Paused</h1>
            
            <div className="flex gap-4">
              <Button
                onClick={resumeGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              
              <Button
                onClick={() => setGameState(GameState.START_SCREEN)}
                variant="outline"
                className="text-gray-300 border-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Main Menu
              </Button>
            </div>
          </div>
        );

      case GameState.PLAYING:
        return (
          <>
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-black/50 px-3 py-1 rounded-lg flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-bold">{score}</span>
                </div>
                
                <div className="bg-black/50 px-3 py-1 rounded-lg flex items-center gap-1">
                  {Array.from({ length: lives }).map((_, i) => (
                    <Heart key={i} className="h-4 w-4 text-red-500" />
                  ))}
                  {Array.from({ length: 5 - lives }).map((_, i) => (
                    <Heart key={i + lives} className="h-4 w-4 text-gray-500" />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {activeShield && (
                  <div className="bg-black/50 px-3 py-1 rounded-lg flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-bold">{Math.ceil(shieldTimer)}s</span>
                  </div>
                )}
                
                {activeSlowMode && (
                  <div className="bg-black/50 px-3 py-1 rounded-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span className="text-white font-bold">{Math.ceil(slowModeTimer)}s</span>
                  </div>
                )}
                
                <Button
                  onClick={toggleSound}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white bg-black/50 rounded-lg"
                >
                  {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={pauseGame}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white bg-black/50 rounded-lg"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isMobile && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8">
                <Button
                  data-direction="left"
                  onTouchStart={handleTouchStart}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full h-16 w-16 flex items-center justify-center"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                
                <Button
                  data-direction="right"
                  onTouchStart={handleTouchStart}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full h-16 w-16 flex items-center justify-center"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const renderHowToPlay = () => {
    if (!showHowToPlay) return null;
    
    const pages = [
      {
        title: "How to Play",
        content: (
          <>
            <p className="mb-4">Use the arrow keys (or A/D) to move your car left and right.</p>
            <p className="mb-4">Avoid other cars and try to survive as long as possible.</p>
            <p>Collect power-ups to gain advantages!</p>
          </>
        )
      },
      {
        title: "Power-Ups",
        content: (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span>Shield: Makes you invulnerable for a short time</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-400" />
              <span>Slow Mode: Makes all other cars move slower</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span>Extra Life: Gives you one additional life</span>
            </div>
          </>
        )
      },
      {
        title: "Controls",
        content: (
          <>
            <p className="mb-3">Keyboard:</p>
            <p className="mb-2">← or A: Move Left</p>
            <p className="mb-2">→ or D: Move Right</p>
            <p className="mb-4">P: Pause Game</p>
            <p className="text-yellow-400">
              Tip: Double-tap or triple-tap arrow keys to move 2 or 3 lanes at once!
            </p>
          </>
        )
      }
    ];
    
    const currentPage = pages[currentHowToPlayPage];
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 z-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">{currentPage.title}</h2>
        <div className="mb-8 text-center">{currentPage.content}</div>
        
        <div className="flex items-center justify-between w-full max-w-xs">
          <Button 
            onClick={handleHowToPlayPrev}
            disabled={currentHowToPlayPage === 0}
            variant="outline"
            className={cn(
              "border-gray-700",
              currentHowToPlayPage === 0 ? "opacity-50" : ""
            )}
          >
            Previous
          </Button>
          
          <span className="text-gray-400">
            {currentHowToPlayPage + 1} / {pages.length}
          </span>
          
          <Button 
            onClick={handleHowToPlayNext}
            variant="outline"
            className="border-gray-700"
          >
            {currentHowToPlayPage === pages.length - 1 ? "Start Game" : "Next"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-zinc-900 rounded-lg">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
      />
      {renderGameUI()}
      {renderHowToPlay()}
    </div>
  );
};

export default Game;
