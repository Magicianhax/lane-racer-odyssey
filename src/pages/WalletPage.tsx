
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { UsernameModal } from '@/components/UsernameModal';
import { WalletInfoPanel } from '@/components/WalletInfoPanel';
import { WithdrawModal } from '@/components/WithdrawModal';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const WalletPage: React.FC = () => {
  const { isConnected, username, wallet, refreshBalance } = useWeb3();
  const [showUserModal, setShowUserModal] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!isConnected) {
      setShowUserModal(true);
    }
  }, [isConnected]);
  
  const handleSetupComplete = () => {
    setShowUserModal(false);
  };
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] p-4">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 left-4"
        onClick={handleGoBack}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gradient">Wallet Management</h1>
        
        <div className={`glassmorphism rounded-xl border border-[#91d3d1]/20 p-6 mb-4 ${showUserModal ? 'min-h-[400px]' : ''}`}>
          <div className="bg-noise absolute inset-0 opacity-5 pointer-events-none" />
          
          {showUserModal ? (
            <UsernameModal onComplete={handleSetupComplete} />
          ) : (
            <WalletInfoPanel wallet={wallet} refreshBalance={refreshBalance} />
          )}
        </div>
      </div>
      
      {!showUserModal && (
        <div className="max-w-md w-full mx-auto">
          <Button
            variant="teal"
            className="w-full mb-4"
            onClick={() => setWithdrawModalOpen(true)}
          >
            Withdraw ETH
          </Button>
          
          <WithdrawModal 
            isOpen={withdrawModalOpen} 
            onOpenChange={setWithdrawModalOpen} 
          />
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-2">
              Running on Sepolia Testnet
            </p>
            <a 
              href="https://sepolia-faucet.pk910.de/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-[#91d3d1] flex items-center justify-center"
            >
              Need testnet ETH? Get from faucet
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
