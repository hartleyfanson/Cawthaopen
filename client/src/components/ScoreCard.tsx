import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreCardProps {
  roundId: string;
  playerId: string;
  playerName: string;
  profileImageUrl?: string;
}

export function ScoreCard({ roundId, playerId, playerName, profileImageUrl }: ScoreCardProps) {
  const { data: scores, isLoading } = useQuery({
    queryKey: ["/api/rounds", roundId, "scores"],
    enabled: !!roundId,
  });

  const { data: round } = useQuery({
    queryKey: ["/api/rounds", roundId],
    enabled: !!roundId,
  });

  if (isLoading) {
    return (
      <Card className="bg-muted">
        <CardContent className="p-4">
          <div className="text-muted-foreground">Loading scorecard...</div>
        </CardContent>
      </Card>
    );
  }

  if (!scores?.length) {
    return (
      <Card className="bg-muted">
        <CardContent className="p-4">
          <div className="text-muted-foreground">No scores recorded</div>
        </CardContent>
      </Card>
    );
  }

  // Group scores by 9-hole segments
  const frontNine = scores.slice(0, 9);
  const backNine = scores.slice(9, 18);

  const calculateTotal = (holeScores: any[]) => {
    return holeScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
  };

  const calculatePar = (holeScores: any[]) => {
    return holeScores.reduce((sum, score) => sum + (score.hole?.par || 0), 0);
  };

  const getScoreIcon = (strokes: number, par: number) => {
    if (strokes < par) return <TrendingDown className="h-3 w-3 text-green-500" />;
    if (strokes > par) return <TrendingUp className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getScoreBadge = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return <Badge className="bg-green-700 text-white text-xs">Eagle</Badge>;
    if (diff === -1) return <Badge className="bg-green-600 text-white text-xs">Birdie</Badge>;
    if (diff === 0) return <Badge className="bg-gray-600 text-white text-xs">Par</Badge>;
    if (diff === 1) return <Badge className="bg-yellow-600 text-white text-xs">Bogey</Badge>;
    if (diff >= 2) return <Badge className="bg-red-600 text-white text-xs">Double+</Badge>;
    return null;
  };

  const frontTotal = calculateTotal(frontNine);
  const backTotal = calculateTotal(backNine);
  const totalStrokes = frontTotal + backTotal;
  
  const frontPar = calculatePar(frontNine);
  const backPar = calculatePar(backNine);
  const totalPar = frontPar + backPar;
  
  const scoreToPar = totalStrokes - totalPar;

  return (
    <Card className="bg-background card-shadow">
      <CardHeader className="bg-primary">
        <CardTitle className="text-accent flex items-center gap-3">
          <img
            src={profileImageUrl || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
            alt={`${playerName} profile`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="text-lg font-semibold" data-testid={`text-player-${playerId}`}>
              {playerName}
            </div>
            <div className="text-sm text-secondary">
              {scoreToPar === 0 ? 'Even Par' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar} 
              <span className="ml-2">({totalStrokes})</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Front Nine */}
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">FRONT NINE</h4>
          <div className="grid grid-cols-10 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">Hole</div>
            {frontNine.map((score: any, index: number) => (
              <div key={score.holeId} className="text-center font-medium" data-testid={`hole-${index + 1}`}>
                {index + 1}
              </div>
            ))}
            <div className="font-medium text-muted-foreground">OUT</div>
            
            <div className="font-medium text-muted-foreground">Par</div>
            {frontNine.map((score: any) => (
              <div key={`par-${score.holeId}`} className="text-center text-muted-foreground">
                {score.hole?.par || 4}
              </div>
            ))}
            <div className="font-bold text-muted-foreground">{frontPar}</div>
            
            <div className="font-medium text-foreground">Score</div>
            {frontNine.map((score: any) => {
              const isUnder = score.strokes < (score.hole?.par || 4);
              return (
                <div key={`score-${score.holeId}`} className="text-center">
                  {isUnder ? (
                    <div className="under-par mx-auto text-sm w-6 h-6 text-foreground">
                      {score.strokes}
                    </div>
                  ) : (
                    <div className="text-foreground font-semibold">
                      {score.strokes}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="font-bold text-accent">{frontTotal}</div>
          </div>
        </div>
        
        {/* Back Nine */}
        {backNine.length > 0 && (
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">BACK NINE</h4>
            <div className="grid grid-cols-10 gap-2 text-sm">
              <div className="font-medium text-muted-foreground">Hole</div>
              {backNine.map((score: any, index: number) => (
                <div key={score.holeId} className="text-center font-medium" data-testid={`hole-${index + 10}`}>
                  {index + 10}
                </div>
              ))}
              <div className="font-medium text-muted-foreground">IN</div>
              
              <div className="font-medium text-muted-foreground">Par</div>
              {backNine.map((score: any) => (
                <div key={`par-${score.holeId}`} className="text-center text-muted-foreground">
                  {score.hole?.par || 4}
                </div>
              ))}
              <div className="font-bold text-muted-foreground">{backPar}</div>
              
              <div className="font-medium text-foreground">Score</div>
              {backNine.map((score: any) => {
                const isUnder = score.strokes < (score.hole?.par || 4);
                return (
                  <div key={`score-${score.holeId}`} className="text-center">
                    {isUnder ? (
                      <div className="under-par mx-auto text-sm w-6 h-6 text-foreground">
                        {score.strokes}
                      </div>
                    ) : (
                      <div className="text-foreground font-semibold">
                        {score.strokes}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="font-bold text-accent">{backTotal}</div>
            </div>
          </div>
        )}
        
        {/* Totals */}
        <div className="p-4 bg-muted">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent" data-testid="text-total-strokes">
                {totalStrokes}
              </div>
              <div className="text-sm text-muted-foreground">Total Strokes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary" data-testid="text-score-to-par">
                {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
              </div>
              <div className="text-sm text-muted-foreground">To Par</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent" data-testid="text-total-putts">
                {round?.totalPutts || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Putts</div>
            </div>
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fairways Hit:</span>
            <span className="text-foreground font-medium" data-testid="text-fairways-hit">
              {round?.fairwaysHit || 0}/14
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GIR:</span>
            <span className="text-foreground font-medium" data-testid="text-gir">
              {round?.greensInRegulation || 0}/18
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
