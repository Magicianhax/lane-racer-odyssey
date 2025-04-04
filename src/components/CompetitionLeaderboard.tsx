
import React from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';

type CompetitionScore = {
  competitionId: string;
  address: string;
  username: string;
  score: number;
  timestamp: number;
};

type CompetitionLeaderboardProps = {
  competitionId: string;
  scores: CompetitionScore[];
  isLoading: boolean;
};

export const CompetitionLeaderboard: React.FC<CompetitionLeaderboardProps> = ({
  competitionId,
  scores,
  isLoading
}) => {
  // Sort scores by highest first
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  
  // Get unique participants by highest score
  const topScoresByUser = sortedScores.reduce<CompetitionScore[]>((acc, score) => {
    const existingUser = acc.find(s => s.address === score.address);
    if (!existingUser) {
      acc.push(score);
    }
    return acc;
  }, []);
  
  // Sort again to ensure highest scores first
  const finalScores = topScoresByUser.sort((a, b) => b.score - a.score);
  
  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-gray-800/40 rounded-lg p-4 flex justify-center items-center">
        <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-2" />
        <span className="text-sm text-gray-400">Loading scores...</span>
      </div>
    );
  }
  
  if (finalScores.length === 0) {
    return (
      <div className="bg-gray-800/40 rounded-lg p-4 flex flex-col items-center justify-center">
        <Trophy className="h-8 w-8 text-gray-500 mb-2 opacity-40" />
        <p className="text-sm text-gray-400">No scores submitted yet</p>
      </div>
    );
  }
  
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-300 mb-2">Leaderboard</h4>
      <div className="bg-gray-800/40 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="w-12 text-gray-400">#</TableHead>
              <TableHead className="text-gray-400">Player</TableHead>
              <TableHead className="text-right text-gray-400">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalScores.slice(0, 5).map((score, index) => (
              <TableRow key={score.address} className="border-gray-700">
                <TableCell className="font-medium">
                  <span className="flex items-center">
                    {getMedalEmoji(index)}
                    <span className="ml-1">{index + 1}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{score.username}</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(score.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {score.score.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            
            {finalScores.length > 5 && (
              <TableRow className="border-gray-700 bg-gray-800/30">
                <TableCell colSpan={3} className="text-center text-xs text-gray-400">
                  + {finalScores.length - 5} more players
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
