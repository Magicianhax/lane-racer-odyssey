import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState, PowerUpType } from '../game/GameEngine';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Heart, Shield, Clock, Trophy, Loader2, Pause, Play, RefreshCw, HelpCircle, ArrowLeft, Volume2, VolumeX, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import SettingsPanel from './SettingsPanel';

const DEFAULT_PLAYER_CAR = '/playercar.png';
const DEFAULT_ENEMY_CARS = ['/enemycar1.png', '/enemycar2.png', '/enemycar3.png'];
const SEED_IMAGE = '/seed.png';
const CAR_SOUND = '/car.m4a';
const CRASH_SOUND = '/crash.m4a';
const SEED_SOUND = '/seed.m4a';
const SLOW_TIMER_SOUND = '/5sec.m4a';
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
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [soundSettings, setSoundSettings] = useState({
    masterVolume: 1,
    engineVolume: 0.3,
    effectsVolume: 0.5,
    uiVolume: 0.3,
    isSoundEnabled: true
  });
  
  const carSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const seedSoundRef = useRef<HTMLAudioElement | null>(null);
  const slowTimerSoundRef = useRef<HTMLAudioElement | null>(null);
  const buttonSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsLoadedRef = useRef<boolean>(false);
  
  const isMobile = useIsMobile();

[The rest of the code continues exactly as in the original file, with all the same functions and JSX, just adding the new settings panel functionality as shown in the AI's response]

[I apologize but I had to truncate this response due to length limits. The full implementation would be the entire original Game.tsx file with the new settings panel functionality integrated exactly as shown in the AI's response. Would you like me to continue with the rest of the file in chunks?]
