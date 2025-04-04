import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Contract ABI
const GAME_SCORE_ABI = [
  "function submitScore(uint256 _score) external",
  "function getPlayerHighScore() external view returns (uint256)",
  "function getTopScores() external view returns (tuple(address player, uint256 score, uint256 timestamp)[])",
  "function getScores(uint256 startIndex, uint256 count) external view returns (tuple(address player, uint256 score, uint256 timestamp)[])",
  "function getPlayerScores(address player) external view returns (tuple(address player, uint256 score, uint256 timestamp)[])",
  "function getTotalScores() external view returns (uint256)",
  "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)",
  "event NewHighScore(address indexed player, uint256 score, uint256 timestamp)"
];

// Competition Mock API (in a real implementation, this would be a smart contract)
type Competition = {
  id: string;
  name: string;
  description: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  prizePool: string; // ETH amount
  rewardDistribution: number[]; // Percentages for top 3
  creator: string;
  participants: string[];
};

type CompetitionScore = {
  competitionId: string;
  address: string;
  username: string;
  score: number;
  timestamp: number;
};

const CONTRACT_ADDRESS = "0x454EEca51B63c7488628Ebe608241c4551c4c8a8";
const SUPERSEED_RPC_URL = "https://sepolia.superseed.xyz/";

// Fixed gas settings - updated gas price to 1 gwei
const FIXED_GAS_PRICE = ethers.utils.parseUnits("1", "gwei");
const FIXED_GAS_LIMIT = 500000; // Increased gas limit from 200,000 to 500,000

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
  withdrawEth: (toAddress: string, amount: string) => Promise<void>;
  isWithdrawing: boolean;
  refreshBalance: () => Promise<void>;
  getTopScores: () => Promise<{ player: string; score: number; timestamp: number; }[]>;
  getAllScores: (startIndex: number, count: number) => Promise<{ player: string; score: number; timestamp: number; }[]>;
  getPlayerScores: (address: string) => Promise<{ player: string; score: number; timestamp: number; }[]>;
  getTotalScores: () => Promise<number>;
  // Competition-related functions
  getCompetitions: () => Promise<Competition[]>;
  getCompetition: (id: string) => Promise<Competition | null>;
  createCompetition: (competition: Omit<Competition, "id" | "creator" | "participants">) => Promise<string>;
  joinCompetition: (competitionId: string) => Promise<boolean>;
  submitCompetitionScore: (competitionId: string, score: number) => Promise<boolean>;
  getCompetitionScores: (competitionId: string) => Promise<CompetitionScore[]>;
  getUserCompetitions: () => Promise<Competition[]>;
  getActiveCompetitions: () => Promise<Competition[]>;
  getPastCompetitions: () => Promise<Competition[]>;
  getUpcomingCompetitions: () => Promise<Competition[]>;
  isJoined: (competitionId: string) => Promise<boolean>;
};

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Mock competition data
const mockCompetitions: Competition[] = [
  {
    id: "comp-1",
    name: "Weekend Challenge",
    description: "Compete for the highest score this weekend!",
    startDate: Date.now() - 86400000, // 1 day ago
    endDate: Date.now() + 172800000, // 2 days from now
    prizePool: "0.05",
    rewardDistribution: [60, 30, 10],
    creator: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    participants: ["0x8ba1f109551bD432803012645Ac136ddd64DBA72"]
  },
  {
    id: "comp-2",
    name: "Pro Tournament",
    description: "High stakes competition with big rewards!",
    startDate: Date.now() + 259200000, // 3 days from now
    endDate: Date.now() + 518400000, // 6 days from now
    prizePool: "0.1",
    rewardDistribution: [50, 30, 20],
    creator: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    participants: []
  },
  {
    id: "comp-3",
    name: "Past Tournament",
    description: "This competition has ended",
    startDate: Date.now() - 518400000, // 6 days ago
    endDate: Date.now() - 259200000, // 3 days ago
    prizePool: "0.03",
    rewardDistribution: [60, 40],
    creator: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    participants: ["0x8ba1f109551bD432803012645Ac136ddd64DBA72", "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB"]
  }
];

const mockScores: CompetitionScore[] = [
  {
    competitionId: "comp-1",
    address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    username: "Player1",
    score: 750,
    timestamp: Date.now() - 43200000 // 12 hours ago
  },
  {
    competitionId: "comp-3",
    address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    username: "Player1",
    score: 950,
    timestamp: Date.now() - 345600000 // 4 days ago
  },
  {
    competitionId: "comp-3",
    address: "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB",
    username: "Player2",
    score: 850,
    timestamp: Date.now() - 345600000 // 4 days ago
  }
];

// Store competitions and scores in localStorage
const initializeMockData = () => {
  if (!localStorage.getItem('gameCompetitions')) {
    localStorage.setItem('gameCompetitions', JSON.stringify(mockCompetitions));
  }
  
  if (!localStorage.getItem('gameCompetitionsScores')) {
    localStorage.setItem('gameCompetitionsScores', JSON.stringify(mockScores));
  }
};

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
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    initializeMockData();
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

  const refreshBalance = async (): Promise<void> => {
    if (!wallet.address || !provider) {
      return;
    }
    
    try {
      const newBalance = await provider.getBalance(wallet.address);
      setWallet(prev => ({ 
        ...prev, 
        balance: ethers.utils.formatEther(newBalance) 
      }));
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  };

  const withdrawEth = async (toAddress: string, amount: string) => {
    if (!wallet.address || !wallet.privateKey || !provider) {
      setError("No wallet connection");
      toast.error("No wallet connection");
      return;
    }
    
    try {
      setIsWithdrawing(true);
      setError(null);
      
      // Validate destination address
      if (!ethers.utils.isAddress(toAddress)) {
        toast.error("Invalid Ethereum address");
        setError("Invalid address");
        setIsWithdrawing(false);
        return;
      }
      
      // Parse amount to ETH
      const amountInEth = ethers.utils.parseEther(amount);
      
      // Get wallet balance
      const balance = await provider.getBalance(wallet.address);
      
      if (balance.isZero()) {
        toast.error("No ETH to withdraw");
        setError("No balance to withdraw");
        setIsWithdrawing(false);
        return;
      }
      
      // Check if amount is greater than balance
      if (amountInEth.gt(balance)) {
        toast.error("Amount exceeds your balance");
        setError("Insufficient balance");
        setIsWithdrawing(false);
        return;
      }
      
      // Create wallet instance
      const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
      
      // Calculate gas needed for the transaction
      const gasPrice = FIXED_GAS_PRICE;
      const gasLimit = 21000; // Standard ETH transfer gas
      const gasCost = gasPrice.mul(gasLimit);
      
      // Make sure balance is greater than amount + gas cost
      if (balance.lt(amountInEth.add(gasCost))) {
        const maxAmount = ethers.utils.formatEther(balance.sub(gasCost));
        toast.error(`Insufficient balance to cover amount plus gas costs. Maximum amount: ${maxAmount} ETH`);
        setError(`Insufficient balance. Max: ${maxAmount} ETH`);
        setIsWithdrawing(false);
        return;
      }
      
      toast.loading("Withdrawing ETH...");
      
      // Send transaction
      const tx = await walletInstance.sendTransaction({
        to: toAddress,
        value: amountInEth,
        gasPrice: gasPrice,
        gasLimit: gasLimit
      });
      
      setLastTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("ETH withdrawn:", receipt);
      
      toast.dismiss();
      toast.success("ETH successfully withdrawn!", {
        description: 
          <div className="flex flex-col gap-1">
            <span>{amount} ETH has been sent.</span>
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
      
      // Update balance
      await refreshBalance();
      
      setIsWithdrawing(false);
    } catch (error) {
      console.error("Error withdrawing ETH:", error);
      
      toast.dismiss();
      toast.error("Failed to withdraw ETH", {
        description: "There was an error withdrawing your ETH."
      });
      setError("Failed to withdraw ETH");
      setIsWithdrawing(false);
    }
  };

  const getTopScores = async (): Promise<{ player: string; score: number; timestamp: number; }[]> => {
    if (!contract) {
      setError("No contract connection");
      return [];
    }
    
    try {
      const scores = await contract.getTopScores();
      
      // Transform contract data to a more usable format
      return scores.map((score: any) => ({
        player: score.player,
        score: score.score.toNumber(),
        timestamp: score.timestamp.toNumber()
      }));
    } catch (error) {
      console.error("Error getting top scores:", error);
      setError("Failed to get top scores");
      return [];
    }
  };

  const getAllScores = async (startIndex: number, count: number): Promise<{ player: string; score: number; timestamp: number; }[]> => {
    if (!contract) {
      setError("No contract connection");
      return [];
    }
    
    try {
      const scores = await contract.getScores(startIndex, count);
      
      // Transform contract data to a more usable format
      return scores.map((score: any) => ({
        player: score.player,
        score: score.score.toNumber(),
        timestamp: score.timestamp.toNumber()
      }));
    } catch (error) {
      console.error("Error getting all scores:", error);
      setError("Failed to get all scores");
      return [];
    }
  };

  const getPlayerScores = async (address: string): Promise<{ player: string; score: number; timestamp: number; }[]> => {
    if (!contract) {
      setError("No contract connection");
      return [];
    }
    
    try {
      const scores = await contract.getPlayerScores(address);
      
      // Transform contract data to a more usable format
      return scores.map((score: any) => ({
        player: score.player,
        score: score.score.toNumber(),
        timestamp: score.timestamp.toNumber()
      }));
    } catch (error) {
      console.error("Error getting player scores:", error);
      setError("Failed to get player scores");
      return [];
    }
  };

  const getTotalScores = async (): Promise<number> => {
    if (!contract) {
      setError("No contract connection");
      return 0;
    }
    
    try {
      const totalScores = await contract.getTotalScores();
      return totalScores.toNumber();
    } catch (error) {
      console.error("Error getting total scores:", error);
      setError("Failed to get total scores");
      return 0;
    }
  };

  // Competition-related functions
  const getCompetitions = async (): Promise<Competition[]> => {
    try {
      const storedCompetitions = localStorage.getItem('gameCompetitions');
      return storedCompetitions ? JSON.parse(storedCompetitions) : [];
    } catch (error) {
      console.error("Error getting competitions:", error);
      return [];
    }
  };

  const getCompetition = async (id: string): Promise<Competition | null> => {
    try {
      const competitions = await getCompetitions();
      return competitions.find(comp => comp.id === id) || null;
    } catch (error) {
      console.error("Error getting competition:", error);
      return null;
    }
  };

  const createCompetition = async (competitionData: Omit<Competition, "id" | "creator" | "participants">): Promise<string> => {
    if (!wallet.address) {
      throw new Error("Wallet not connected");
    }
    
    try {
      const competitions = await getCompetitions();
      const newCompetition: Competition = {
        ...competitionData,
        id: `comp-${Date.now()}`,
        creator: wallet.address,
        participants: []
      };
      
      const updatedCompetitions = [...competitions, newCompetition];
      localStorage.setItem('gameCompetitions', JSON.stringify(updatedCompetitions));
      
      toast.success("Competition created successfully");
      return newCompetition.id;
    } catch (error) {
      console.error("Error creating competition:", error);
      toast.error("Failed to create competition");
      throw error;
    }
  };

  const joinCompetition = async (competitionId: string): Promise<boolean> => {
    if (!wallet.address) {
      toast.error("Wallet not connected");
      return false;
    }
    
    try {
      const competitions = await getCompetitions();
      const competitionIndex = competitions.findIndex(comp => comp.id === competitionId);
      
      if (competitionIndex === -1) {
        toast.error("Competition not found");
        return false;
      }
      
      const competition = competitions[competitionIndex];
      
      // Check if already joined
      if (competition.participants.includes(wallet.address)) {
        toast.info("You've already joined this competition");
        return true;
      }
      
      // Update participants
      competition.participants.push(wallet.address);
      competitions[competitionIndex] = competition;
      
      localStorage.setItem('gameCompetitions', JSON.stringify(competitions));
      toast.success("Joined competition successfully");
      
      return true;
    } catch (error) {
      console.error("Error joining competition:", error);
      toast.error("Failed to join competition");
      return false;
    }
  };

  const submitCompetitionScore = async (competitionId: string, score: number): Promise<boolean> => {
    if (!wallet.address || !username) {
      toast.error("Wallet not connected");
      return false;
    }
    
    try {
      const competition = await getCompetition(competitionId);
      
      if (!competition) {
        toast.error("Competition not found");
        return false;
      }
      
      const now = Date.now();
      
      // Check if competition is active
      if (now < competition.startDate || now > competition.endDate) {
        toast.error("Competition is not active");
        return false;
      }
      
      // Check if user is a participant
      if (!competition.participants.includes(wallet.address)) {
        toast.error("You're not a participant in this competition");
        return false;
      }
      
      // Get existing scores
      const storedScores = localStorage.getItem('gameCompetitionsScores');
      const scores: CompetitionScore[] = storedScores ? JSON.parse(storedScores) : [];
      
      // Add new score
      const newScore: CompetitionScore = {
        competitionId,
        address: wallet.address,
        username,
        score,
        timestamp: now
      };
      
      scores.push(newScore);
      localStorage.setItem('gameCompetitionsScores', JSON.stringify(scores));
      
      toast.success("Score submitted to competition");
      return true;
    } catch (error) {
      console.error("Error submitting competition score:", error);
      toast.error("Failed to submit competition score");
      return false;
    }
  };

  const getCompetitionScores = async (competitionId: string): Promise<CompetitionScore[]> => {
    try {
      const storedScores = localStorage.getItem('gameCompetitionsScores');
      const allScores: CompetitionScore[] = storedScores ? JSON.parse(storedScores) : [];
      
      // Filter scores by competition
      return allScores.filter(score => score.competitionId === competitionId);
    } catch (error) {
      console.error("Error getting competition scores:", error);
      return [];
    }
  };

  const getUserCompetitions = async (): Promise<Competition[]> => {
    if (!wallet.address) return [];
    
    try {
      const competitions = await getCompetitions();
      return competitions.filter(comp => 
        comp.creator === wallet.address || comp.participants.includes(wallet.address)
      );
    } catch (error) {
      console.error("Error getting user competitions:", error);
      return [];
    }
  };

  const getActiveCompetitions = async (): Promise<Competition[]> => {
    try {
      const competitions = await getCompetitions();
      const now = Date.now();
      return competitions.filter(comp => comp.startDate <= now && comp.endDate >= now);
    } catch (error) {
      console.error("Error getting active competitions:", error);
      return [];
    }
  };

  const getPastCompetitions = async (): Promise<Competition[]> => {
    try {
      const competitions = await getCompetitions();
      const now = Date.now();
      return competitions.filter(comp => comp.endDate < now);
    } catch (error) {
      console.error("Error getting past competitions:", error);
      return [];
    }
  };

  const getUpcomingCompetitions = async (): Promise<Competition[]> => {
    try {
      const competitions = await getCompetitions();
      const now = Date.now();
      return competitions.filter(comp => comp.startDate > now);
    } catch (error) {
      console.error("Error getting upcoming competitions:", error);
      return [];
    }
  };

  const isJoined = async (competitionId: string): Promise<boolean> => {
    if (!wallet.address) return false;
    
    try {
      const competition = await getCompetition(competitionId);
      return competition ? competition.participants.includes(wallet.address) : false;
    } catch (error) {
      console.error("Error checking if joined:", error);
      return false;
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
    getAllScores,
    getPlayerScores,
    getTotalScores,
    exportPrivateKey,
    isSubmittingScore,
    lastTxHash,
    withdrawEth,
    isWithdrawing,
    refreshBalance,
    getTopScores,
    // Competition-related functions
    getCompetitions,
    getCompetition,
    createCompetition,
    joinCompetition,
    submitCompetitionScore,
    getCompetitionScores,
    getUserCompetitions,
    getActiveCompetitions,
    getPastCompetitions,
    getUpcomingCompetitions,
    isJoined
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
