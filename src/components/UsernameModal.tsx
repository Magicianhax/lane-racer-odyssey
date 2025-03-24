import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { Rocket, Loader2 } from 'lucide-react';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const { createUserWallet, isLoading, error } = useWeb3();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await createUserWallet(username);
      onComplete();
    }
  };

  return (
    <div className="glassmorphism p-6 rounded-xl">
      <div className="text-center mb-4">
        <div className="inline-flex rounded-full bg-[#91d3d1]/20 p-3 mb-3">
          <Rocket className="h-6 w-6 text-[#91d3d1]" />
        </div>
        <h3 className="text-xl font-bold mb-1">Enter Onchain Mode</h3>
        <p className="text-sm text-gray-300">
          Your scores will be saved to the blockchain.
          <br />A secure wallet will be created for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full"
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
          className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
          disabled={isLoading || !username.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating wallet...
            </>
          ) : (
            'Create Wallet & Continue'
          )}
        </Button>

        <div className="text-xs text-center text-gray-400 mt-3">
          By continuing, you'll have a blockchain wallet created for your game profile.
          <br />You can export your private key later if needed.
        </div>
      </form>
    </div>
  );
};