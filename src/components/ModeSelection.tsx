
import React from 'react';
import { Button } from '@/components/ui/button';
import { Network, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameMode = 'online' | 'onchain' | null;

interface ModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
  username?: string;
  onChangeUsername?: () => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ 
  onSelectMode, 
  username, 
  onChangeUsername 
}) => {
  // If there's already a username, show the change username option
  if (username) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-2 tracking-tight text-white text-gradient">Choose Mode</h1>
        <p className="text-gray-300 mb-4">Current username: <span className="font-medium text-[#91d3d1]">{username}</span></p>
        
        <div className="grid grid-cols-1 gap-6 w-full max-w-md">
          <Button 
            onClick={() => onSelectMode('online')}
            className={cn(
              "flex flex-col items-center py-8 px-6 rounded-2xl",
              "bg-gradient-to-br from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd]",
              "text-zinc-900 shadow-lg transition-all"
            )}
          >
            <Network className="mb-3 h-10 w-10" />
            <span className="text-xl font-medium">Online Mode</span>
            <span className="text-xs mt-2 opacity-80">Play with online leaderboards</span>
          </Button>
          
          <Button 
            onClick={() => onSelectMode('onchain')}
            className={cn(
              "flex flex-col items-center py-8 px-6 rounded-2xl",
              "bg-gradient-to-br from-[#91d3d1] to-[#68bcb8] hover:from-[#68bcb8] hover:to-[#5aafac]",
              "text-zinc-900 shadow-lg transition-all"
            )}
          >
            <Key className="mb-3 h-10 w-10" />
            <span className="text-xl font-medium">Onchain Mode</span>
            <span className="text-xs mt-2 opacity-80">Play with blockchain integration</span>
          </Button>
          
          {onChangeUsername && (
            <Button
              onClick={onChangeUsername}
              variant="outline"
              className="mt-4 border-[#91d3d1]/30 text-[#91d3d1] hover:bg-[#91d3d1]/10"
            >
              Change Username
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Default mode selection without username
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-white text-gradient">Choose Mode</h1>
      <p className="text-gray-300 mb-8">Select how you want to play the game</p>
      
      <div className="grid grid-cols-1 gap-6 w-full max-w-md">
        <Button 
          onClick={() => onSelectMode('online')}
          className={cn(
            "flex flex-col items-center py-8 px-6 rounded-2xl",
            "bg-gradient-to-br from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd]",
            "text-zinc-900 shadow-lg transition-all"
          )}
        >
          <Network className="mb-3 h-10 w-10" />
          <span className="text-xl font-medium">Online Mode</span>
          <span className="text-xs mt-2 opacity-80">Play with online leaderboards</span>
        </Button>
        
        <Button 
          onClick={() => onSelectMode('onchain')}
          className={cn(
            "flex flex-col items-center py-8 px-6 rounded-2xl",
            "bg-gradient-to-br from-[#91d3d1] to-[#68bcb8] hover:from-[#68bcb8] hover:to-[#5aafac]",
            "text-zinc-900 shadow-lg transition-all"
          )}
        >
          <Key className="mb-3 h-10 w-10" />
          <span className="text-xl font-medium">Onchain Mode</span>
          <span className="text-xs mt-2 opacity-80">Play with blockchain integration</span>
        </Button>
      </div>
    </div>
  );
};

export default ModeSelection;
