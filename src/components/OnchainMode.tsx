
import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { UsernameModal } from './UsernameModal';
import { WalletInfoPanel } from './WalletInfoPanel';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export const OnchainMode: React.FC = () => {
  const { isConnected, username } = useWeb3();
  const [showUserModal, setShowUserModal] = useState(false);

  const handleSetupComplete = () => {
    setShowUserModal(false);
  };

  const handleOpenModal = () => {
    setShowUserModal(true);
  };

  // If the modal is open, show it
  if (showUserModal) {
    return <UsernameModal onComplete={handleSetupComplete} />;
  }

  // If already connected, show wallet info panel when clicked
  if (isConnected) {
    return (
      <Button 
        onClick={handleOpenModal}
        className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white rounded-xl py-6 text-lg font-medium shadow-lg shadow-blue-500/20 mb-4"
      >
        <Rocket className="mr-2 h-5 w-5" />
        Onchain Mode (Active)
      </Button>
    );
  }

  // If not connected, show a button to enter onchain mode
  return (
    <Button 
      onClick={handleOpenModal}
      className="w-full bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl py-6 text-lg font-medium shadow-lg mb-4"
    >
      <Rocket className="mr-2 h-5 w-5" />
      Enter Onchain Mode
    </Button>
  );
};
