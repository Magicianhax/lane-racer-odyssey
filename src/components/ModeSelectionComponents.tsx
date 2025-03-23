import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Globe, Blocks, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Game Mode Selection Interface
export enum GameMode {
  ONLINE = 'online',
  ONCHAIN = 'onchain',
  NONE = 'none'
}

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
}> = ({ onSelectMode, className }) => {
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in", className)}>
      <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <h1 className="text-4xl font-bold mb-10 tracking-tight text-white text-gradient">SELECT GAME MODE</h1>
        
        <div className="flex flex-col space-y-6 items-center">
          <Button 
            onClick={() => onSelectMode(GameMode.ONLINE)}
            className="game-button w-full bg-gradient-to-r from-[#5d7bf3] to-[#4c62d3] hover:from-[#4c62d3] hover:to-[#394db6] text-white rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#4c62d3]/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSI+PC9jaXJjbGU+PC9zdmc+')] bg-repeat opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <Globe className="mr-3 h-5 w-5" />
            ONLINE MODE
          </Button>
          
          <Button 
            onClick={() => onSelectMode(GameMode.ONCHAIN)}
            className="game-button w-full bg-gradient-to-r from-[#f7931a] to-[#e6a338] hover:from-[#e6a338] hover:to-[#d18a1f] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#f7931a]/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMiIgcng9IjUiIGZpbGw9Im5vbmUiPjwvcmVjdD48L3N2Zz4=')] bg-repeat opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <Blocks className="mr-3 h-5 w-5" />
            ONCHAIN MODE
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-[#91d3d1]/70">
          <p className="mb-2">• Online Mode: Play and compete on global leaderboards</p>
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

// Username Creation Screen Component
export const UsernameCreationScreen: React.FC<{
  onSubmit: (username: string) => void;
  onBack: () => void;
  className?: string;
  mode: GameMode;
}> = ({ onSubmit, onBack, className, mode }) => {
  const [username, setUsername] = useState('');
  const [validation, setValidation] = useState<UsernameValidationResult>({ isValid: false });
  const [isChecking, setIsChecking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Validate on username change
  useEffect(() => {
    if (username.length === 0) {
      setValidation({ isValid: false });
      return;
    }
    
    const result = validateUsername(username);
    setValidation(result);
  }, [username]);
  
  const handleSubmit = () => {
    if (!validation.isValid) return;
    
    setIsChecking(true);
    
    // Simulate checking for unique username
    setTimeout(() => {
      setIsChecking(false);
      onSubmit(username);
    }, 800);
  };
  
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in", className)}>
      <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full w-8 h-8"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-white text-gradient flex-1 text-center pr-8">CREATE USERNAME</h1>
        </div>
        
        <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-6 inline-block">
          {mode === GameMode.ONLINE ? 'ONLINE MODE' : 'ONCHAIN MODE'}
        </div>
        
        <div className="flex flex-col space-y-6 items-center">
          <div className="w-full relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter username (3-16 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={cn(
                "h-12 px-4 py-2 bg-background/20 border-[#91d3d1]/30 text-lg focus:border-[#91d3d1] transition-all",
                isFocused && "ring-1 ring-[#91d3d1]",
                validation.error && username.length > 0 && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30"
              )}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validation.isValid) {
                  handleSubmit();
                }
              }}
            />
            
            {username.length > 0 && (
              <div className="absolute right-3 top-3">
                {validation.isValid ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
            
            {validation.error && username.length > 0 && (
              <p className="text-xs text-red-400 mt-1 ml-1 text-left">
                {validation.error}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={!validation.isValid || isChecking}
            className={cn(
              "game-button w-full rounded-xl py-6 text-lg font-medium shadow-lg",
              validation.isValid 
                ? "bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 shadow-[#91d3d1]/20" 
                : "bg-[#91d3d1]/20 text-white/50 cursor-not-allowed"
            )}
          >
            {isChecking ? 'Checking...' : 'CONFIRM'}
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-[#91d3d1]/70">
          <p>Your username will be visible on leaderboards</p>
        </div>
      </div>
    </div>
  );
};