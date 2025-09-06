import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { RoundScorecard } from "@/components/RoundScorecard";
import { ShareScorecard } from "@/components/ShareScorecard";
import { FutureTournamentView } from "@/components/FutureTournamentView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { EditScoreDialog } from "@/components/EditScoreDialog";
import { PowerupComments } from "@/components/PowerupComments";


// Component to show all courses and date range for multi-round tournaments
function AllRoundsInfo({ tournament, tournamentRounds }: { tournament: any; tournamentRounds: any[] }) {
  if (!Array.isArray(tournamentRounds) || tournamentRounds.length === 0) {
    return (
      <div className="text-xl text-secondary space-y-1">
        <p>Tournament • All Rounds</p>
        <p className="text-lg">Multiple Rounds</p>
      </div>
    );
  }

  return (
    <div className="text-xl text-secondary space-y-1">
      <p>Multi-Round Tournament • {tournamentRounds.length} Rounds</p>
      <p className="text-lg">
        {tournament?.startDate && tournament?.endDate
          ? `${new Date(tournament.startDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - ${new Date(tournament.endDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}`
          : 'Date Range TBD'
        }
      </p>
    </div>
  );
}

export default function TournamentLeaderboard() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRound, setSelectedRound] = useState<'all' | number>('all');
  const [editScoreDialogOpen, setEditScoreDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: tournament, isLoading: loadingTournament } = useQuery({
    queryKey: ["/api/tournaments", id],
    enabled: !!user && !!id,
  });

  // Fetch tournament rounds for round selection
  const { data: tournamentRounds } = useQuery({
    queryKey: ["/api/tournaments", id, "rounds"],
    enabled: !!user && !!id,
  });

  // Dynamic course loading based on selected round and tournament data
  const currentCourseId = useMemo(() => {
    if (!tournament) return null;
    
    // For multi-round tournaments, try to get course from round data
    if (selectedRound !== 'all' && tournamentRounds && Array.isArray(tournamentRounds)) {
      // If we have round-specific course data, use it
      const roundData = tournamentRounds.find((r: any) => r.roundNumber === selectedRound);
      if (roundData?.courseId) {
        return roundData.courseId;
      }
    }
    
    // Fallback to tournament's main course
    return (tournament as any)?.courseId;
  }, [tournament, selectedRound, tournamentRounds]);

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["/api/courses", currentCourseId],
    enabled: !!currentCourseId,
  });

  // Fetch current round data based on selected round (for scorecard generation)
  const { data: currentRound } = useQuery({
    queryKey: ["/api/rounds", id, selectedRound === 'all' ? "1" : selectedRound.toString()],
    enabled: !!user && !!id,
  });

  const { data: currentRoundScores } = useQuery({
    queryKey: ["/api/rounds", (currentRound as any)?.id, "scores"],
    enabled: !!(currentRound as any)?.id,
  });

  // Check if user has submitted scores for this tournament
  const hasSubmittedScores = Array.isArray(currentRoundScores) && currentRoundScores.length > 0;

  const { data: tournamentPlayers } = useQuery({
    queryKey: ["/api/tournaments", id, "players"],
    enabled: !!user && !!id,
  });

  const queryClient = useQueryClient();
  
  const joinTournamentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/tournaments/${id}/join`, { teeSelection: "white" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "leaderboard"] });
      toast({
        title: "Tournament Joined",
        description: "You have successfully joined the tournament!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join tournament",
        variant: "destructive",
      });
    },
  });
  
  // Check if current user is already joined
  const isUserJoined = Array.isArray(tournamentPlayers) && 
    tournamentPlayers.some((player: any) => player.playerId === (user as any)?.id);

  // Component to show course name for individual round buttons
  const RoundCourseDisplay = ({ courseId }: { courseId?: string }) => {
    const { data: course } = useQuery({
      queryKey: ["/api/courses", courseId],
      queryFn: async () => {
        if (!courseId) return null;
        const response = await fetch(`/api/courses/${courseId}`);
        return response.ok ? response.json() : null;
      },
      enabled: !!courseId,
    });

    if (!course) return <span className="text-xs opacity-75">Course</span>;
    
    return (
      <span className="text-xs opacity-75 max-w-24 truncate" title={`${course.name} • ${course.location}`}>
        {course.name}
      </span>
    );
  };

  // Check if tournament is future-dated using consistent date-based logic
  const isFutureTournament = useMemo(() => {
    const now = new Date();
    const startDate = (tournament as any)?.startDate ? new Date((tournament as any).startDate) : null;
    
    if (!startDate) return true; // If no start date, consider it future
    
    // Compare dates only (ignore time) for user-friendly behavior
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    // Tournament is future if start date hasn't arrived yet
    return nowDateOnly < startDateOnly;
  }, [tournament]);

  // Fetch leaderboard with live updates based on tournament status
  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
    queryKey: selectedRound === 'all' 
      ? ["/api/tournaments", id, "leaderboard"]
      : ["/api/tournaments", id, "leaderboard", "round", selectedRound],
    enabled: !!user && !!id,
    refetchInterval: !isFutureTournament ? 5000 : 30000, // Live updates every 5s when active, slower when future
  });

  if (isLoading || loadingTournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-accent">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Tournament Header */}
      <section className="py-12 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-accent mb-2">
              {(tournament as any)?.name || 'Tournament Leaderboard'}
            </h2>
            {/* Tournament Info with All Courses and Date Range */}
            {(() => {
              if (selectedRound === 'all' && tournamentRounds && Array.isArray(tournamentRounds) && tournamentRounds.length > 1) {
                return (
                  <AllRoundsInfo 
                    tournament={tournament} 
                    tournamentRounds={tournamentRounds as any[]} 
                  />
                );
              } else if (selectedRound !== 'all' && tournamentRounds && Array.isArray(tournamentRounds)) {
                return (
                  <div className="text-xl text-secondary space-y-1">
                    <p>{(course as any)?.name || 'Course'} • {(course as any)?.location || 'Location'}</p>
                    <p className="text-lg">
                      Round {selectedRound} • {(tournamentRounds as any[]).find((r: any) => r.roundNumber === selectedRound)?.roundDate 
                        ? new Date((tournamentRounds as any[]).find((r: any) => r.roundNumber === selectedRound)?.roundDate).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Date TBD'
                      }
                    </p>
                  </div>
                );
              } else {
                return (
                  <div className="text-xl text-secondary space-y-1">
                    <p>{(course as any)?.name || 'Course'} • {(course as any)?.location || 'Location'}</p>
                    <p className="text-lg">
                      {selectedRound === 'all' ? 'All Rounds Combined' : (tournament as any)?.startDate 
                        ? new Date((tournament as any).startDate).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Date TBD'
                      }
                    </p>
                  </div>
                );
              }
            })()}
            
            {/* Round Selection - show only if tournament has multiple rounds */}
            {tournamentRounds && Array.isArray(tournamentRounds) && tournamentRounds.length > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex flex-wrap justify-center bg-background rounded-lg p-1 shadow-sm gap-1">
                  <Button
                    onClick={() => setSelectedRound('all')}
                    variant={selectedRound === 'all' ? "default" : "ghost"}
                    size="sm"
                    className={`px-3 py-2 text-xs sm:text-sm transition-all ${
                      selectedRound === 'all'
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    data-testid="button-round-all"
                  >
                    All Rounds
                  </Button>
                  {tournamentRounds.map((round: any) => {
                    // Find course for this round
                    const courseId = round.courseId || (tournament as any)?.courseId;
                    return (
                      <Button
                        key={round.id}
                        onClick={() => setSelectedRound(round.roundNumber)}
                        variant={selectedRound === round.roundNumber ? "default" : "ghost"}
                        size="sm"
                        className={`px-3 py-2 text-xs sm:text-sm transition-all whitespace-nowrap ${
                          selectedRound === round.roundNumber
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`button-round-${round.roundNumber}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-semibold">Round {round.roundNumber}</span>
                          <RoundCourseDisplay courseId={courseId} />
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
            {/* Show Live Scoring/Edit Score buttons when current date is between tournament start and end dates */}
            {(() => {
              const now = new Date();
              const startDate = (tournament as any)?.startDate ? new Date((tournament as any).startDate) : null;
              const endDate = (tournament as any)?.endDate ? new Date((tournament as any).endDate) : null;
              
              if (!startDate || !endDate || !isUserJoined) return false;
              
              // Compare dates only (ignore time) for more user-friendly behavior
              const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              
              const isTournamentActive = nowDateOnly >= startDateOnly && nowDateOnly <= endDateOnly;
                
              return isTournamentActive;
            })() && (
              <>
                <Link href={`/tournaments/${id}/scoring`}>
                  <Button 
                    className="bg-secondary text-secondary-foreground hover:bg-accent"
                    data-testid={hasSubmittedScores ? "button-live-scoring" : "button-start-scoring"}
                  >
                    {hasSubmittedScores ? "Live Scoring" : "Start Scoring"}
                  </Button>
                </Link>
                
                {/* Show Edit Score button only if user has submitted scores */}
                {hasSubmittedScores && (
                  <Button 
                    onClick={() => setEditScoreDialogOpen(true)}
                    variant="outline"
                    className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                    data-testid="button-edit-score"
                  >
                    Edit Score
                  </Button>
                )}
              </>
            )}
            
            {/* Show Join Tournament button for future tournaments using date-based logic */}
            {isFutureTournament && !isUserJoined && (
              <Button 
                onClick={() => joinTournamentMutation.mutate()}
                disabled={joinTournamentMutation.isPending}
                className="bg-secondary text-secondary-foreground hover:bg-accent"
                data-testid="button-join-tournament"
              >
                {joinTournamentMutation.isPending ? "Joining..." : "Join Tournament"}
              </Button>
            )}
            
            <Link href={`/tournaments/${id}/gallery`}>
              <Button 
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                data-testid="button-gallery"
              >
                Gallery
              </Button>
            </Link>
            {/* Only show Share Scorecard for active/completed tournaments using date-based logic */}
            {!isFutureTournament && (
              <ShareScorecard 
                tournamentId={id || ''}
                roundData={currentRound}
                playerData={user}
                selectedRound={selectedRound}
                tournamentRounds={tournamentRounds as any[]}
              />
            )}
          </div>
        </div>
      </section>

      {/* Tournament Content */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isFutureTournament ? (
            // Show future tournament view with course scorecard and players
            <FutureTournamentView 
              tournament={tournament}
              tournamentId={id || ''}
              course={course}
              selectedRound={selectedRound}
              tournamentRounds={tournamentRounds as any[]}
            />
          ) : loadingLeaderboard ? (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">Loading leaderboard...</div>
              </CardContent>
            </Card>
          ) : Array.isArray(leaderboard) && leaderboard.length ? (
            <>
              <LeaderboardTable 
                leaderboard={leaderboard} 
                courseId={currentCourseId || (tournament as any)?.courseId || ''}
                tournamentId={id}
                tournament={tournament}
                selectedRound={selectedRound}
                tournamentRounds={tournamentRounds as any[]}
              />
              
              <PowerupComments 
                tournamentId={id || ''}
                selectedRound={selectedRound}
              />
            </>
          ) : Array.isArray(tournamentPlayers) && tournamentPlayers.length ? (
            // Show registered players even with no scores
            <Card className="bg-muted">
              <CardContent className="p-6">
                <h3 className="text-xl font-serif font-bold text-accent mb-4 text-center">
                  {(tournament as any)?.status === "upcoming" ? "Registered Players" : "No Scores Yet"}
                </h3>
                <div className="space-y-3">
                  {tournamentPlayers.map((player: any, index: number) => (
                    <div 
                      key={player.playerId} 
                      className="flex items-center justify-between bg-background rounded-lg p-4 border border-border"
                      data-testid={`registered-player-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={player.player?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                          alt={`${player.player?.firstName || 'Player'}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-foreground">
                            {player.player?.firstName || 'Player'} {player.player?.lastName || ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(tournament as any)?.status === "upcoming" ? "Ready to play" : "No scores yet"}
                      </div>
                    </div>
                  ))}
                </div>
                {(tournament as any)?.status === "active" && (
                  <div className="text-center mt-6">
                    <p className="text-muted-foreground mb-4">
                      Tournament is active! Players can start scoring.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-serif font-bold text-accent mb-4">
                  {(tournament as any)?.status === "upcoming" ? "No Players Registered" : "No Scores Yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {(tournament as any)?.status === "upcoming" 
                    ? "Be the first to join this tournament!" 
                    : "Be the first to submit your scorecard for this tournament."}
                </p>
                {(tournament as any)?.status === "upcoming" && !isUserJoined ? (
                  <Button 
                    onClick={() => joinTournamentMutation.mutate()}
                    disabled={joinTournamentMutation.isPending}
                    className="bg-secondary text-secondary-foreground hover:bg-accent"
                  >
                    {joinTournamentMutation.isPending ? "Joining..." : "Join Tournament"}
                  </Button>
                ) : (tournament as any)?.status === "active" && (
                  <Link href={`/tournaments/${id}/scoring`}>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-accent">
                      Start Scoring
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Edit Score Dialog */}
      <EditScoreDialog 
        open={editScoreDialogOpen}
        onOpenChange={setEditScoreDialogOpen}
        tournamentId={id || ''}
        currentRoundData={currentRound}
      />
    </div>
  );
}
