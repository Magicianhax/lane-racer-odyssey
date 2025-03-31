
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Leaderboard } from './Leaderboard';
import { AllScoresLeaderboard } from './AllScoresLeaderboard';
import { Trophy, List } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeaderboardDialog: React.FC<LeaderboardDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [activeTab, setActiveTab] = useState<string>("top-scores");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] max-h-[90vh] bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] text-white border-[#91d3d1]/20 p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <DialogTitle className="text-gradient">Superseed Leaderboard</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-sm">
            View top players and all scores
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="top-scores" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-5 pt-3">
            <TabsList className="w-full grid grid-cols-2 bg-zinc-800/50 border border-zinc-700/30">
              <TabsTrigger value="top-scores" className="flex items-center gap-1 data-[state=active]:bg-[#91d3d1]/10 data-[state=active]:text-[#91d3d1]">
                <Trophy className="h-3.5 w-3.5" />
                <span className="text-xs">Top Scores</span>
              </TabsTrigger>
              <TabsTrigger value="all-scores" className="flex items-center gap-1 data-[state=active]:bg-[#91d3d1]/10 data-[state=active]:text-[#91d3d1]">
                <List className="h-3.5 w-3.5" />
                <span className="text-xs">All Scores</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <TabsContent value="top-scores" className="p-5 pt-3 m-0">
              <Leaderboard />
            </TabsContent>
            <TabsContent value="all-scores" className="p-5 pt-3 m-0">
              <AllScoresLeaderboard />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
