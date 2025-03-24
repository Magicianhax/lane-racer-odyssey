
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Blocks, AlertCircle, Check, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/game/GameEngine';

// Username validation options
export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate username
export const validateUsername = (username: string): UsernameValidationResult => {
  // Check length
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 16) {
    return { isValid: false, error: 'Username must be at most 16 characters' };
  }
  
  // Check for valid characters (letters, numbers, underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  // Basic inappropriate word filter - this is very simplistic
  const inappropriateWords = ['admin', 'moderator', 'mod', 'staff'];
  const lowercaseName = username.toLowerCase();
  
  if (inappropriateWords.some(word => lowercaseName.includes(word))) {
    return { isValid: false, error: 'Please choose a different username' };
  }
  
  return { isValid: true };
};

// Mode Selection Screen Component
export const ModeSelectionScreen: React.FC<{
  onSelectMode: (mode: GameMode) => void;
  className?: string;
  currentMode?: GameMode;
  currentUsername?: string;
  onContinue?: () => void; // New prop for returning to game
}> = ({ onSelectMode, className, currentMode, currentUsername, onContinue }) => {
  // Check if we have a returning user
  const isReturningUser = !!currentUsername;
  
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in", className)}>
      <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <h1 className="text-4xl font-bold mb-6 tracking-tight text-white text-gradient">GAME MODE</h1>
        
        {/* Show current username if it exists */}
        {isReturningUser && (
          <div className="mb-6 p-3 rounded-xl bg-[#91d3d1]/10 flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-[#91d3d1]" />
              <span className="text-white/80">Playing as <span className="text-white font-medium">{currentUsername}</span></span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full p-0 hover:bg-[#91d3d1]/10"
              onClick={() => {
                // Clear username from localStorage and reload
                localStorage.removeItem('username');
                localStorage.removeItem('gameUserData');
                window.location.reload();
              }}
            >
              <X className="h-4 w-4 text-[#91d3d1]/70" />
            </Button>
          </div>
        )}
        
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
            {currentMode === GameMode.ONCHAIN && isReturningUser && (
              <span className="absolute top-0 right-0 bg-[#f7931a] px-2 py-1 text-xs rounded-bl-md rounded-tr-md">CURRENT</span>
            )}
          </Button>
          
          {/* Add a Continue button for returning users */}
          {isReturningUser && onContinue && (
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
