
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Leaderboard } from './Leaderboard';
import { Trophy } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeaderboardDialog: React.FC<LeaderboardDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-900 text-white border-zinc-800 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <DialogTitle className="text-gradient">Global Leaderboard</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Top players in the Superseed Lane Runner game
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 pt-3">
            <Leaderboard />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
