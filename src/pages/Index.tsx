
import Game from "@/components/Game";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white overflow-hidden">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center h-screen">
        <Game />
      </div>
    </div>
  );
};

export default Index;
