
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  const { withdrawEth, wallet, isWithdrawing } = useWeb3();
  const [destinationAddress, setDestinationAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destinationAddress.trim()) {
      setError("Destination address is required");
      return;
    }
    
    try {
      await withdrawEth(destinationAddress);
      setDestinationAddress('');
      setError(null);
      onOpenChange(false);
    } catch (err) {
      console.error("Error in withdrawal:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-gradient">Withdraw ETH</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Transfer your testnet ETH to another wallet address.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="address" className="text-sm text-zinc-300">
                Destination Address
              </label>
              {wallet.balance && (
                <span className="text-xs text-zinc-400">
                  Available: {wallet.balance} ETH
                </span>
              )}
            </div>
            
            <Input
              id="address"
              placeholder="0x..."
              value={destinationAddress}
              onChange={(e) => {
                setDestinationAddress(e.target.value);
                setError(null);
              }}
              className="bg-zinc-800 border-zinc-700 placeholder:text-zinc-500"
            />
            
            {error && (
              <div className="flex items-center text-red-400 text-xs gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
            
            <p className="text-xs text-zinc-500 mt-1">
              Note: Gas fees will be deducted from your balance. The maximum possible amount will be transferred.
            </p>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              disabled={isWithdrawing}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="teal"
              className="gap-1"
              disabled={!destinationAddress.trim() || isWithdrawing}
            >
              {isWithdrawing ? 'Processing...' : 'Withdraw'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
