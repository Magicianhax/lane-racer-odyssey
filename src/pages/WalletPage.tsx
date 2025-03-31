
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { UsernameModal } from '@/components/UsernameModal';
import { WalletInfoPanel } from '@/components/WalletInfoPanel';
import { WithdrawModal } from '@/components/WithdrawModal';
import { ArrowLeft, ExternalLink, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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
  
  const WalletContent = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] p-4 relative">
      {/* Back button inside the frame */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleGoBack}
          className="text-gray-300 hover:text-white flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-sm">Back</span>
        </Button>
      </div>
      
      <div className="max-w-md w-full mx-auto mt-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-gradient">Wallet</h1>
        
        <div className={`glassmorphism rounded-xl border border-[#91d3d1]/20 p-6 mb-4 ${showUserModal ? 'min-h-[380px]' : ''}`}>
          <div className="bg-noise absolute inset-0 opacity-5 pointer-events-none" />
          
          {showUserModal ? (
            <UsernameModal onComplete={handleSetupComplete} />
          ) : (
            <>
              <div className="flex items-center mb-4">
                <div className="bg-[#2a3a4a] rounded-full p-2 mr-3">
                  <span className="text-[#91d3d1] text-xl">🎮</span>
                </div>
                <div>
                  <div className="text-white font-medium">Player: {username}</div>
                  <div className="text-gray-400 text-xs">Onchain Mode Active</div>
                </div>
              </div>
              
              <WalletInfoPanel 
                wallet={wallet} 
                refreshBalance={refreshBalance}
                onWithdraw={() => setWithdrawModalOpen(true)}
              />
              
              <Button
                variant="outline"
                className="w-full mt-4 bg-gray-800/50 border-gray-700 text-gray-200 hover:bg-gray-700/50"
                onClick={() => {
                  if (wallet.privateKey) {
                    navigator.clipboard.writeText(wallet.privateKey);
                    toast.success("Private key copied to clipboard");
                  }
                }}
              >
                <span className="mr-2">🔐</span> Export Private Key
              </Button>
              
              <a 
                href={`https://sepolia-explorer.superseed.xyz/address/${wallet.address}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center mt-4 text-[#91d3d1] text-sm hover:underline"
              >
                <ExternalLink className="h-4 w-4 mr-1" /> View on SuperSeed Explorer
              </a>
              
              <div className="mt-6 text-center text-gray-400 text-xs">
                <p className="mb-1">Note: This wallet is for game use only.</p>
                <p>You'll need testnet ETH to submit scores to the blockchain.</p>
              </div>
              
              <WithdrawModal 
                isOpen={withdrawModalOpen} 
                onOpenChange={setWithdrawModalOpen} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
        {isMobile ? (
          <div className="w-full h-full">
            <WalletContent />
          </div>
        ) : (
          <div className="mobile-frame-container flex flex-col items-center justify-center">
            <div className="mobile-frame shadow-[0_0_40px_5px_rgba(255,255,255,0.15)]">
              <div className="notch"></div>
              <div className="side-button left-button"></div>
              <div className="side-button right-button-top"></div>
              <div className="side-button right-button-bottom"></div>
              <div className="mobile-screen flex items-center justify-center">
                <WalletContent />
              </div>
              <div className="home-indicator"></div>
            </div>
            <div className="mt-6 flex items-center justify-center text-[#91d3d1]/70 text-sm">
              <Smartphone className="w-4 h-4 mr-2" />
              <span>SuperSeed Wallet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
