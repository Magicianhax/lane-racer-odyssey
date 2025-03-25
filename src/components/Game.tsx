
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, PowerUpType, GameMode } from '../game/GameEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Heart, Shield, Clock, Trophy, Loader2, Pause, Play, RefreshCw, HelpCircle, ArrowLeft, Volume2, VolumeX, Blocks, User, Settings, Home, Rocket, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ModeSelectionScreen } from './ModeSelectionComponents';
import { useWeb3 } from '@/contexts/Web3Context';
import { OnchainMode } from '@/components/OnchainMode';

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
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(GameMode.NONE);
  
  const { isConnected, submitScore, wallet } = useWeb3();
  
  const carSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const seedSoundRef = useRef<HTMLAudioElement | null>(null);
  const slowTimerSoundRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsLoadedRef = useRef<boolean>(false);
  
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isFirstTime) {
      setShowHowToPlay(true);
      setIsFirstTime(false);
    }
  }, [isFirstTime]);

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      setCanvasSize({
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const playerCarImage = new Image();
        playerCarImage.src = playerCarURL;

        const enemyCarImages = enemyCarURLs.map(url => {
          const img = new Image();
          img.src = url;
          return img;
        });

        const seedImage = new Image();
        seedImage.src = seedImageURL;

        await Promise.all([
          new Promise(resolve => playerCarImage.onload = resolve),
          ...enemyCarImages.map(img => new Promise(resolve => img.onload = resolve)),
          new Promise(resolve => seedImage.onload = resolve),
        ]);

        setCarAssetsLoaded(true);
      } catch (error) {
        console.error("Error loading car assets:", error);
        setLoadingError("Failed to load car assets. Please check your internet connection and try again.");
      }
    };

    loadAssets();
  }, [playerCarURL, enemyCarURLs, seedImageURL]);

  useEffect(() => {
    const loadSounds = () => {
      carSoundRef.current = new Audio(CAR_SOUND);
      crashSoundRef.current = new Audio(CRASH_SOUND);
      seedSoundRef.current = new Audio(SEED_SOUND);
      slowTimerSoundRef.current = new Audio(SLOW_TIMER_SOUND);
      buttonSoundRef.current = new Audio(BUTTON_SOUND);

      soundsLoadedRef.current = true;
    };

    loadSounds();

    return () => {
      if (carSoundRef.current) carSoundRef.current.pause();
      if (crashSoundRef.current) crashSoundRef.current.pause();
      if (seedSoundRef.current) seedSoundRef.current.pause();
      if (slowTimerSoundRef.current) slowTimerSoundRef.current.pause();
      if (buttonSoundRef.current) buttonSoundRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (carAssetsLoaded && canvasRef.current && !gameInitialized) {
      const playerCarImage = new Image();
      playerCarImage.src = playerCarURL;

      const enemyCarImages = enemyCarURLs.map(url => {
        const img = new Image();
        img.src = url;
        return img;
      });

      const seedImage = new Image();
      seedImage.src = seedImageURL;

      Promise.all([
        new Promise(resolve => playerCarImage.onload = resolve),
        ...enemyCarImages.map(img => new Promise(resolve => img.onload = resolve)),
        new Promise(resolve => seedImage.onload = resolve),
      ]).then(() => {
        if (!canvasRef.current) return;

        const gameEngine = new GameEngine(
          canvasRef.current,
          setScore,
          setLives,
          setGameState,
          setActiveSlowMode,
          setActiveShield,
          setSlowModeTimer,
          setShieldTimer,
          playerCarImage,
          enemyCarImages,
          seedImage,
          () => playSound(crashSoundRef),
          () => playSound(seedSoundRef),
          selectedGameMode
        );

        gameEngineRef.current = gameEngine;
        setGameInitialized(true);
        setGameState(GameState.PAUSED);
      });
    }

    return () => {
      if (gameEngineRef.current) {
        // Handle stopping the game engine if necessary
      }
    };
  }, [carAssetsLoaded, playerCarURL, enemyCarURLs, seedImageURL, selectedGameMode]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (activeSlowMode && slowModeTimer > 0) {
      timerId = setTimeout(() => {
        setSlowModeTimer(prevTime => prevTime - 1);
        playSound(slowTimerSoundRef);
      }, 1000);
    } else if (slowModeTimer === 0) {
      setActiveSlowMode(false);
    }

    return () => clearTimeout(timerId);
  }, [activeSlowMode, slowModeTimer]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (activeShield && shieldTimer > 0) {
      timerId = setTimeout(() => {
        setShieldTimer(prevTime => prevTime - 1);
      }, 1000);
    } else if (shieldTimer === 0) {
      setActiveShield(false);
    }

    return () => clearTimeout(timerId);
  }, [activeShield, shieldTimer]);

  useEffect(() => {
    const storedHighScore = localStorage.getItem('highScore') || '0';
    setHighScore(parseInt(storedHighScore));
  }, []);

  useEffect(() => {
    localStorage.setItem('highScore', highScore.toString());
  }, [highScore]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameInitialized && gameEngineRef.current) {
        // Call the GameEngine's key handlers if they're exposed
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (gameInitialized && gameEngineRef.current) {
        // Call the GameEngine's key handlers if they're exposed
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameInitialized]);

  useEffect(() => {
    if (gameState === GameState.RUNNING && gameEngineRef.current) {
      // Start the game
    } else if (gameEngineRef.current) {
      // Stop the game
    }
  }, [gameState]);

  const startGame = () => {
    if (selectedGameMode === GameMode.NONE) {
      toast.error("Please select a game mode to start.");
      return;
    }
    setGameState(GameState.RUNNING);
  };

  const pauseGame = () => {
    setGameState(GameState.PAUSED);
  };

  const resetGame = () => {
    if (gameEngineRef.current) {
      // Reset the game
      setScore(0);
      setLives(3);
      setGameState(GameState.PAUSED);
      setActiveSlowMode(false);
      setActiveShield(false);
      setSlowModeTimer(0);
      setShieldTimer(0);
    }
  };

  const exitGame = () => {
    setGameState(GameState.MODE_SELECTION);
    setScore(0);
    setLives(3);
    setActiveSlowMode(false);
    setActiveShield(false);
    setSlowModeTimer(0);
    setShieldTimer(0);
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const playSound = (soundRef: React.RefObject<HTMLAudioElement>) => {
    if (isSoundEnabled && soundRef.current && soundsLoadedRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play();
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    setSelectedGameMode(mode);
  };

  const getDisplayAddress = () => {
    if (wallet && wallet.address) {
      return `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    }
    return '';
  };

  const submitFinalScore = async () => {
    if (score > highScore) {
      setHighScore(score);
    }

    if (isConnected) {
      try {
        await submitScore(score);
      } catch (error) {
        console.error("Error submitting score:", error);
        toast.error("Failed to submit score to blockchain.");
      }
    } else {
      toast.info("Connect your wallet to submit your score to the blockchain!");
    }
  };

  const renderModeSelection = () => (
    <ModeSelectionScreen onSelectMode={handleModeSelect} />
  );

  const renderOnchainMode = () => (
    <OnchainMode />
  );

  const renderHowToPlay = () => {
    const howToPlayContent = [
      {
        title: "Welcome to Seed Racer!",
        description: "Collect seeds to increase your score. Avoid obstacles to stay alive!",
        image: "/seed.png",
      },
      {
        title: "Controls",
        description: "Use the left and right arrow keys to move your car.",
        image: "/playercar.png",
      },
      {
        title: "Power-Ups",
        description: "Collect the shield to become invincible for 5 seconds. Collect the clock to slow down time for 5 seconds.",
        image: "/shield.png",
      },
    ];

    return (
      <div className="fixed inset-0 bg-zinc-900 bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="glassmorphism p-6 rounded-xl max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">How to Play</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowHowToPlay(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{howToPlayContent[currentHowToPlayPage].title}</h3>
            <p className="text-sm text-gray-300">{howToPlayContent[currentHowToPlayPage].description}</p>
            {howToPlayContent[currentHowToPlayPage].image && (
              <div className="flex justify-center mt-2">
                <img src={howToPlayContent[currentHowToPlayPage].image} alt="How to Play" className="max-h-20" />
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentHowToPlayPage(prev => Math.max(0, prev - 1));
                playSound(buttonSoundRef);
              }}
              disabled={currentHowToPlayPage === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentHowToPlayPage(prev => Math.min(howToPlayContent.length - 1, prev + 1));
                playSound(buttonSoundRef);
              }}
              disabled={currentHowToPlayPage === howToPlayContent.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderGameUI = () => (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => {
            setShowHowToPlay(true);
            playSound(buttonSoundRef);
          }}>
            <HelpCircle className="h-5 w-5" />
          </Button>
          {selectedGameMode === GameMode.ONCHAIN && (
            <Button variant="ghost" size="icon" onClick={() => {
              setGameState(GameState.MODE_SELECTION);
              playSound(buttonSoundRef);
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            <span>{lives}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>{score}</span>
          </div>
          {selectedGameMode === GameMode.ONCHAIN && isConnected && (
            <div className="text-sm">
              Wallet: {getDisplayAddress()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-zinc-900"
          width={canvasSize.width}
          height={canvasSize.height}
        />
        {loadingError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 bg-opacity-50">
            <div className="text-red-500">{loadingError}</div>
          </div>
        )}
      </div>

      <div className="p-4 flex justify-around items-center">
        {gameState === GameState.PAUSED ? (
          <Button onClick={() => {
            startGame();
            playSound(buttonSoundRef);
          }}>
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        ) : (
          <Button onClick={() => {
            pauseGame();
            playSound(buttonSoundRef);
          }}>
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}
        <Button variant="destructive" onClick={() => {
          resetGame();
          playSound(buttonSoundRef);
        }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button variant="secondary" onClick={() => {
          exitGame();
          playSound(buttonSoundRef);
        }}>
          <Home className="mr-2 h-4 w-4" />
          Exit
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSound}>
          {isSoundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
      </div>

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 bg-opacity-75">
          <div className="glassmorphism p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="mb-4">Your final score: {score}</p>
            {score > highScore && (
              <p className="text-green-500 mb-4">New high score!</p>
            )}
            <div className="flex justify-around">
              <Button onClick={() => {
                resetGame();
                startGame();
                playSound(buttonSoundRef);
              }}>
                <Play className="mr-2 h-4 w-4" />
                Play Again
              </Button>
              {selectedGameMode === GameMode.ONCHAIN && (
                <Button variant="teal" onClick={submitFinalScore} disabled={!isConnected}>
                  {isConnected ? 'Submit Score' : 'Connect Wallet to Submit'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => {
                exitGame();
                playSound(buttonSoundRef);
              }}>
                <Home className="mr-2 h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {gameState === GameState.MODE_SELECTION && renderModeSelection()}
      {gameState === GameState.ONCHAIN && renderOnchainMode()}
      {gameState !== GameState.MODE_SELECTION && gameState !== GameState.ONCHAIN && renderGameUI()}
      {showHowToPlay && renderHowToPlay()}
    </div>
  );
};

export default Game;
