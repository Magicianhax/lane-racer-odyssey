
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Wallet, Home, Play, Settings, X } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useGameState } from '@/contexts/GameStateContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface GameMenuProps {
  onResume?: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onResume }) => {
  const { createUserWallet, isConnected, wallet, username } = useWeb3();
  const { gameState, setGameState } = useGameState();
  const navigate = useNavigate();
  const [volume, setVolume] = useState<number[]>([50]);
  const [isMuted, setIsMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load volume settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('gameVolume');
    const savedMuted = localStorage.getItem('gameMuted');
    
    if (savedVolume) {
      setVolume([parseInt(savedVolume)]);
    }
    
    if (savedMuted) {
      setIsMuted(savedMuted === 'true');
    }
  }, []);

  // Save volume settings to localStorage
  useEffect(() => {
    localStorage.setItem('gameVolume', volume[0].toString());
    localStorage.setItem('gameMuted', isMuted.toString());
    
    // This is where you would update actual game audio
    // For example: gameInstance.setVolume(isMuted ? 0 : volume[0] / 100);
  }, [volume, isMuted]);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (isMuted && newVolume[0] > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleBackToHome = () => {
    navigate('/');
    setMenuOpen(false);
  };

  const handleWalletClick = () => {
    navigate('/wallet');
    setMenuOpen(false);
  };

  const handleResumeGame = () => {
    if (onResume) {
      onResume();
    }
    setGameState('playing');
    setMenuOpen(false);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-zinc-900/70 backdrop-blur-md border border-white/10 hover:bg-zinc-800"
          >
            <Settings className="h-5 w-5 text-[#91d3d1]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 bg-zinc-900/95 backdrop-blur-md border-white/10 text-white"
          align="end"
          sideOffset={5}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#91d3d1]">Game Menu</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-zinc-800" 
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-zinc-800" 
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-sm">Volume</span>
              </div>
              <span className="text-xs text-zinc-400">{isMuted ? 0 : volume[0]}%</span>
            </div>
            <Slider
              value={isMuted ? [0] : volume}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>

          {/* Wallet Section */}
          <div className="border-t border-white/10 pt-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#91d3d1]" />
                <span className="text-sm">Wallet</span>
              </div>
              <Button 
                variant="teal-outline" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={handleWalletClick}
              >
                Manage
              </Button>
            </div>
            {isConnected ? (
              <div className="bg-zinc-800/50 rounded-md p-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">Address:</span>
                  <span>{formatAddress(wallet.address || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Balance:</span>
                  <span>{wallet.balance} ETH</span>
                </div>
              </div>
            ) : (
              <Button 
                variant="teal" 
                size="sm" 
                className="w-full"
                onClick={() => createUserWallet(username || 'Player')}
              >
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-white/10 pt-4 flex gap-2">
            <Button 
              variant="ghost" 
              className="flex-1 text-white hover:bg-zinc-800 border border-white/10"
              onClick={handleBackToHome}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            
            {gameState === 'paused' && (
              <Button 
                variant="teal" 
                className="flex-1"
                onClick={handleResumeGame}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GameMenu;
