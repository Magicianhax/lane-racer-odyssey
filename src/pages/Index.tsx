
import Game from "@/components/Game";
import { Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
        {isMobile ? (
          <div className="w-full h-full">
            <Game />
          </div>
        ) : (
          <div className="mobile-frame-container">
            <div className="mobile-frame">
              <div className="notch"></div>
              <div className="side-button left-button"></div>
              <div className="side-button right-button-top"></div>
              <div className="side-button right-button-bottom"></div>
              <div className="mobile-screen">
                <Game />
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
