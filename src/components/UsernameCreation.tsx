
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { GameMode } from './ModeSelection';

interface UsernameCreationProps {
  selectedMode: GameMode;
  onConfirm: (username: string) => void;
  onBack: () => void;
}

const UsernameCreation: React.FC<UsernameCreationProps> = ({ selectedMode, onConfirm, onBack }) => {
  const [username, setUsername] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  const validateUsername = (value: string): boolean => {
    // Only allow letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    // Check length
    if (value.length < 3 || value.length > 16) {
      toast.error('Username must be between 3 and 16 characters');
      return false;
    }
    
    // Basic filter for offensive words
    const offensiveWords = ['offensive', 'banned', 'inappropriate']; // Replace with actual list
    if (offensiveWords.some(word => value.toLowerCase().includes(word))) {
      toast.error('Username contains inappropriate content');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = () => {
    if (!username) {
      toast.error('Please enter a username');
      return;
    }
    
    setIsValidating(true);
    
    if (validateUsername(username)) {
      // In a real implementation, we'd check against a database here
      // For now, we'll just simulate a check
      setTimeout(() => {
        const isUnique = Math.random() > 0.2; // 80% chance of success for demo
        
        if (isUnique) {
          toast.success('Username created successfully!');
          onConfirm(username);
        } else {
          toast.error('Username already taken');
        }
        
        setIsValidating(false);
      }, 800);
    } else {
      setIsValidating(false);
    }
  };
  
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] backdrop-blur-sm transition-all duration-500 animate-fade-in">
      <div className="glassmorphism rounded-3xl p-8 mb-10 max-w-md mx-auto text-center shadow-xl animate-scale-in border border-[#91d3d1]/20">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="teal-outline" 
            size="icon" 
            className="rounded-full"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-white">CREATE USERNAME</h2>
          <div className="w-9"></div>
        </div>
        
        <div className="chip text-xs bg-[#91d3d1]/10 text-[#91d3d1] px-3 py-1 rounded-full mb-6 inline-block">
          {selectedMode === 'online' ? 'ONLINE MODE' : 'ONCHAIN MODE'}
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (3-16 characters)"
              className="bg-black/20 border-[#91d3d1]/30 focus-visible:ring-[#91d3d1]/50 text-white text-center py-6 text-lg"
              maxLength={16}
              disabled={isValidating}
            />
            <p className="text-xs text-gray-400">Letters, numbers, and underscores only</p>
          </div>
          
          <Button 
            onClick={handleSubmit}
            className="game-button w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#91d3d1]/20"
            disabled={isValidating}
          >
            {isValidating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-b-2 border-zinc-900 rounded-full animate-spin"></div>
                <span>Checking...</span>
              </div>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                CONFIRM
              </>
            )}
          </Button>
          
          <Button 
            onClick={onBack}
            variant="teal-outline"
            className="w-full rounded-xl py-4 font-medium"
            disabled={isValidating}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            BACK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsernameCreation;
