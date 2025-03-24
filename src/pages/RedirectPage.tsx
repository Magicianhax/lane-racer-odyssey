
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import { Loader2 } from 'lucide-react';

const RedirectPage: React.FC = () => {
  const { isConnected, isLoading } = useWeb3();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isConnected) {
        // User already has a wallet, redirect to game
        navigate('/game');
      } else {
        // New user, redirect to wallet setup
        navigate('/wallet');
      }
    }
  }, [isConnected, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-[#91d3d1] animate-spin mb-4" />
        <p className="text-white">Loading game...</p>
      </div>
    </div>
  );
};

export default RedirectPage;
