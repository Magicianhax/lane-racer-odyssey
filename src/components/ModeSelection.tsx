
import React from 'react';
import { Button } from '@/components/ui/button';
import { Network, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameMode = 'online' | 'onchain' | null;

interface ModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-white text-gradient">Choose Mode</h1>
      <p className="text-gray-300 mb-8">Select how you want to play the game</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
        <Button 
          onClick={() => onSelectMode('online')}
          className={cn(
            "flex flex-col items-center py-8 px-6 rounded-2xl",
            "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            "text-white shadow-lg transition-all"
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
            "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
            "text-white shadow-lg transition-all"
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
