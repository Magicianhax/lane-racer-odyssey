
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Rocket, Wallet, User, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OnchainOnboarding } from './OnchainOnboarding';

interface OnchainModeProps {
  gameMode: 'normal' | 'onchain';
  onSelectOnchainMode: () => void;
}

export const OnchainMode: React.FC<OnchainModeProps> = ({ gameMode, onSelectOnchainMode }) => {
  const { isConnected, username, wallet } = useWeb3();
  const navigate = useNavigate();
  
  // Add this state for username modal
  const [showUsernameModal, setShowUsernameModal] = useState<boolean>(false);

  const handleSelectOnchainMode = () => {
    onSelectOnchainMode();
  };

  const renderContent = () => {
    // Use the component's state to determine what to render
    if (gameMode === 'onchain') {
      if (!username && isConnected) {
        // If connected but no username, show username form
        return <OnchainOnboarding onComplete={() => setShowUsernameModal(false)} />;
      } else if (!isConnected) {
        // If not connected at all, show connect button
        return (
          <div className="flex flex-col space-y-4 w-full items-center">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-lg font-bold">Play On-Chain Mode</h3>
              <p className="text-sm text-gray-300">Register your scores permanently on the blockchain!</p>
            </div>
            
            <Button 
              onClick={() => setShowUsernameModal(true)}
              className="bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        );
      } else {
        // If already connected and has username, show the status
        return (
          <div className="flex flex-col space-y-4 w-full items-center">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Ready to Play!</h3>
              <p className="text-sm text-gray-300">Your wallet is connected and ready for on-chain play.</p>
            </div>
            
            <div className="bg-[#91d3d1]/10 rounded-lg p-3 w-full">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-[#91d3d1]" />
                  <span className="text-sm font-medium">{username}</span>
                </div>
                {wallet.balance && (
                  <span className="text-xs bg-[#91d3d1]/20 text-[#91d3d1] px-2 py-1 rounded-full">
                    {wallet.balance} ETH
                  </span>
                )}
              </div>
            </div>
            
            <Button 
              onClick={() => navigate('/wallet')} 
              variant="outline"
              className="text-[#91d3d1] border-[#91d3d1]/30"
              size="sm"
            >
              <Wallet className="mr-2 h-3 w-3" />
              Manage Wallet
            </Button>
          </div>
        );
      }
    } else {
      // If not in onchain mode at all, show the promo/description
      return (
        <div className="flex flex-col space-y-4 w-full items-center">
          <div className="text-center space-y-2 mb-4">
            <h3 className="text-lg font-bold">On-Chain Mode</h3>
            <p className="text-sm text-gray-300">Register your scores permanently on the blockchain!</p>
          </div>
          
          <div className="bg-[#91d3d1]/10 rounded-lg p-3 w-full">
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-[#91d3d1] mt-0.5" />
                <span>Register a unique username</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-[#91d3d1] mt-0.5" />
                <span>Your high scores saved on blockchain</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-[#91d3d1] mt-0.5" />
                <span>Compete on the global leaderboard</span>
              </li>
            </ul>
          </div>
          
          <Button 
            onClick={handleSelectOnchainMode}
            className="bg-gradient-to-r from-[#91d3d1] to-[#7ec7c5] hover:from-[#7ec7c5] hover:to-[#6abfbd] text-zinc-900"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Select On-Chain Mode
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="glassmorphism p-6 rounded-xl">
      {renderContent()}
      {showUsernameModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowUsernameModal(false)} />
          <OnchainOnboarding onComplete={() => setShowUsernameModal(false)} />
        </div>
      )}
    </div>
  );
};
