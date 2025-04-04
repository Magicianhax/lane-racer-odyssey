
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Smartphone, Loader2, Trophy, Calendar, Clock, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { CompetitionCard } from '@/components/CompetitionCard';
import { CreateCompetitionModal } from '@/components/CreateCompetitionModal';
import { CompetitionDetailsDialog } from '@/components/CompetitionDetailsDialog';

const CompetitionsPage: React.FC = () => {
  const { isConnected, wallet, getActiveCompetitions, getUpcomingCompetitions, getPastCompetitions, getUserCompetitions } = useWeb3();
  const [activeCompetitions, setActiveCompetitions] = useState<any[]>([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<any[]>([]);
  const [pastCompetitions, setPastCompetitions] = useState<any[]>([]);
  const [userCompetitions, setUserCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        if (!isConnected) return;
        
        setIsLoading(true);
        
        const [active, upcoming, past, user] = await Promise.all([
          getActiveCompetitions(),
          getUpcomingCompetitions(),
          getPastCompetitions(),
          getUserCompetitions()
        ]);
        
        setActiveCompetitions(active);
        setUpcomingCompetitions(upcoming);
        setPastCompetitions(past);
        setUserCompetitions(user);
        
      } catch (error) {
        console.error("Error loading competitions:", error);
        toast.error("Failed to load competitions");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCompetitions();
  }, [isConnected, wallet.address]);
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleOpenDetails = (competition: any) => {
    setSelectedCompetition(competition);
    setDetailsDialogOpen(true);
  };
  
  const handleCreateCompetition = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setCreateModalOpen(true);
  };
  
  const LoadingScreen = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full bg-[#91d3d1]/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#91d3d1]/30 animate-spin"></div>
          <Loader2 className="w-20 h-20 text-[#91d3d1] animate-spin" />
        </div>
        <h3 className="text-[#91d3d1] text-2xl font-medium mb-2">Loading competitions</h3>
        <p className="text-gray-400 text-sm animate-pulse">Retrieving competition data...</p>
      </div>
      
      {/* Moving particles for dynamic effect */}
      <div className="absolute w-2 h-2 rounded-full bg-[#ffcd3c] top-1/4 left-1/4 animate-float"></div>
      <div className="absolute w-3 h-3 rounded-full bg-[#91d3d1]/40 bottom-1/3 right-1/3 animate-bounce-subtle"></div>
    </div>
  );
  
  const CompetitionsContent = () => (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] p-4 relative">
      {/* Back button inside the frame */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleGoBack}
          className="text-gray-300 hover:text-white hover:bg-gray-800/30 focus:bg-gray-800/30 focus:text-white active:bg-gray-800/50 focus:ring-0 focus:ring-offset-0 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-sm">Back</span>
        </Button>
      </div>
      
      <div className="flex justify-between items-center mt-6 mb-6">
        <h1 className="text-2xl font-bold text-white">Competitions</h1>
        <Button 
          onClick={handleCreateCompetition}
          variant="teal"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Create</span>
        </Button>
      </div>
      
      {isConnected ? (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="active" className="data-[state=active]:bg-[#91d3d1] data-[state=active]:text-gray-900">
              Active
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#91d3d1] data-[state=active]:text-gray-900">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-[#91d3d1] data-[state=active]:text-gray-900">
              Past
            </TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-[#91d3d1] data-[state=active]:text-gray-900">
              My Comps
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0 h-[calc(100%-80px)] overflow-y-auto pb-4">
            <div className="space-y-4">
              {activeCompetitions.length > 0 ? (
                activeCompetitions.map(comp => (
                  <CompetitionCard 
                    key={comp.id}
                    competition={comp}
                    onClick={() => handleOpenDetails(comp)}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No active competitions found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0 h-[calc(100%-80px)] overflow-y-auto pb-4">
            <div className="space-y-4">
              {upcomingCompetitions.length > 0 ? (
                upcomingCompetitions.map(comp => (
                  <CompetitionCard 
                    key={comp.id}
                    competition={comp}
                    onClick={() => handleOpenDetails(comp)}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No upcoming competitions scheduled</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="past" className="mt-0 h-[calc(100%-80px)] overflow-y-auto pb-4">
            <div className="space-y-4">
              {pastCompetitions.length > 0 ? (
                pastCompetitions.map(comp => (
                  <CompetitionCard 
                    key={comp.id}
                    competition={comp}
                    onClick={() => handleOpenDetails(comp)}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No past competitions</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="my" className="mt-0 h-[calc(100%-80px)] overflow-y-auto pb-4">
            <div className="space-y-4">
              {userCompetitions.length > 0 ? (
                userCompetitions.map(comp => (
                  <CompetitionCard 
                    key={comp.id}
                    competition={comp}
                    onClick={() => handleOpenDetails(comp)}
                  />
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>You haven't joined any competitions yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => handleCreateCompetition()}
                    className="mt-4 bg-gray-800/40 text-gray-300 border-gray-700"
                  >
                    Create your first competition
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center flex flex-col items-center justify-center h-[calc(100%-80px)]">
          <div className="bg-gray-800/30 rounded-xl p-8 max-w-md">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-[#91d3d1]/60" />
            <h2 className="text-xl font-bold text-white mb-2">Connect to view competitions</h2>
            <p className="text-gray-400 mb-6">You need to connect your wallet and create a username to browse competitions</p>
            <Button 
              variant="teal"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </div>
      )}
      
      <CreateCompetitionModal 
        isOpen={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
      
      {selectedCompetition && (
        <CompetitionDetailsDialog
          isOpen={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          competition={selectedCompetition}
        />
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b131e] via-[#172637] to-[#1f3a57] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[#91d3d1]/5 mix-blend-overlay pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
        {isMobile ? (
          <div className="w-full h-full">
            {isLoading ? <LoadingScreen /> : <CompetitionsContent />}
          </div>
        ) : (
          <div className="mobile-frame-container flex flex-col items-center justify-center">
            <div className="mobile-frame shadow-[0_0_40px_5px_rgba(255,255,255,0.15)]">
              <div className="notch"></div>
              <div className="side-button left-button"></div>
              <div className="side-button right-button-top"></div>
              <div className="side-button right-button-bottom"></div>
              <div className="mobile-screen flex items-center justify-center">
                {isLoading ? <LoadingScreen /> : <CompetitionsContent />}
              </div>
              <div className="home-indicator"></div>
            </div>
            <div className="mt-6 flex items-center justify-center text-[#91d3d1]/70 text-sm">
              <Smartphone className="w-4 h-4 mr-2" />
              <span>SuperSeed Lane Runner</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsPage;
