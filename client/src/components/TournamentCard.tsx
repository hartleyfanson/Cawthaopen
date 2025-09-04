import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Check } from "lucide-react";

interface TournamentCardProps {
  tournament: any;
  status: "active" | "upcoming" | "completed";
}

export function TournamentCard({ tournament, status }: TournamentCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tournament players to check if current user has joined
  const { data: tournamentPlayers } = useQuery({
    queryKey: ["/api/tournaments", tournament.id, "players"],
    enabled: !!user && !!tournament.id && status === "upcoming",
  });

  // Check if current user is already joined
  const isUserJoined = Array.isArray(tournamentPlayers) && 
    tournamentPlayers.some((player: any) => player.playerId === (user as any)?.id);

  const joinTournamentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/tournaments/${tournament.id}/join`, { teeSelection: "white" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament.id, "players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournament.id, "leaderboard"] });
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

  const handleJoinTournament = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUserJoined && !joinTournamentMutation.isPending) {
      joinTournamentMutation.mutate();
    }
  };

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
    // Date-based logic instead of status-based
    const now = new Date();
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
    
    if (startDate && endDate) {
      // Compare dates only (ignore time) for user-friendly behavior
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      // Tournament is finished (past end date)
      if (nowDateOnly > endDateOnly) {
        return (
          <Link href={`/tournaments/${tournament.id}/leaderboard`}>
            <Button 
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-view-results"
            >
              View Full Results
            </Button>
          </Link>
        );
      }
      
      // Tournament is active (today is within date range)
      if (nowDateOnly >= startDateOnly && nowDateOnly <= endDateOnly) {
        if (isUserJoined) {
          return (
            <Link href={`/tournaments/${tournament.id}/leaderboard`}>
              <Button 
                className="bg-green-600 text-white hover:bg-green-700"
                data-testid="button-tournament-joined"
              >
                <Check className="h-4 w-4 mr-2" />
                Joined
              </Button>
            </Link>
          );
        }
        return (
          <Button 
            onClick={handleJoinTournament}
            disabled={joinTournamentMutation.isPending}
            className="bg-secondary text-secondary-foreground hover:bg-accent"
            data-testid="button-join-tournament"
          >
            {joinTournamentMutation.isPending ? "Joining..." : "Join Tournament"}
          </Button>
        );
      }
    }
    
    // Tournament is upcoming (before start date) or fallback
    if (isUserJoined) {
      return (
        <Link href={`/tournaments/${tournament.id}/leaderboard`}>
          <Button 
            className="bg-green-600 text-white hover:bg-green-700"
            data-testid="button-tournament-joined"
          >
            <Check className="h-4 w-4 mr-2" />
            Joined
          </Button>
        </Link>
      );
    }
    return (
      <Button 
        onClick={handleJoinTournament}
        disabled={joinTournamentMutation.isPending}
        className="bg-secondary text-secondary-foreground hover:bg-accent"
        data-testid="button-join-tournament"
      >
        {joinTournamentMutation.isPending ? "Joining..." : "Register"}
      </Button>
    );
  };

  return (
    <Card 
      className="bg-primary border border-border hover:border-secondary transition-colors cursor-pointer overflow-hidden"
      data-testid={`card-tournament-${tournament.id}`}
    >
      {/* Tournament Header Image */}
      {tournament.headerImageUrl && (
        <div className="relative h-32 w-full bg-muted">
          <img 
            src={tournament.headerImageUrl} 
            alt={`${tournament.name} tournament photo`}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>
      )}
      
      <CardContent className="p-4 relative pb-16">
        {!tournament.headerImageUrl && (
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-xl font-bold text-primary-foreground">
              {tournament.name}
            </h4>
            {getStatusBadge()}
          </div>
        )}
        
        {tournament.headerImageUrl && (
          <div className="mb-3">
            <h4 className="text-xl font-bold text-primary-foreground">
              {tournament.name}
            </h4>
          </div>
        )}
        
        <p className="text-base font-medium text-muted-foreground mb-2">
          {tournament.course?.name} {tournament.course?.location}
        </p>
        
        {tournament.description && (
          <p className="text-base text-muted-foreground mb-3 line-clamp-2">
            {tournament.description}
          </p>
        )}
        
        <div className="mb-4">
          <span className="text-sm text-muted-foreground">
            {tournament.playerCount || 0} Players
          </span>
        </div>
        
        {/* Action button and start date aligned at bottom */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          {tournament.startDate && (
            <div className="text-xs text-muted-foreground">
              Starts: {new Date(tournament.startDate).toLocaleDateString()}
            </div>
          )}
          <div>
            {getActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
