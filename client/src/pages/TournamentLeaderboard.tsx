import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { ShareScorecard } from "@/components/ShareScorecard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function TournamentLeaderboard() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["/api/courses", (tournament as any)?.courseId],
    enabled: !!(tournament as any)?.courseId,
  });

  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["/api/tournaments", id, "leaderboard"],
    enabled: !!user && !!id,
  });

  const { data: currentRound } = useQuery({
    queryKey: ["/api/rounds", id, "1"],
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
            <p className="text-xl text-secondary">
              {(course as any)?.name || 'Course'} • {(course as any)?.location || 'Location'}
            </p>
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
            {/* Show Live Scoring/Edit Score button only for active tournaments */}
            {(tournament as any)?.status === "active" && (
              <Link href={`/tournaments/${id}/scoring`}>
                <Button 
                  className="bg-secondary text-secondary-foreground hover:bg-accent"
                  data-testid={hasSubmittedScores ? "button-edit-score" : "button-live-scoring"}
                >
                  {hasSubmittedScores ? "Edit Score" : "Live Scoring"}
                </Button>
              </Link>
            )}
            
            {/* Show Join Tournament button for upcoming tournaments */}
            {(tournament as any)?.status === "upcoming" && !isUserJoined && (
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
            <ShareScorecard 
              tournamentId={id || ''}
              roundData={currentRound}
              playerData={user}
            />
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingLeaderboard ? (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">Loading leaderboard...</div>
              </CardContent>
            </Card>
          ) : Array.isArray(leaderboard) && leaderboard.length ? (
            <LeaderboardTable 
              leaderboard={leaderboard} 
              courseId={(tournament as any)?.courseId || ''}
            />
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
                          <div className="text-sm text-muted-foreground">
                            Tees: {player.teeSelection || 'White'}
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
    </div>
  );
}
