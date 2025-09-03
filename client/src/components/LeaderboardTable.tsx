import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface LeaderboardTableProps {
  leaderboard: any[];
  courseId?: string;
}

export function LeaderboardTable({ leaderboard, courseId }: LeaderboardTableProps) {
  const [showingFrontNine, setShowingFrontNine] = useState(true);

  const { data: holes } = useQuery({
    queryKey: ["/api/courses", courseId, "holes"],
    enabled: !!courseId,
  });

  // Calculate which holes to display based on current view
  const allHoles = Array.isArray(holes) ? holes : [];
  const displayHoles = showingFrontNine 
    ? allHoles.slice(0, 9)  // Front 9: holes 1-9
    : allHoles.slice(9, 18); // Back 9: holes 10-18
  
  // Calculate if a score is under par
  const isUnderPar = (score: number, par: number) => score < par;

  // Mock hole scores for demonstration - in real app this would come from API
  const getPlayerHoleScores = (playerId: string) => {
    // This would be replaced with actual API call to get player's round scores
    return displayHoles.map((hole: any) => {
      // Random scores for demo - replace with actual data
      const score = Math.floor(Math.random() * 3) + hole.par - 1;
      return { holeId: hole.id, score, par: hole.par };
    });
  };

  return (
    <Card className="bg-background overflow-hidden card-shadow">
      {/* Toggle buttons for Front/Back Nine */}
      <div className="bg-muted/50 p-3 border-b border-border flex justify-center">
        <div className="flex bg-background rounded-lg p-1 shadow-sm">
          <Button
            onClick={() => setShowingFrontNine(true)}
            variant={showingFrontNine ? "default" : "ghost"}
            size="sm"
            className={`px-4 py-2 text-sm transition-all ${
              showingFrontNine 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            data-testid="button-front-nine"
          >
            Front 9
          </Button>
          <Button
            onClick={() => setShowingFrontNine(false)}
            variant={!showingFrontNine ? "default" : "ghost"}
            size="sm"
            className={`px-4 py-2 text-sm transition-all ${
              !showingFrontNine 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            data-testid="button-back-nine"
          >
            Back 9
          </Button>
        </div>
      </div>
      
      {/* Header with hole numbers */}
      <div className="bg-muted p-4 border-b border-border">
        <div className="grid grid-cols-12 gap-1 text-center text-sm font-medium text-muted-foreground">
          <div className="col-span-3 text-left">PLAYER</div>
          {displayHoles.map((hole: any, index: number) => (
            <div key={hole.id} data-testid={`header-hole-${hole.holeNumber}`}>
              {hole.holeNumber}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1 text-center text-sm text-muted-foreground mt-1">
          <div className="col-span-3 text-left">PAR</div>
          {displayHoles.map((hole: any) => (
            <div key={`par-${hole.id}`} data-testid={`header-par-${hole.holeNumber}`}>
              {hole.par}
            </div>
          ))}
        </div>
      </div>
      
      {/* Player rows */}
      <div className="divide-y divide-border">
        {leaderboard.map((player: any, index: number) => {
          const holeScores = getPlayerHoleScores(player.playerId);
          const totalPar = displayHoles.reduce((sum: any, hole: any) => sum + hole.par, 0);
          const playerScore = holeScores.reduce((sum: any, score: any) => sum + score.score, 0);
          const scoreToPar = playerScore - totalPar;
          const isLeader = index === 0;
          
          return (
            <div 
              key={player.playerId}
              className={`p-4 hover:bg-muted/30 transition-colors ${
                isLeader ? 'bg-primary/30 border-l-4 border-secondary' : ''
              }`}
              data-testid={`row-player-${player.playerId}`}
            >
              <div className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-3 flex items-center space-x-3">
                  <div className={`text-xl font-bold ${
                    isLeader ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={player.profileImageUrl || `https://images.unsplash.com/photo-150${7003 + index}211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                      alt={`${player.playerName} profile`}
                    />
                    <AvatarFallback>
                      {player.playerName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={`font-semibold ${
                      isLeader ? 'text-accent' : 'text-foreground'
                    }`} data-testid={`text-player-name-${player.playerId}`}>
                      {player.playerName}
                    </div>
                    <div className="text-sm text-secondary">
                      {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar} ({playerScore})
                    </div>
                  </div>
                </div>
                
                {/* Hole scores */}
                {holeScores.map((score, holeIndex) => {
                  const isUnder = isUnderPar(score.score, score.par);
                  return (
                    <div 
                      key={holeIndex}
                      className="text-center"
                      data-testid={`score-hole-${holeIndex + 1}-player-${player.playerId}`}
                    >
                      {isUnder ? (
                        <div className="under-par mx-auto">
                          {score.score}
                        </div>
                      ) : (
                        <div className={isLeader ? 'text-accent' : 'text-foreground'}>
                          {score.score}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {leaderboard.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No scores recorded yet</p>
        </div>
      )}
    </Card>
  );
}
