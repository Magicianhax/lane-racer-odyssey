
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { WalletInfoPanel } from '@/components/WalletInfoPanel';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const WalletPage: React.FC = () => {
  const { isConnected, username } = useWeb3();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Show onboarding if not connected or no username
    setIsOnboarding(!isConnected || !username);
    
    // Check if user has completed onboarding
    if (isConnected && username) {
      setOnboardingComplete(true);
    }
  }, [isConnected, username]);

  const handleSetupComplete = () => {
    setIsOnboarding(false);
    setOnboardingComplete(true);
  };

  const handleBackToHome = () => {
    // Only allow going back to home if onboarding is complete
    if (onboardingComplete) {
      navigate('/');
    } else if (isConnected) {
      // If connected but onboarding not complete, show warning
      toast.warning("Please complete the onboarding process", {
        description: "You need to register a username before you can play the game."
      });
    } else {
      // If not connected yet, let them go back
      navigate('/');
    }
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
        
        {isOnboarding ? (
          <OnboardingFlow onComplete={handleSetupComplete} />
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
