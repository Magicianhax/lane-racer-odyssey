
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { Rocket, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { validateUsername } from '@/components/ModeSelectionComponents';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const { createUserWallet, isLoading, error, registerUsername, checkUsernameAvailable } = useWeb3();
  const [validationError, setValidationError] = useState<string | null>(null);

  // Debounce timer for username availability check
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setIsAvailable(null);
    
    // Reset any existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Only validate if there's input
    if (value.trim()) {
      const validation = validateUsername(value);
      setValidationError(validation.isValid ? null : validation.error);
      
      // If local validation passes, check blockchain availability after a delay
      if (validation.isValid) {
        // Set a debounce timer to avoid too many blockchain calls
        const timer = setTimeout(() => {
          checkAvailability(value);
        }, 500);
        
        setDebounceTimer(timer as any);
      }
    } else {
      setValidationError(null);
    }
  };

  const checkAvailability = async (name: string) => {
    setIsChecking(true);
    try {
      const available = await checkUsernameAvailable(name);
      setIsAvailable(available);
      if (!available) {
        setValidationError("Username already taken on the blockchain");
      }
    } catch (err) {
      console.error("Failed to check username availability:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only proceed if username is valid and available
    if (username.trim() && !validationError && isAvailable) {
      try {
        // Register username on blockchain first
        await registerUsername(username);
        
        // Save username to localStorage
        localStorage.setItem('username', username);
        
        // Create wallet with this username
        await createUserWallet(username);
        
        onComplete();
      } catch (error) {
        console.error("Error setting up wallet:", error);
      }
    }
  };

  return (
    <div className="glassmorphism p-6 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <div className="inline-flex rounded-full bg-[#91d3d1]/20 p-3">
          <Rocket className="h-6 w-6 text-[#91d3d1]" />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onComplete}
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <h3 className="text-xl font-bold mb-1">Enter Onchain Mode</h3>
      <p className="text-sm text-gray-300 mb-4">
        Choose a unique username for the blockchain.
        <br/>Your scores and username will be saved permanently.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 text-white">
            Username
          </label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={handleInputChange}
              placeholder="Enter your username (3-16 characters)"
              className="w-full bg-black/30 border-zinc-700 text-white pr-10"
              required
              disabled={isLoading}
            />
            {isChecking && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-[#91d3d1]" />
              </div>
            )}
            {!isChecking && isAvailable === true && username.trim() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
            )}
            {!isChecking && isAvailable === false && username.trim() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
            )}
          </div>
          {validationError && (
            <p className="text-xs text-red-400 mt-1 ml-1">
              {validationError}
            </p>
          )}
          {isAvailable === true && username.trim() && !validationError && (
            <p className="text-xs text-green-400 mt-1 ml-1">
              Username is available!
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm py-2 px-3 bg-red-400/10 rounded-md">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
          disabled={isLoading || !username.trim() || !!validationError || isAvailable !== true}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating wallet...
            </>
          ) : (
            'Register Username & Create Wallet'
          )}
        </Button>

        <div className="text-xs text-center text-gray-400 mt-3">
          By continuing, you'll have a blockchain wallet created for your game profile.
          <br />Your username will be publicly registered on the blockchain.
        </div>
      </form>
    </div>
  );
};
