
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export const CompetitionsButton: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    navigate('/competitions');
  };
  
  return (
    <Button
      onClick={handleNavigate}
      variant="leaderboard"
      className="shadow-lg shadow-yellow-500/20 flex items-center"
    >
      <Trophy className="h-4 w-4 mr-2" />
      Competitions
    </Button>
  );
};
