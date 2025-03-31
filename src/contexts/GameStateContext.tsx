
import React, { createContext, useContext, useState } from 'react';

type GameStateType = 'main' | 'playing' | 'paused' | 'gameOver';

interface GameStateContextType {
  gameState: GameStateType;
  setGameState: (state: GameStateType) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameStateType>('main');

  return (
    <GameStateContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameStateContext.Provider>
  );
};
