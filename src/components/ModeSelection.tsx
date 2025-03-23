
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Key, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameMode = 'online' | 'onchain';

interface ModeSelectionProps {
  onModeSelect: (mode: GameMode) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  currentUsername?: string;
  onChangeUsername?: () => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({
  onModeSelect,
  onBack,
  showBackButton = false,
  currentUsername,
  onChangeUsername,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] p-6">
      <div className="glassmorphism rounded-3xl p-8 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20 w-full">
        {showBackButton && onBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 left-4 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <h1 className="text-4xl font-bold mb-2 tracking-tight text-white text-gradient">Superseed Lane Runner</h1>
        <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-6 inline-block">
          SELECT MODE
        </div>

        {currentUsername && (
          <div className="mb-6 text-gray-300 flex flex-col items-center">
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 mr-2 opacity-70" />
              <span className="opacity-70">Current username:</span> <span className="font-medium ml-1">{currentUsername}</span>
            </div>
            
            {onChangeUsername && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onChangeUsername} 
                className="text-xs text-[#91d3d1] hover:text-[#7ec7c5] transition-colors"
              >
                Change username
              </Button>
            )}
          </div>
        )}

        <div className="space-y-4 mt-2">
          <Button
            onClick={() => onModeSelect('online')}
            className="game-button w-full bg-gradient-to-r from-[#6e9dec] to-[#5a8be0] hover:from-[#5a8be0] hover:to-[#4a7ed0] text-white rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#6e9dec]/20 flex items-center justify-center"
          >
            <Globe className="mr-3 h-5 w-5" />
            ONLINE MODE
          </Button>

          <Button
            onClick={() => onModeSelect('onchain')}
            className="game-button w-full bg-gradient-to-r from-[#b07cff] to-[#9657f0] hover:from-[#9657f0] hover:to-[#8440e5] text-white rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#b07cff]/20 flex items-center justify-center"
          >
            <Key className="mr-3 h-5 w-5" />
            ONCHAIN MODE
          </Button>
        </div>

        <div className="mt-8 text-xs text-gray-400">
          Select a mode to continue
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-10 opacity-10 rotate-12 transform scale-75 pointer-events-none">
        <div className="w-32 h-20 bg-white rounded-md"></div>
      </div>
      <div className="absolute top-20 right-10 opacity-10 -rotate-12 transform scale-75 pointer-events-none">
        <div className="w-32 h-20 bg-white rounded-md"></div>
      </div>
    </div>
  );
};

export default ModeSelection;
