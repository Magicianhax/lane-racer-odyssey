
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { 
  Trophy, 
  RefreshCw, 
  Calendar,
  Award, 
  Clock, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Define the Score type based on the contract structure
export interface Score {
  player: string;
  score: number;
  timestamp: number;
}

export const AllScoresLeaderboard: React.FC<{
  onClose?: () => void;
  className?: string;
}> = ({ onClose, className }) => {
  const { contract, wallet, getAllScores, getTotalScores } = useWeb3();
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalScores, setTotalScores] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10); // Number of scores per page

  const fetchLeaderboard = async () => {
    if (!contract) {
      setError("Contract connection not available");
      setIsLoading(false);
      return;
    }

    try {
      setIsRefreshing(true);
      
      // Get total number of scores for pagination
      const total = await getTotalScores();
      setTotalScores(total);
      
      // Get scores for current page
      const startIndex = currentPage * pageSize;
      const pageScores = await getAllScores(startIndex, pageSize);
      setScores(pageScores);
      setError(null);
    } catch (err) {
      console.error("Error fetching all scores:", err);
      setError("Failed to load score data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [contract, currentPage, pageSize]);

  // Format timestamp to a readable date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return format(date, 'MMM d, yyyy');
  };

  // Format timestamp to a readable time
  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return format(date, 'h:mm a');
  };

  // Shorten ethereum address for display
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Function to determine if an address is the current user
  const isCurrentUser = (address: string): boolean => {
    if (!wallet.address) return false;
    return address.toLowerCase() === wallet.address.toLowerCase();
  };

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalScores / pageSize));
  
  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
          <h2 className="text-lg font-bold">All Score Submissions</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchLeaderboard}
            disabled={isLoading || isRefreshing}
            className="h-8 w-8 rounded-full"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4 text-gray-400">
          <div className="mb-2 text-yellow-400">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
          </div>
          <p>{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchLeaderboard}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      ) : scores.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No scores submitted yet. Be the first!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-[calc(100%-80px)] mb-4">
            {scores.map((score, index) => {
              const isUser = isCurrentUser(score.player);
              
              return (
                <div 
                  key={index}
                  className={`flex items-center p-2 rounded-lg transition-colors ${
                    isUser ? 'bg-[#91d3d1]/20 border border-[#91d3d1]/30' : 'bg-black/20'
                  }`}
                >
                  <div className="mr-3 flex-shrink-0">
                    <div className="w-7 h-7 flex items-center justify-center bg-zinc-800 text-white rounded-full font-bold text-xs">
                      {currentPage * pageSize + index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="text-xs font-medium truncate">
                        {shortenAddress(score.player)}
                      </span>
                      {isUser && (
                        <span className="ml-1.5 text-[10px] bg-[#91d3d1]/30 text-[#91d3d1] px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                      <Calendar className="w-2.5 h-2.5 mr-1" />
                      <span>{formatDate(score.timestamp)}</span>
                      <Clock className="w-2.5 h-2.5 ml-2 mr-1" />
                      <span>{formatTime(score.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="text-base font-mono font-bold tabular-nums">
                    {score.score}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-xs text-gray-400">
              Page {currentPage + 1} of {totalPages} ({totalScores} total scores)
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="h-8 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-gray-400 flex justify-between items-center">
            <span>Updated {isRefreshing ? 'now' : 'recently'}</span>
            <span className="text-[#91d3d1]">All player submissions</span>
          </div>
        </>
      )}
    </div>
  );
};
