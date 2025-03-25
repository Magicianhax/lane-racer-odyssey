
import React from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Rocket, Loader2, X } from 'lucide-react';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const { createUserWallet, isLoading, error } = useWeb3();

  const handleContinue = async () => {
    await createUserWallet();
    onComplete();
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
        Get your blockchain wallet created automatically.
        <br />Your scores will be saved to the blockchain.
      </p>

      <div className="space-y-4">
        {error && (
          <div className="text-red-400 text-sm py-2 px-3 bg-red-400/10 rounded-md">
            {error}
          </div>
        )}

        <Button 
          onClick={handleContinue} 
          className="w-full bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
          disabled={isLoading}
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
          <br />This wallet is for game use only and will need testnet ETH to submit scores.
          <br />You can export your private key later if needed.
        </div>
      </div>
    </div>
  );
};
