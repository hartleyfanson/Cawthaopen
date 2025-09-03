import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface TournamentCardProps {
  tournament: any;
  status: "active" | "upcoming" | "completed";
}

export function TournamentCard({ tournament, status }: TournamentCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-white">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-yellow-600 text-white">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-gray-600 text-white">Completed</Badge>;
      default:
        return null;
    }
  };

  const getActionButton = () => {
    switch (status) {
      case "active":
        return (
          <Link href={`/tournaments/${tournament.id}/leaderboard`}>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-view-leaderboard"
            >
              View Leaderboard
            </Button>
          </Link>
        );
      case "upcoming":
        return (
          <Link href={`/tournaments/${tournament.id}/leaderboard`}>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-join-tournament"
            >
              Join Tournament
            </Button>
          </Link>
        );
      case "completed":
        return (
          <Link href={`/tournaments/${tournament.id}/leaderboard`}>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-view-results"
            >
              View Results
            </Button>
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className="bg-primary border border-border hover:border-secondary transition-colors cursor-pointer"
      data-testid={`card-tournament-${tournament.id}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-lg font-semibold text-primary-foreground">
            {tournament.name}
          </h4>
          {getStatusBadge()}
        </div>
        
        <p className="text-muted-foreground mb-2">
          {tournament.course?.name} • {tournament.course?.location}
        </p>
        
        {tournament.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {tournament.description}
          </p>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {tournament.playerCount || 0} Players
          </span>
          {getActionButton()}
        </div>
        
        {tournament.startDate && (
          <div className="mt-2 text-xs text-muted-foreground">
            Starts: {new Date(tournament.startDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
