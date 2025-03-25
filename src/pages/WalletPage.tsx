
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { UsernameModal } from '@/components/UsernameModal';
import { WalletInfoPanel } from '@/components/WalletInfoPanel';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const WalletPage: React.FC = () => {
  const { isConnected } = useWeb3();
  const [showUserModal, setShowUserModal] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only show the modal if the user is not connected
    setShowUserModal(!isConnected);
  }, [isConnected]);

  const handleSetupComplete = () => {
    setShowUserModal(false);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const renderContent = () => (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 text-white hover:text-white hover:bg-zinc-800/50" 
        onClick={handleBackToHome}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-gradient">Wallet</h1>
        
        {showUserModal ? (
          <UsernameModal onComplete={handleSetupComplete} />
        ) : (
          <WalletInfoPanel />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      
      {isMobile ? (
        renderContent()
      ) : (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
          <div className="mobile-frame-container">
            <div className="mobile-frame">
              <div className="notch"></div>
              <div className="side-button left-button"></div>
              <div className="side-button right-button-top"></div>
              <div className="side-button right-button-bottom"></div>
              <div className="mobile-screen">
                {renderContent()}
              </div>
              <div className="home-indicator"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
