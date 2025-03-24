
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
        className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white rounded-xl py-6 text-lg font-medium shadow-lg shadow-blue-500/20 mb-4"
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
      className="w-full bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl py-6 text-lg font-medium shadow-lg mb-4"
    >
      <Wallet className="mr-2 h-5 w-5" />
      Wallet
    </Button>
  );
};
