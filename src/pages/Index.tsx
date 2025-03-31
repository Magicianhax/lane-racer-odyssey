
import Game from "@/components/Game";
import GameMenu from "@/components/GameMenu";
import { Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Web3Provider } from "@/contexts/Web3Context";
import { useState } from "react";

const Index = () => {
  const isMobile = useIsMobile();
  const [gameState, setGameState] = useState<'main' | 'playing' | 'paused' | 'gameOver'>('main');

  // This function would be passed to GameMenu to resume the game
  const handleResume = () => {
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57]">
        {isMobile ? (
          <div className="w-full h-full relative">
            <Web3Provider>
              <GameMenu gameState={gameState} onResume={handleResume} />
              <Game />
            </Web3Provider>
          </div>
        ) : (
          <div className="mobile-frame-container">
            <div className="mobile-frame shadow-[0_0_40px_5px_rgba(255,255,255,0.15)]">
              <div className="notch"></div>
              <div className="side-button left-button"></div>
              <div className="side-button right-button-top"></div>
              <div className="side-button right-button-bottom"></div>
              <div className="mobile-screen relative">
                <Web3Provider>
                  <GameMenu gameState={gameState} onResume={handleResume} />
                  <Game />
                </Web3Provider>
              </div>
              <div className="home-indicator"></div>
            </div>
            <div className="mt-6 flex items-center justify-center text-[#91d3d1]/70 text-sm">
              <Smartphone className="w-4 h-4 mr-2" />
              <span>Superseed Lane Runner</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
