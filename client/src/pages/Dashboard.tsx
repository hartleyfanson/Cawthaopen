import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { TournamentCard } from "@/components/TournamentCard";
import { UserStats } from "@/components/UserStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
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

  const { data: activeTournaments, isLoading: loadingTournaments } = useQuery({
    queryKey: ["/api/tournaments/status/active"],
    enabled: !!user,
    retry: false,
  });

  const { data: upcomingTournaments, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["/api/tournaments/status/upcoming"],
    enabled: !!user,
    retry: false,
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
      
      {/* Hero Section */}
      <section className="relative h-64 sm:h-80 hero-gradient overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=800')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-background/60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <h2 className="text-4xl sm:text-6xl font-serif font-bold text-accent mb-4">
            THE CAWTHRA OPEN
          </h2>
          <p className="text-xl sm:text-2xl text-secondary mb-2">
            A Weekend of Competition in Sport
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Welcome back, {(user as any)?.firstName || 'Golfer'}! Ready for your next round?
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Active Tournaments */}
            <Card className="bg-muted card-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-serif font-bold text-accent">
                  Active Tournaments
                </CardTitle>
                <Link href="/tournaments/create">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-secondary text-secondary-foreground hover:bg-accent"
                    data-testid="button-create-tournament"
                  >
                    Create Tournament
                  </Button>
                </Link>
              </CardHeader>
              
              <CardContent>
                {loadingTournaments || loadingUpcoming ? (
                  <div className="text-muted-foreground">Loading tournaments...</div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(activeTournaments) && activeTournaments.map((tournament: any) => (
                      <TournamentCard 
                        key={tournament.id} 
                        tournament={tournament} 
                        status="active"
                      />
                    ))}
                    {Array.isArray(upcomingTournaments) && upcomingTournaments.map((tournament: any) => (
                      <TournamentCard 
                        key={tournament.id} 
                        tournament={tournament} 
                        status="upcoming"
                      />
                    ))}
                    {(!Array.isArray(activeTournaments) || !activeTournaments.length) && (!Array.isArray(upcomingTournaments) || !upcomingTournaments.length) && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No active tournaments</p>
                        <Link href="/tournaments/create">
                          <Button className="bg-secondary text-secondary-foreground hover:bg-accent">
                            Create Your First Tournament
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* User Stats */}
            <UserStats userId={(user as any)?.id || ''} />
          </div>

          {/* Quick Actions */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/tournaments/history">
              <Card className="bg-primary card-shadow hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h4 className="text-xl font-serif font-bold text-accent mb-2">
                    Tournament History
                  </h4>
                  <p className="text-muted-foreground">
                    View past tournaments and champions
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/tournaments/create">
              <Card className="bg-primary card-shadow hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">➕</div>
                  <h4 className="text-xl font-serif font-bold text-accent mb-2">
                    Create Tournament
                  </h4>
                  <p className="text-muted-foreground">
                    Set up a new golf tournament
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Card className="bg-primary card-shadow">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="text-xl font-serif font-bold text-accent mb-2">
                  Your Statistics
                </h4>
                <p className="text-muted-foreground">
                  Track your golf performance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
