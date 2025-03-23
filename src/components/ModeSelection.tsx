
import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameMode = 'online' | 'onchain' | null;

interface ModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
      <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <h1 className="text-3xl font-bold mb-6 tracking-tight text-white">SELECT GAME MODE</h1>
        
        <div className="flex flex-col space-y-4 items-center">
          <Button 
            onClick={() => onSelectMode('online')}
            className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
          >
            <Globe className="mr-2 h-5 w-5" />
            ONLINE MODE
          </Button>
          
          <Button 
            onClick={() => onSelectMode('onchain')}
            variant="teal-outline"
            className={cn(
              "w-full rounded-xl py-6 text-lg font-medium",
              "border-2 border-[#91d3d1] text-[#91d3d1] hover:bg-[#91d3d1]/10"
            )}
          >
            <Key className="mr-2 h-5 w-5" />
            ONCHAIN MODE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
