
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { Rocket, Loader2, X } from 'lucide-react';
import { validateUsername } from '@/components/ModeSelectionComponents';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const { createUserWallet, isLoading, error } = useWeb3();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Only validate if there's input
    if (value.trim()) {
      const validation = validateUsername(value);
      setValidationError(validation.isValid ? null : validation.error);
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only proceed if username is valid
    if (username.trim() && !validationError) {
      // Save username to localStorage first to avoid duplicate prompts
      localStorage.setItem('username', username);
      
      await createUserWallet(username);
      onComplete();
    }
  };

  return (
    <div className="p-4 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <div className="inline-flex rounded-full bg-[#91d3d1]/20 p-2">
          <Rocket className="h-5 w-5 text-[#91d3d1]" />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onComplete}
          className="h-6 w-6 rounded-full"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <h3 className="text-lg font-bold mb-1">Choose Username</h3>
      <p className="text-xs text-gray-300 mb-3">
        Select a username to create your blockchain wallet.
        Your scores will be saved to the blockchain.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="username" className="block text-xs font-medium mb-1 text-white">
            Username
          </label>
          <Input
            id="username"
            value={username}
            onChange={handleInputChange}
            placeholder="Enter username (3-16 chars)"
            className="w-full bg-black/30 border-zinc-700 text-white text-sm h-9"
            required
            disabled={isLoading}
          />
          {validationError && (
            <p className="text-xs text-red-400 mt-1 ml-1">
              {validationError}
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-xs py-2 px-3 bg-red-400/10 rounded-md">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 text-sm py-1 h-9"
          disabled={isLoading || !username.trim() || !!validationError}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Creating wallet...
            </>
          ) : (
            'Create Wallet & Continue'
          )}
        </Button>

        <div className="text-xs text-center text-gray-400 mt-2">
          By continuing, you'll have a blockchain wallet created for your game profile.
          This wallet is for game use only.
        </div>
      </form>
    </div>
  );
};
