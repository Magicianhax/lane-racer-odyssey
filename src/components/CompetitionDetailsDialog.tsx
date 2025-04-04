
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Trophy, Users, Calendar, Coins, Clock, Play, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { CompetitionLeaderboard } from '@/components/CompetitionLeaderboard';
import { toast } from 'sonner';

type Competition = {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate: number;
  prizePool: string;
  rewardDistribution: number[];
  creator: string;
  participants: string[];
};

type CompetitionDetailsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition;
};

export const CompetitionDetailsDialog: React.FC<CompetitionDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  competition
}) => {
  const { 
    isConnected, 
    wallet, 
    username,
    isJoined: checkIsJoined,
    joinCompetition,
    submitCompetitionScore,
    getCompetitionScores
  } = useWeb3();
  
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  
  const now = Date.now();
  const isActive = now >= competition.startDate && now <= competition.endDate;
  const isPast = now > competition.endDate;
  const isUpcoming = now < competition.startDate;
  
  useEffect(() => {
    const checkJoinStatus = async () => {
      if (isConnected && competition) {
        const joined = await checkIsJoined(competition.id);
        setIsJoined(joined);
      }
    };
    
    const loadScores = async () => {
      if (competition) {
        setIsLoadingScores(true);
        try {
          const competitionScores = await getCompetitionScores(competition.id);
          setScores(competitionScores);
        } catch (error) {
          console.error("Error loading scores:", error);
        } finally {
          setIsLoadingScores(false);
        }
      }
    };
    
    if (isOpen) {
      checkJoinStatus();
      loadScores();
    }
  }, [isOpen, isConnected, competition]);
  
  const handleJoin = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsJoining(true);
      const success = await joinCompetition(competition.id);
      
      if (success) {
        setIsJoined(true);
        toast.success("You've successfully joined the competition!");
      }
    } catch (error) {
      console.error("Error joining competition:", error);
      toast.error("Failed to join competition");
    } finally {
      setIsJoining(false);
    }
  };
  
  const handlePlayNow = async () => {
    // Close the dialog and redirect to game with competition context
    onOpenChange(false);
    localStorage.setItem('currentCompetition', competition.id);
    // Navigate to game or handle in Game component
    toast.success("Competition mode activated!", {
      description: `You're now playing in the "${competition.name}" competition`
    });
  };
  
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };
  
  const getStatusSection = () => {
    if (isActive) {
      return (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Play className="h-5 w-5 text-green-500 mr-2" />
            <h4 className="font-medium text-green-500">Competition is active!</h4>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Join now and submit your highest score before {formatDate(competition.endDate)}
          </p>
        </div>
      );
    } else if (isPast) {
      return (
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-gray-400 mr-2" />
            <h4 className="font-medium text-gray-400">Competition has ended</h4>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            This competition ended on {formatDate(competition.endDate)}
          </p>
        </div>
      );
    } else {
      return (
        <div className="bg-[#e9c46a]/10 border border-[#e9c46a]/30 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-[#e9c46a] mr-2" />
            <h4 className="font-medium text-[#e9c46a]">Upcoming competition</h4>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            This competition starts on {formatDate(competition.startDate)}
          </p>
        </div>
      );
    }
  };
  
  const getActionButton = () => {
    if (!isConnected) {
      return (
        <div className="text-center text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3 mb-4">
          Connect your wallet to join competitions
        </div>
      );
    }
    
    if (isPast) {
      return (
        <div className="text-center text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3 mb-4">
          This competition has ended
        </div>
      );
    }
    
    if (isJoined) {
      if (isActive) {
        return (
          <Button
            variant="teal"
            className="w-full"
            onClick={handlePlayNow}
          >
            <Play className="h-4 w-4 mr-2" />
            Play Now
          </Button>
        );
      } else {
        return (
          <Button
            variant="outline"
            className="w-full bg-gray-800/50 text-gray-300 border-gray-700"
            disabled
          >
            <Clock className="h-4 w-4 mr-2" />
            Waiting for start...
          </Button>
        );
      }
    } else {
      return (
        <Button
          variant={isUpcoming ? "teal-outline" : "teal"}
          className="w-full"
          onClick={handleJoin}
          disabled={isJoining || isPast}
        >
          {isJoining ? (
            <>
              <span className="animate-spin mr-2">⚪</span>
              Joining...
            </>
          ) : (
            <>
              <Trophy className="h-4 w-4 mr-2" />
              Join Competition
            </>
          )}
        </Button>
      );
    }
  };
  
  const prizePool = ethers.utils.formatEther(ethers.utils.parseEther(competition.prizePool));
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-b from-[#0b131e] to-[#172637] border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{competition.name}</DialogTitle>
        </DialogHeader>
        
        {getStatusSection()}
        
        <div className="space-y-4">
          <p className="text-gray-300">{competition.description}</p>
          
          <div className="bg-gray-800/40 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-[#91d3d1]" />
                <span className="text-sm text-gray-300">Start Date</span>
              </div>
              <span className="text-sm text-white">{formatDate(competition.startDate)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-[#91d3d1]" />
                <span className="text-sm text-gray-300">End Date</span>
              </div>
              <span className="text-sm text-white">{formatDate(competition.endDate)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Coins className="h-4 w-4 mr-2 text-[#e9c46a]" />
                <span className="text-sm text-gray-300">Prize Pool</span>
              </div>
              <span className="text-sm text-white">{prizePool} ETH</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-[#91d3d1]" />
                <span className="text-sm text-gray-300">Participants</span>
              </div>
              <span className="text-sm text-white">{competition.participants.length}</span>
            </div>
          </div>
          
          {competition.rewardDistribution.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Reward Distribution</h4>
              <div className="bg-gray-800/40 rounded-lg p-3">
                {competition.rewardDistribution.map((percentage, index) => (
                  <div key={index} className="flex justify-between items-center mb-1 last:mb-0">
                    <span className="text-sm text-gray-300">
                      {index === 0 ? '🥇 1st Place' : 
                       index === 1 ? '🥈 2nd Place' : 
                       index === 2 ? '🥉 3rd Place' : `${index + 1}th Place`}
                    </span>
                    <div className="flex items-center">
                      <span className="text-sm text-white">{percentage}%</span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({(parseFloat(prizePool) * percentage / 100).toFixed(4)} ETH)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <CompetitionLeaderboard
            competitionId={competition.id}
            scores={scores}
            isLoading={isLoadingScores}
          />
          
          <div className="pt-2">
            {getActionButton()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
