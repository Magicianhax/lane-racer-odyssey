
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Wallet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type WalletInfoPanelProps = {
  wallet: {
    address: string | null;
    balance: string | null;
    privateKey: string | null;
  };
  refreshBalance: () => Promise<void>;
};

export const WalletInfoPanel: React.FC<WalletInfoPanelProps> = ({
  wallet,
  refreshBalance
}) => {
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied to clipboard");
    }
  };

  if (!wallet.address) return null;

  return (
    <div className="bg-black/20 p-3 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="bg-[#91d3d1]/20 rounded-full p-1 mr-2">
            <Wallet className="h-3 w-3 text-[#91d3d1]" />
          </div>
          <div className="text-sm text-white">Wallet</div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => refreshBalance()}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-2 text-xs bg-black/20 p-2 rounded-lg">
        <span className="truncate text-white">{shortenAddress(wallet.address)}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyAddress}
          className="h-6 w-6"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">Balance:</span>
        <span className="font-mono text-sm text-white">{wallet.balance || '0'} ETH</span>
      </div>
    </div>
  );
};
