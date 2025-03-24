import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { UsernameModal } from './UsernameModal';
import { WalletInfoPanel } from './WalletInfoPanel';

export const OnchainMode: React.FC = () => {
  const { isConnected, username } = useWeb3();
  const [showUserModal, setShowUserModal] = useState(!isConnected);

  const handleSetupComplete = () => {
    setShowUserModal(false);
  };

  if (showUserModal) {
    return <UsernameModal onComplete={handleSetupComplete} />;
  }

  return <WalletInfoPanel />;
};