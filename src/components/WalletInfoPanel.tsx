
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Wallet } from 'lucide-react';
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
    <div className="absolute top-4 right-4 z-10">
      <div className="glassmorphism px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs">
        <Wallet className="h-3 w-3 text-[#91d3d1]" />
        <span className="text-white">{shortenAddress(wallet.address)}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyAddress}
          className="h-5 w-5 p-0 hover:bg-black/20"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
