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
import logoImage from "@assets/IMG_4006_1756925482771.png";
import dashboardImage from "@assets/350289255_818733789210084_3091965385777029372_n_1756932156175.JPG?url";

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
            backgroundImage: `url('${dashboardImage}')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-background/60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center">
          <img 
            src={logoImage} 
            alt="The Cawthra Open" 
            className="h-32 sm:h-40 w-auto object-contain mb-6"
            data-testid="logo-hero"
          />
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
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
          </div>
        </div>
      </section>
    </div>
  );
}
