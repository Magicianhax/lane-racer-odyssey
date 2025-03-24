
import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { UsernameModal } from '@/components/UsernameModal';
import { WalletInfoPanel } from '@/components/WalletInfoPanel';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const WalletPage: React.FC = () => {
  const { isConnected } = useWeb3();
  const [showUserModal, setShowUserModal] = useState(!isConnected);
  const navigate = useNavigate();

  const handleSetupComplete = () => {
    setShowUserModal(false);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 text-gray-300 hover:text-white" 
          onClick={handleBackToHome}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Wallet</h1>
          
          {showUserModal ? (
            <UsernameModal onComplete={handleSetupComplete} />
          ) : (
            <WalletInfoPanel />
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
