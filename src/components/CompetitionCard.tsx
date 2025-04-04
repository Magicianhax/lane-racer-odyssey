
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Trophy, Users, Calendar, Coins } from 'lucide-react';
import { ethers } from 'ethers';

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

type CompetitionCardProps = {
  competition: Competition;
  onClick?: () => void;
};

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onClick
}) => {
  const now = Date.now();
  const isActive = now >= competition.startDate && now <= competition.endDate;
  const isPast = now > competition.endDate;
  const isUpcoming = now < competition.startDate;
  
  const getStatusBadge = () => {
    if (isActive) {
      return <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded-md">ACTIVE</span>;
    } else if (isPast) {
      return <span className="text-xs font-semibold bg-gray-500 text-white px-2 py-1 rounded-md">COMPLETED</span>;
    } else {
      return <span className="text-xs font-semibold bg-[#e9c46a] text-gray-900 px-2 py-1 rounded-md">UPCOMING</span>;
    }
  };
  
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy');
  };
  
  const getTimeRemaining = () => {
    if (isActive) {
      return `Ends ${formatDistanceToNow(competition.endDate, { addSuffix: true })}`;
    } else if (isPast) {
      return `Ended ${formatDistanceToNow(competition.endDate, { addSuffix: true })}`;
    } else {
      return `Starts ${formatDistanceToNow(competition.startDate, { addSuffix: true })}`;
    }
  };
  
  const prizePool = ethers.utils.formatEther(ethers.utils.parseEther(competition.prizePool));
  
  return (
    <Card 
      onClick={onClick}
      className="border border-gray-700 bg-gray-800/40 backdrop-blur-sm hover:bg-gray-800/60 transition-colors cursor-pointer overflow-hidden"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white">{competition.name}</h3>
          {getStatusBadge()}
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{competition.description}</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center text-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-[#91d3d1]/70" />
            <span className="text-xs">{formatDate(competition.startDate)}</span>
          </div>
          
          <div className="flex items-center text-gray-300 justify-end">
            <Users className="h-4 w-4 mr-2 text-[#91d3d1]/70" />
            <span className="text-xs">{competition.participants.length} participants</span>
          </div>
          
          <div className="flex items-center text-gray-300">
            <Trophy className="h-4 w-4 mr-2 text-[#e9c46a]" />
            <span className="text-xs">{getTimeRemaining()}</span>
          </div>
          
          <div className="flex items-center text-gray-300 justify-end">
            <Coins className="h-4 w-4 mr-2 text-[#e9c46a]" />
            <span className="text-xs">{prizePool} ETH prize</span>
          </div>
        </div>
      </div>
      
      <div className="h-1 bg-gradient-to-r from-[#91d3d1]/40 to-[#e9c46a]/40"></div>
    </Card>
  );
};
