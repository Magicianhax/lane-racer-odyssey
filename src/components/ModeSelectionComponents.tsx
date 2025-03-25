
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Blocks, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/game/GameEngine';

// Mode Selection Screen Component
export const ModeSelectionScreen: React.FC<{
  onSelectMode: (mode: GameMode) => void;
  className?: string;
  currentMode?: GameMode;
  onContinue?: () => void; 
}> = ({ onSelectMode, className, currentMode, onContinue }) => {
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in", className)}>
      <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <h1 className="text-4xl font-bold mb-6 tracking-tight text-white text-gradient">GAME MODE</h1>
        
        <div className="flex flex-col space-y-6 items-center">
          <Button 
            onClick={() => onSelectMode(GameMode.ONCHAIN)}
            className={cn(
              "game-button w-full bg-gradient-to-r from-[#f7931a] to-[#e6a338] hover:from-[#e6a338] hover:to-[#d18a1f] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#f7931a]/20 relative overflow-hidden group",
              currentMode === GameMode.ONCHAIN && "ring-2 ring-[#f7931a]/50"
            )}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMiIgcng9IjUiIGZpbGw9Im5vbmUiPjwvcmVjdD48L3N2Zz4=')] bg-repeat opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <Blocks className="mr-3 h-5 w-5" />
            START GAME
            {currentMode === GameMode.ONCHAIN && (
              <span className="absolute top-0 right-0 bg-[#f7931a] px-2 py-1 text-xs rounded-bl-md rounded-tr-md">CURRENT</span>
            )}
          </Button>
          
          {onContinue && (
            <Button 
              onClick={onContinue}
              className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
            >
              Continue Playing
            </Button>
          )}
        </div>
        
        <div className="mt-8 text-sm text-[#91d3d1]/70">
          <p>• Onchain Mode: Earn rewards and own your achievements</p>
        </div>
      </div>
      
      <div className="absolute -bottom-20 -left-10 opacity-10 rotate-12 transform scale-75">
        <div className="w-32 h-20 bg-white rounded-md"></div>
      </div>
      <div className="absolute top-20 -right-10 opacity-10 -rotate-12 transform scale-75">
        <div className="w-32 h-20 bg-white rounded-md"></div>
      </div>
    </div>
  );
};
