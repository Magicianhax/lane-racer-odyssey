
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Wallet, ExternalLink, Copy, AlertTriangle, Key, X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export const WalletInfoPanel: React.FC = () => {
  const { wallet, username, isLoading, exportPrivateKey, isSubmittingScore, lastTxHash } = useWeb3();
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

  const handleCopyTxHash = () => {
    if (lastTxHash) {
      navigator.clipboard.writeText(lastTxHash);
      toast.success("Transaction hash copied to clipboard");
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const shortenTxHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
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
      
      {isSubmittingScore && (
        <div className="bg-[#91d3d1]/10 p-3 rounded-lg mb-3 border border-[#91d3d1]/20">
          <div className="flex items-center text-sm text-white mb-2">
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#91d3d1]" />
            <span>Submitting score to blockchain...</span>
          </div>
          {lastTxHash && (
            <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
              <span className="text-xs text-gray-400">Transaction:</span>
              <div className="flex items-center">
                <span className="truncate">{shortenTxHash(lastTxHash)}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1"
                  onClick={handleCopyTxHash}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          <Progress value={50} className="h-1 bg-black/20" />
        </div>
      )}
      
      {lastTxHash && !isSubmittingScore && (
        <div className="bg-[#91d3d1]/10 p-3 rounded-lg mb-3 border border-[#91d3d1]/20">
          <div className="flex items-center text-sm text-white mb-1">
            <Check className="h-4 w-4 mr-2 text-[#91d3d1]" />
            <span>Score submitted successfully</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="truncate">{shortenTxHash(lastTxHash)}</span>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleCopyTxHash}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => window.open(`https://sepolia-explorer.superseed.xyz/tx/${lastTxHash}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 text-[#91d3d1]" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showPrivateKey ? (
        <div className="space-y-2">
          <div className="bg-red-500/20 p-3 rounded-lg border border-red-500/30">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm text-red-400 font-medium">PRIVATE KEY</div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopyPrivateKey}
                className="h-6 w-6"
              >
                <Copy className="h-3 w-3 text-red-300" />
              </Button>
            </div>
            <div className="font-mono text-sm break-all overflow-hidden text-white">
              {privateKeyVisible 
                ? exportPrivateKey() 
                : (exportPrivateKey() ? shortenPrivateKey(exportPrivateKey()!) : '')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
              className="text-xs w-full mt-1 text-red-300 hover:text-red-200 hover:bg-red-900/20"
            >
              {privateKeyVisible ? 'Hide' : 'Show'} Full Key
            </Button>
          </div>
          <div className="text-xs text-red-400 p-2">
            <p>Warning: Never share your private key with anyone!</p>
            <p>Keep a copy of this key to access your wallet.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrivateKey(false)}
            className="w-full text-white border-none bg-zinc-800/50 hover:bg-zinc-700/50"
          >
            Hide Private Key
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrivateKey(true)}
            className="flex items-center justify-center text-white border-none bg-zinc-800/50 hover:bg-zinc-700/50"
          >
            <Key className="h-3 w-3 mr-1" />
            Export Private Key
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-[#91d3d1] hover:text-white"
            onClick={() => window.open(`https://sepolia-explorer.superseed.xyz/address/${wallet.address}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on SuperSeed Explorer
          </Button>
        </div>
      )}
      
      <div className="mt-4 text-xs text-center text-zinc-400">
        <p className="mb-1">Note: This wallet is for game use only.</p>
        <p>You'll need testnet ETH to submit scores to the blockchain.</p>
      </div>
    </div>
  );
};
