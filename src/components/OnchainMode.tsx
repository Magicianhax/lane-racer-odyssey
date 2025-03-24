
import React from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OnchainMode: React.FC = () => {
  const { isConnected } = useWeb3();
  const navigate = useNavigate();

  const handleOpenWallet = () => {
    navigate('/wallet');
  };

  // If already connected, show active wallet button
  if (isConnected) {
    return (
      <Button 
        onClick={handleOpenWallet}
        className="w-full bg-gradient-to-r from-[#f7931a] to-[#e6a338] hover:from-[#e6a338] hover:to-[#d18a1f] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#f7931a]/20 mb-4"
      >
        <Wallet className="mr-2 h-5 w-5" />
        Wallet (Active)
      </Button>
    );
  }

  // If not connected, show a button to open wallet page
  return (
    <Button 
      onClick={handleOpenWallet}
      className="w-full bg-gradient-to-r from-[#f7931a] to-[#e6a338] hover:from-[#e6a338] hover:to-[#d18a1f] text-zinc-900 rounded-xl py-6 text-lg font-medium shadow-lg shadow-[#f7931a]/20 mb-4 opacity-80"
    >
      <Wallet className="mr-2 h-5 w-5" />
      Setup Wallet
    </Button>
  );
};
