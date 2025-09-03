import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TournamentHistory() {
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

  const { data: completedTournaments, isLoading: loadingTournaments } = useQuery({
    queryKey: ["/api/tournaments/status/completed"],
    enabled: !!user,
  });

  if (isLoading) {
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
      
      {/* Header */}
      <section className="py-12 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-accent mb-8 text-center">
            Tournament History
          </h2>
        </div>
      </section>

      {/* Tournament History */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingTournaments ? (
            <div className="text-center text-muted-foreground">Loading tournaments...</div>
          ) : completedTournaments?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTournaments.map((tournament: any) => (
                <Card 
                  key={tournament.id} 
                  className="bg-muted overflow-hidden card-shadow hover:scale-105 transition-transform"
                >
                  {/* Tournament image placeholder */}
                  <img 
                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
                    alt="Tournament celebration" 
                    className="w-full h-48 object-cover"
                  />
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-serif font-bold text-accent mb-2">
                      {tournament.name}
                    </h3>
                    
                    {tournament.winner && (
                      <div className="flex items-center space-x-3 mb-4">
                        <img 
                          src={tournament.winner.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                          alt="Tournament champion" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-foreground">
                            {tournament.winner.firstName} {tournament.winner.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">Champion</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-accent">
                          {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course:</span>
                        <span className="text-accent">{tournament.course?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    {tournament.championsMeal && (
                      <div className="bg-primary rounded-lg p-3 mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Champions Dinner</div>
                        <div className="text-accent font-medium">{tournament.championsMeal}</div>
                      </div>
                    )}
                    
                    <Link href={`/tournaments/${tournament.id}/leaderboard`}>
                      <Button className="w-full bg-secondary text-secondary-foreground hover:bg-accent">
                        View Full Results
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-serif font-bold text-accent mb-4">
                  No Completed Tournaments
                </h3>
                <p className="text-muted-foreground mb-6">
                  Tournament history will appear here once tournaments are completed.
                </p>
                <Link href="/tournaments/create">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-accent">
                    Create a Tournament
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
