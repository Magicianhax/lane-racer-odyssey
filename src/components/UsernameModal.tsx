
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { Rocket, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const { createUserWallet, isLoading, error } = useWeb3();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await createUserWallet(username);
      onComplete();
    }
  };

  return (
    <div className="glassmorphism p-6 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <div className="inline-flex rounded-full bg-[#91d3d1]/20 p-3">
          <Rocket className="h-6 w-6 text-[#91d3d1]" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-1">Welcome to Superseed Runner</h3>
      <p className="text-sm text-gray-300 mb-4">
        Create your player profile to get started.
        <br />A secure blockchain wallet will be created for you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 text-white">
            Player Name
          </label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your player name"
            className="w-full bg-black/30 border-zinc-700 text-white"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm py-2 px-3 bg-red-400/10 rounded-md">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-3 font-medium"
          disabled={isLoading || !username.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating profile...
            </>
          ) : (
            'Create Player Profile'
          )}
        </Button>

        <div className="text-xs text-center text-gray-400 mt-3">
          By continuing, a blockchain wallet will be created for your game profile.
          <br />This allows you to save your scores securely on the blockchain.
        </div>
      </form>
    </div>
  );
};
