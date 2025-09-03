import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
          
          <div className="flex justify-center gap-4">
            <Link href={`/tournaments/${id}/scoring`}>
              <Button 
                className="bg-secondary text-secondary-foreground hover:bg-accent"
                data-testid="button-live-scoring"
              >
                Live Scoring
              </Button>
            </Link>
            <Link href={`/tournaments/${id}/gallery`}>
              <Button 
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                data-testid="button-gallery"
              >
                Gallery
              </Button>
            </Link>
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
          ) : (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-serif font-bold text-accent mb-4">
                  No Scores Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to submit your scorecard for this tournament.
                </p>
                <Link href={`/tournaments/${id}/scoring`}>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-accent">
                    Start Scoring
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
