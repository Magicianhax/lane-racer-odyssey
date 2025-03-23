
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, User } from 'lucide-react';
import { GameMode } from './ModeSelection';

interface UsernameInputProps {
  onConfirm: (username: string) => void;
  onBack: () => void;
  selectedMode: GameMode;
}

const UsernameInput: React.FC<UsernameInputProps> = ({
  onConfirm,
  onBack,
  selectedMode
}) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    if (username.length > 15) {
      setError('Username must be less than 15 characters');
      return;
    }
    
    onConfirm(username);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] p-6">
      <div className="glassmorphism rounded-3xl p-8 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20 w-full">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-4xl font-bold mb-2 tracking-tight text-white text-gradient">Create Username</h1>
        <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-6 inline-block">
          {selectedMode === 'online' ? 'ONLINE MODE' : 'ONCHAIN MODE'}
        </div>

        <div className="text-gray-300 mb-6">
          Your username will appear on the leaderboard
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="pl-10 py-6 text-lg bg-black/30 border-[#91d3d1]/30 rounded-xl focus:border-[#91d3d1] focus:ring-[#91d3d1]/20"
              maxLength={15}
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20 flex items-center justify-center"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            CONFIRM
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UsernameInput;
