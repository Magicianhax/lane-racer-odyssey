
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

type WalletInfoPanelProps = {
  wallet: {
    address: string | null;
    balance: string | null;
    privateKey: string | null;
  };
  refreshBalance: () => Promise<void>;
  onWithdraw?: () => void;
};

export const WalletInfoPanel: React.FC<WalletInfoPanelProps> = ({
  wallet,
  refreshBalance,
  onWithdraw
}) => {
  const shortenAddress = (address: string) => {
    return `0x${address.substring(2, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied to clipboard");
    }
  };

  if (!wallet.address) return null;

  return (
    <div className="space-y-4">
      {/* Wallet Address */}
      <div className="bg-gray-800/70 p-3 rounded-lg flex items-center justify-between">
        <span className="text-gray-200">{shortenAddress(wallet.address)}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyAddress}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Balance */}
      <div className="bg-gray-800/70 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-sm">Balance</span>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refreshBalance()}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onWithdraw}
              className="h-6 px-2 py-0 text-[#91d3d1] hover:text-[#7ec7c5] text-xs flex items-center"
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
              Withdraw
            </Button>
          </div>
        </div>
        
        <div className="font-mono text-white text-sm">
          {wallet.balance || '0'} ETH
        </div>
      </div>
    </div>
  );
};
