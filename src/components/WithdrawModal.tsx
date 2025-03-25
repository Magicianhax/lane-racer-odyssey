
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface WithdrawModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WithdrawFormValues {
  address: string;
  amount: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  const { withdrawEth, wallet, isWithdrawing } = useWeb3();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<WithdrawFormValues>({
    defaultValues: {
      address: '',
      amount: ''
    }
  });

  const handleSubmit = async (values: WithdrawFormValues) => {
    setError(null);
    
    if (!values.address.trim()) {
      setError("Destination address is required");
      return;
    }
    
    if (!values.amount.trim()) {
      setError("Amount is required");
      return;
    }
    
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    
    const walletBalance = parseFloat(wallet.balance || '0');
    if (amount > walletBalance) {
      setError(`Amount exceeds available balance (${walletBalance} ETH)`);
      return;
    }
    
    try {
      await withdrawEth(values.address, values.amount);
      form.reset();
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-zinc-300">
                    Destination Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setError(null);
                      }}
                      className="bg-zinc-800 border-zinc-700 placeholder:text-zinc-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-sm text-zinc-300">
                      Amount (ETH)
                    </FormLabel>
                    {wallet.balance && (
                      <span className="text-xs text-zinc-400">
                        Available: {wallet.balance} ETH
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.01"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setError(null);
                      }}
                      className="bg-zinc-800 border-zinc-700 placeholder:text-zinc-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {error && (
              <div className="flex items-center text-red-400 text-xs gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
            
            <p className="text-xs text-zinc-500 mt-1">
              Note: Gas fees will be deducted from your balance.
            </p>
            
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
                disabled={isWithdrawing}
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
