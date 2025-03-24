import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Contract ABI
const GAME_SCORE_ABI = [
  "function submitScore(uint256 _score) external",
  "function getPlayerHighScore() external view returns (uint256)",
  "function getTopScores() external view returns (tuple(address player, uint256 score, uint256 timestamp)[])",
  "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)",
  "event NewHighScore(address indexed player, uint256 score, uint256 timestamp)"
];

const CONTRACT_ADDRESS = "0xAF3DF64A108A244a79800ca3263100Eec1a08BAf";
const SUPERSEED_RPC_URL = "https://sepolia.superseed.xyz/";

// Fixed gas settings
const FIXED_GAS_PRICE = ethers.utils.parseUnits("0.1", "gwei");
const FIXED_GAS_LIMIT = 200000; // Setting a higher gas limit to ensure transaction goes through

type Web3ContextType = {
  wallet: {
    address: string | null;
    balance: string | null;
    privateKey: string | null;
  };
  username: string | null;
  contract: ethers.Contract | null;
  provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  createUserWallet: (username: string) => Promise<void>;
  submitScore: (score: number) => Promise<void>;
  getPlayerHighScore: () => Promise<number>;
  exportPrivateKey: () => string | null;
  isSubmittingScore: boolean;
  lastTxHash: string | null;
};

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<{ 
    address: string | null; 
    balance: string | null;
    privateKey: string | null;
  }>({
    address: null,
    balance: null,
    privateKey: null
  });
  const [username, setUsername] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        // Check for stored wallet data
        const savedUserData = localStorage.getItem('gameUserData');
        if (savedUserData) {
          const userData = JSON.parse(savedUserData);
          setUsername(userData.username);
          await initializeWallet(userData.privateKey);
        } else {
          // Check if we have a stored username from a previous session
          const savedUsername = localStorage.getItem('username');
          if (savedUsername) {
            setUsername(savedUsername);
          }
        }
      } catch (error) {
        console.error("Error checking existing wallet:", error);
      }
    };

    checkExistingWallet();
  }, []);

  const initializeWallet = async (privateKey: string) => {
    try {
      setIsLoading(true);
      
      const fallbackProvider = new ethers.providers.JsonRpcProvider(SUPERSEED_RPC_URL);
      const wallet = new ethers.Wallet(privateKey, fallbackProvider);
      
      const gameContract = new ethers.Contract(CONTRACT_ADDRESS, GAME_SCORE_ABI, wallet);
      
      const address = await wallet.getAddress();
      let balance = "0";
      
      try {
        balance = ethers.utils.formatEther(await fallbackProvider.getBalance(address));
      } catch (err) {
        console.warn("Failed to fetch balance:", err);
      }
      
      setWallet({ 
        address, 
        balance,
        privateKey 
      });
      setContract(gameContract);
      setProvider(fallbackProvider);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error("Error initializing wallet:", error);
      setError("Failed to initialize wallet");
      setIsLoading(false);
      return false;
    }
  };

  const createUserWallet = async (name: string) => {
    try {
      if (!name || name.trim() === "") {
        setError("Username cannot be empty");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      const randomWallet = ethers.Wallet.createRandom();
      const privateKey = randomWallet.privateKey;
      
      // Store the data in localStorage
      localStorage.setItem('gameUserData', JSON.stringify({ 
        username: name,
        privateKey 
      }));
      
      // Make sure we also set the username in the regular localStorage
      localStorage.setItem('username', name);
      
      setUsername(name);
      
      const success = await initializeWallet(privateKey);
      
      if (success) {
        console.log("Wallet created for user:", name, "Address:", randomWallet.address);
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      setError("Failed to create wallet");
      setIsLoading(false);
    }
  };

  const exportPrivateKey = (): string | null => {
    return wallet.privateKey;
  };

  const submitScore = async (score: number) => {
    if (!contract) {
      setError("No contract connection");
      toast.error("No contract connection");
      return;
    }
    
    try {
      setIsSubmittingScore(true);
      setError(null);
      
      toast.loading("Submitting score to blockchain...");
      
      if (wallet.address && provider) {
        const balance = await provider.getBalance(wallet.address);
        
        if (balance.isZero() || balance.lt(ethers.utils.parseEther("0.0001"))) {
          toast.dismiss();
          toast.error("Insufficient balance to submit score", {
            description: "You need testnet ETH to submit scores to the blockchain."
          });
          setError("Insufficient balance");
          setIsSubmittingScore(false);
          return;
        }
      }
      
      // Create transaction with fixed gas price and limit
      const tx = await contract.submitScore(score, {
        gasPrice: FIXED_GAS_PRICE,
        gasLimit: FIXED_GAS_LIMIT
      });
      setLastTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Score submitted:", receipt);
      
      toast.dismiss();
      toast.success("Score successfully submitted to blockchain!", {
        description: 
          <div className="flex flex-col gap-1">
            <span>Your score of {score} is now on the blockchain.</span>
            <a 
              href={`https://sepolia-explorer.superseed.xyz/tx/${receipt.transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs underline flex items-center mt-1"
            >
              View Transaction
            </a>
          </div>
      });
      
      setIsSubmittingScore(false);
    } catch (error) {
      console.error("Error submitting score:", error);
      
      const errorMessage = error.toString();
      if (errorMessage.includes("insufficient funds") || errorMessage.includes("out of gas")) {
        toast.dismiss();
        toast.error("Insufficient balance to submit score", {
          description: "You need testnet ETH to submit scores to the blockchain."
        });
        setError("Insufficient balance");
      } else {
        toast.dismiss();
        toast.error("Failed to submit score", {
          description: "There was an error submitting your score to the blockchain."
        });
        setError("Failed to submit score");
      }
      
      setIsSubmittingScore(false);
    }
  };

  const getPlayerHighScore = async (): Promise<number> => {
    if (!contract) {
      setError("No contract connection");
      return 0;
    }
    
    try {
      const score = await contract.getPlayerHighScore();
      return score.toNumber();
    } catch (error) {
      console.error("Error getting high score:", error);
      setError("Failed to get high score");
      return 0;
    }
  };

  const value = {
    wallet,
    username,
    contract,
    provider,
    isConnected: !!wallet.address,
    isLoading,
    error,
    createUserWallet,
    submitScore,
    getPlayerHighScore,
    exportPrivateKey,
    isSubmittingScore,
    lastTxHash
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
