import React, { useEffect, useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, RefreshCw, Medal, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LeaderboardEntry {
  player: string;
  username: string;
  score: number;
  timestamp: number;
}

interface LeaderboardProps {
  onClose?: () => void;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, className }) => {
  const { fetchLeaderboard, username: currentUsername } = useWeb3();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const getTimeAgo = (timestamp: number) => {
    const now = new Date();
    const date = new Date(timestamp * 1000);
    
    // If it's today, show "Today at HH:MM"
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    // If it's yesterday, show "Yesterday at HH:MM"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    
    // Otherwise show the date
    return format(date, 'MMM d, yyyy');
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400'; // Gold
      case 1: return 'text-gray-300';   // Silver
      case 2: return 'text-amber-600';  // Bronze
      default: return 'text-gray-500';  // Default
    }
  };

  const renderMedal = (index: number) => {
    return (
      <div className={cn('flex justify-center', getMedalColor(index))}>
        {index <= 2 ? (
          <Medal className="w-5 h-5" />
        ) : (
          <span className="text-sm font-medium">{index + 1}</span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("glassmorphism p-4 rounded-xl", className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
          Leaderboard
        </h2>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadLeaderboard}
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-[#91d3d1]" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadLeaderboard} 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No scores recorded yet.</p>
          <p className="text-sm mt-2">Be the first to submit your score!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-12 text-xs font-medium text-gray-400 pb-2 border-b border-[#91d3d1]/10">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-3 text-right">Score</div>
            <div className="col-span-3 text-right">Date</div>
          </div>
          
          {/* Entries */}
          {leaderboard.map((entry, index) => (
            <div 
              key={`${entry.player}-${entry.score}`} 
              className={cn(
                "grid grid-cols-12 items-center py-2 text-sm border-b border-[#91d3d1]/10",
                entry.username === currentUsername && "bg-[#91d3d1]/10 rounded-lg"
              )}
            >
              {/* Rank with medal */}
              <div className="col-span-1">
                {renderMedal(index)}
              </div>
              
              {/* Username */}
              <div className="col-span-5 flex items-center">
                <User className="h-3 w-3 mr-1 text-[#91d3d1]/70" />
                <span className={cn(
                  "font-medium truncate",
                  entry.username === currentUsername && "text-[#91d3d1]"
                )}>
                  {entry.username}
                </span>
              </div>
              
              {/* Score */}
              <div className="col-span-3 text-right font-mono font-bold">
                {entry.score.toLocaleString()}
              </div>
              
              {/* Date */}
              <div className="col-span-3 text-right text-xs text-gray-400">
                {getTimeAgo(entry.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
