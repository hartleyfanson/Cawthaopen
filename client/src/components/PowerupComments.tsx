import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap } from "lucide-react";

interface PowerupCommentsProps {
  tournamentId: string;
  selectedRound?: 'all' | number;
}

interface PowerupComment {
  playerId: string;
  playerName: string;
  holeNumber: number;
  powerupNotes: string;
  roundNumber: number;
}

export function PowerupComments({ tournamentId, selectedRound = 'all' }: PowerupCommentsProps) {
  // Fetch power-up comments for this tournament
  const { data: powerupComments, isLoading } = useQuery<PowerupComment[]>({
    queryKey: ["/api/tournaments", tournamentId, "powerup-comments"],
    enabled: !!tournamentId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter comments by selected round if not 'all'
  const filteredComments = Array.isArray(powerupComments) 
    ? powerupComments.filter(comment => {
        if (selectedRound === 'all') return true;
        return comment.roundNumber === selectedRound;
      })
    : [];

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Power-Up Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading power-up comments...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show the section if no power-ups were used
  if (!filteredComments || filteredComments.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6" data-testid="powerup-comments-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Power-Up Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredComments.map((comment, index) => (
            <div 
              key={`${comment.playerId}-${comment.holeNumber}-${comment.roundNumber}`}
              className="bg-muted/50 rounded-lg p-4 border-l-4 border-accent"
              data-testid={`powerup-comment-${index}`}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-foreground mb-1">
                    {comment.playerName}: Used a power-up on hole {comment.holeNumber}
                    {selectedRound === 'all' && filteredComments.some(c => c.roundNumber !== comment.roundNumber) && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Round {comment.roundNumber})
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    <strong>Result:</strong> {comment.powerupNotes || "No additional notes provided"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}