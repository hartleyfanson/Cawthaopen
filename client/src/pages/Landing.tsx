import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="tco-logo">
                <span>TCO</span>
              </div>
              <h1 className="text-xl font-serif font-bold text-primary-foreground hidden sm:block">
                The Cawthra Open
              </h1>
            </div>
            
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-login"
            >
              Login
            </Button>
          </div>
        </div>
      </nav>

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
            Experience championship golf at its finest. Track your rounds, compete in tournaments, and celebrate victory.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-serif font-bold text-accent mb-8 text-center">
            Tournament Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-primary card-shadow">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h4 className="text-xl font-serif font-bold text-accent mb-2">
                  Tournament Management
                </h4>
                <p className="text-muted-foreground">
                  Create and manage professional golf tournaments with comprehensive scoring and leaderboards.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-primary card-shadow">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="text-xl font-serif font-bold text-accent mb-2">
                  Live Scoring
                </h4>
                <p className="text-muted-foreground">
                  Track scores hole-by-hole with detailed statistics and powerup tracking.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-primary card-shadow">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📸</div>
                <h4 className="text-xl font-serif font-bold text-accent mb-2">
                  Tournament Gallery
                </h4>
                <p className="text-muted-foreground">
                  Capture and share memorable moments from every tournament round.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-accent mb-4">
            Ready to Join The Cawthra Open?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to start tracking your golf performance and join tournaments.
          </p>
          <Button
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            className="bg-secondary text-secondary-foreground hover:bg-accent font-semibold"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="tco-logo">
              <span>TCO</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-accent">The Cawthra Open</h3>
          </div>
          <p className="text-muted-foreground">
            &copy; 2024 The Cawthra Open. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
