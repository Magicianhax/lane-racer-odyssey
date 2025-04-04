
import Game from "@/components/Game";
import { Smartphone, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Web3Provider } from "@/contexts/Web3Context";
import { useState, useEffect } from "react";
import { CompetitionsButton } from "@/components/CompetitionsButton";

const Index = () => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const LoadingScreen = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full bg-[#91d3d1]/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#91d3d1]/30 animate-spin"></div>
          <Loader2 className="w-20 h-20 text-[#91d3d1] animate-spin" />
        </div>
        <h3 className="text-[#91d3d1] text-2xl font-medium mb-2">Loading game</h3>
        <p className="text-gray-400 text-sm animate-pulse">Processing game assets...</p>
      </div>
      
      {/* Moving particles for dynamic effect */}
      <div className="absolute w-2 h-2 rounded-full bg-[#ffcd3c] top-1/4 left-1/4 animate-float"></div>
      <div className="absolute w-3 h-3 rounded-full bg-[#91d3d1]/40 bottom-1/3 right-1/3 animate-bounce-subtle"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57]">
        {isMobile ? (
          <div className="w-full h-full">
            {isLoading ? (
              <LoadingScreen />
            ) : (
              <Web3Provider>
                <div className="relative h-full">
                  {/* Competitions button added for mobile */}
                  <div className="absolute top-4 right-4 z-10">
                    <CompetitionsButton />
                  </div>
                  <Game />
                </div>
              </Web3Provider>
            )}
          </div>
        ) : (
          <div className="mobile-frame-container flex flex-col items-center justify-center">
            <div className="mobile-frame shadow-[0_0_40px_5px_rgba(255,255,255,0.15)]">
              <div className="notch"></div>
              <div className="side-button left-button"></div>
              <div className="side-button right-button-top"></div>
              <div className="side-button right-button-bottom"></div>
              <div className="mobile-screen flex items-center justify-center pb-0">
                {isLoading ? (
                  <LoadingScreen />
                ) : (
                  <Web3Provider>
                    <div className="relative h-full w-full">
                      {/* Competitions button added for desktop */}
                      <div className="absolute top-4 right-4 z-10">
                        <CompetitionsButton />
                      </div>
                      <Game />
                    </div>
                  </Web3Provider>
                )}
              </div>
              <div className="home-indicator"></div>
            </div>
            <div className="mt-6 flex items-center justify-center text-[#91d3d1]/70 text-sm">
              <Smartphone className="w-4 h-4 mr-2" />
              <span>SuperSeed Lane Runner</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
