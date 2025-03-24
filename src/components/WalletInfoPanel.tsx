
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Wallet, ExternalLink, Copy, AlertTriangle, Key, X } from 'lucide-react';
import { toast } from 'sonner';

export const WalletInfoPanel: React.FC = () => {
  const { wallet, username, isLoading, exportPrivateKey } = useWeb3();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied to clipboard");
    }
  };

  const handleCopyPrivateKey = () => {
    const privateKey = exportPrivateKey();
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      toast.success("Private key copied to clipboard");
      toast.warning("Never share your private key with anyone!");
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const shortenPrivateKey = (key: string) => {
    return `${key.substring(0, 10)}...${key.substring(key.length - 8)}`;
  };

  return (
    <div className="glassmorphism p-4 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="bg-[#91d3d1]/20 rounded-full p-2 mr-2">
            <Wallet className="h-4 w-4 text-[#91d3d1]" />
          </div>
          <div>
            <div className="font-medium text-white">Player: {username}</div>
            <div className="text-xs text-gray-400">Onchain Mode Active</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center mb-3 bg-black/20 p-2 rounded-lg">
        <div className="flex-1 truncate text-sm text-white">
          {wallet.address && shortenAddress(wallet.address)}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyAddress}
          className="h-7 w-7"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="bg-black/20 p-3 rounded-lg mb-3">
        <div className="text-xs text-gray-400 mb-1">Balance</div>
        <div className="font-mono text-white">{wallet.balance || '0'} ETH</div>
        {Number(wallet.balance || 0) === 0 && (
          <div className="text-xs text-yellow-400 flex items-center mt-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            This wallet needs testnet ETH to submit scores
          </div>
        )}
      </div>
      
      {showPrivateKey ? (
        <div className="space-y-2">
          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-red-400 font-medium">PRIVATE KEY</div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopyPrivateKey}
                className="h-6 w-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="font-mono text-xs break-all overflow-hidden text-white">
              {privateKeyVisible 
                ? exportPrivateKey() 
                : (exportPrivateKey() ? shortenPrivateKey(exportPrivateKey()!) : '')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
              className="text-xs w-full mt-1"
            >
              {privateKeyVisible ? 'Hide' : 'Show'} Full Key
            </Button>
          </div>
          <div className="text-xs text-red-400 p-2">
            <p>Warning: Never share your private key with anyone!</p>
            <p>Keep a copy of this key to access your wallet.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivateKey(false)}
            className="w-full"
          >
            Hide Private Key
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivateKey(true)}
            className="flex items-center justify-center"
          >
            <Key className="h-3 w-3 mr-1" />
            Export Private Key
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => window.open(`https://sepolia.etherscan.io/address/${wallet.address}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on Etherscan
          </Button>
        </div>
      )}
    </div>
  );
};
