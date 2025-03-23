
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, User } from 'lucide-react';
import { GameMode } from './ModeSelection';

interface UsernameInputProps {
  selectedMode: GameMode;
  onUsernameSubmit: (username: string) => void;
  onBack: () => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ 
  selectedMode, 
  onUsernameSubmit, 
  onBack 
}) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.trim().length > 15) {
      setError('Username must be less than 15 characters');
      return;
    }
    
    setError(null);
    onUsernameSubmit(username.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-black/20"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <h1 className="text-2xl font-bold tracking-tight text-white">Set Username</h1>
        
        <div className="w-9"></div>
      </div>
      
      <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-6 inline-block">
        {selectedMode === 'online' ? 'ONLINE MODE' : 'ONCHAIN MODE'}
      </div>
      
      <div className="w-full max-w-md mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="bg-black/30 pl-10 border-gray-700 focus:border-[#91d3d1] text-lg py-6"
          />
        </div>
        
        {error && (
          <p className="text-red-400 mt-2 text-sm">{error}</p>
        )}
        
        <p className="text-gray-400 mt-2 text-sm">
          This username will be used on the leaderboard
        </p>
      </div>
      
      <Button 
        onClick={handleSubmit}
        className="game-button w-full max-w-md bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
      >
        <CheckCircle className="mr-2 h-5 w-5" />
        Confirm Username
      </Button>
    </div>
  );
};

export default UsernameInput;
