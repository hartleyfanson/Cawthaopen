import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

interface LeaderboardTableProps {
  leaderboard: any[];
  courseId?: string;
  tournamentId?: string;
  tournament?: any;
  selectedRound?: 'all' | number;
}

// Helper function to format player name as "first initial. last name"
function formatPlayerName(playerName: string): string {
  if (!playerName) return "";
  
  const parts = playerName.trim().split(" ");
  if (parts.length < 2) return playerName;
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  
  return `${firstName.charAt(0).toUpperCase()}. ${lastName}`;
}

export function LeaderboardTable({ leaderboard, courseId, tournamentId, tournament, selectedRound = 'all' }: LeaderboardTableProps) {
  const [showingFrontNine, setShowingFrontNine] = useState(true);

  // Fetch course holes
  const { data: holes } = useQuery({
    queryKey: ["/api/courses", courseId, "holes"],
    enabled: !!courseId,
  });

  // Fetch tee selections for this tournament
  const { data: teeSelections } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "tee-selections"],
    enabled: !!tournamentId,
  });

  // Fetch all player scores for the tournament
  const { data: playerScores, refetch: refetchScores } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "player-scores"],
    enabled: !!tournamentId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  // Calculate which holes to display based on current view
  const allHoles = Array.isArray(holes) ? holes : [];
  const displayHoles = showingFrontNine 
    ? allHoles.slice(0, 9)  // Front 9: holes 1-9
    : allHoles.slice(9, 18); // Back 9: holes 10-18
  
  // Process player scores into a usable format
  const processedPlayerData = useMemo(() => {
    if (!playerScores || !Array.isArray(playerScores)) return {};

    const playerMap: Record<string, any> = {};

    playerScores.forEach((score: any) => {
      const playerId = score.playerId;
      
      if (!playerMap[playerId]) {
        playerMap[playerId] = {
          playerId: score.playerId,
          playerName: score.playerName,
          profileImageUrl: score.profileImageUrl,
          scores: {},
          frontNineTotal: 0,
          backNineTotal: 0,
          totalScore: 0,
          holesCompleted: 0,
        };
      }

      // Store individual hole scores
      if (score.strokes !== null && score.strokes !== undefined) {
        playerMap[playerId].scores[score.holeNumber] = {
          strokes: score.strokes,
          par: score.holePar,
          putts: score.putts,
          fairwayHit: score.fairwayHit,
          greenInRegulation: score.greenInRegulation,
        };
        playerMap[playerId].holesCompleted++;
      }
    });

    // Calculate totals for each player
    Object.values(playerMap).forEach((player: any) => {
      let frontNineTotal = 0;
      let backNineTotal = 0;
      
      // Front 9 totals (holes 1-9)
      for (let hole = 1; hole <= 9; hole++) {
        if (player.scores[hole]?.strokes) {
          frontNineTotal += player.scores[hole].strokes;
        }
      }
      
      // Back 9 totals (holes 10-18)  
      for (let hole = 10; hole <= 18; hole++) {
        if (player.scores[hole]?.strokes) {
          backNineTotal += player.scores[hole].strokes;
        }
      }

      player.frontNineTotal = frontNineTotal;
      player.backNineTotal = backNineTotal;
      player.totalScore = frontNineTotal + backNineTotal;
    });

    return playerMap;
  }, [playerScores]);

  // Calculate NET score based on tournament scoring system
  const calculateNetScore = (totalScore: number, playerId: string) => {
    if (!tournament?.scoringSystem || totalScore === 0) return null;
    
    // For now, using a simple handicap calculation
    // In a real system, you'd fetch the player's official handicap
    const estimatedHandicap = 18; // Placeholder - should be fetched from player data
    
    switch (tournament.scoringSystem) {
      case 'stroke-play':
        return totalScore - estimatedHandicap;
      case 'stableford':
        // Stableford scoring logic would go here
        return totalScore;
      case 'handicap':
        return totalScore - estimatedHandicap;
      default:
        return totalScore;
    }
  };

  // Calculate if a score is under par or over par
  const isUnderPar = (score: number, par: number) => score < par;
  const isOverPar = (score: number, par: number) => score > par;

  // Get player hole scores for display
  const getPlayerHoleScores = (playerId: string) => {
    const playerData = processedPlayerData[playerId];
    if (!playerData) return [];
    
    return displayHoles.map((hole: any) => {
      const scoreData = playerData.scores[hole.holeNumber];
      return {
        holeId: hole.id,
        score: scoreData?.strokes || null,
        par: hole.par,
        hasScore: !!scoreData?.strokes
      };
    });
  };

  // Sort leaderboard by total score (lowest first)
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const playerDataA = processedPlayerData[a.playerId];
    const playerDataB = processedPlayerData[b.playerId];
    
    const scoreA = playerDataA?.totalScore || 999;
    const scoreB = playerDataB?.totalScore || 999;
    
    return scoreA - scoreB;
  });

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
      
      {/* Summary scores section - separated from hole-by-hole */}
      <div className="bg-accent/10 p-4 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">ROUND SUMMARY</h3>
        <div className="space-y-2">
          {sortedLeaderboard.map((player: any, index: number) => {
            const playerData = processedPlayerData[player.playerId];
            const frontNineTotal = playerData?.frontNineTotal || 0;
            const backNineTotal = playerData?.backNineTotal || 0;
            const totalScore = playerData?.totalScore || 0;
            const holesCompleted = playerData?.holesCompleted || 0;
            
            const totalPar = allHoles.reduce((sum: number, hole: any) => sum + hole.par, 0);
            const scoreToPar = totalScore > 0 ? totalScore - totalPar : 0;
            const isLeader = index === 0 && totalScore > 0;
            const netScore = holesCompleted >= 18 ? calculateNetScore(totalScore, player.playerId) : null;
            
            return (
              <div key={`summary-${player.playerId}`} className={`p-3 rounded-lg ${isLeader ? 'bg-primary/20 border border-primary/30' : 'bg-background/60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${isLeader ? 'text-primary' : 'text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${isLeader ? 'text-primary' : 'text-foreground'}`}>
                        {formatPlayerName(player.playerName)}
                      </div>
                      {totalScore > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm font-medium">
                    {/* Always show all four values: OUT, IN, TOTAL, NET */}
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">OUT</div>
                      <div className={`font-bold ${isLeader ? 'text-primary' : 'text-foreground'}`}>
                        {frontNineTotal > 0 ? frontNineTotal : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">IN</div>
                      <div className={`font-bold ${isLeader ? 'text-primary' : 'text-foreground'}`}>
                        {backNineTotal > 0 ? backNineTotal : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">TOTAL</div>
                      <div className={`font-bold ${isLeader ? 'text-primary' : 'text-foreground'}`}>
                        {totalScore > 0 ? totalScore : '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">NET</div>
                      <div className={`font-bold ${isLeader ? 'text-primary' : 'text-foreground'}`}>
                        {netScore !== null ? netScore : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header with hole numbers */}
      <div className="bg-muted p-4 border-b border-border">
        <div className="grid gap-1 text-center text-sm font-medium text-muted-foreground" style={{gridTemplateColumns: "2fr " + "1fr ".repeat(9)}}>
          <div className="text-left">PLAYER</div>
          {displayHoles.map((hole: any) => (
            <div key={hole.id} data-testid={`header-hole-${hole.holeNumber}`}>
              {hole.holeNumber}
            </div>
          ))}
        </div>
        
        {/* PAR row */}
        <div className="grid gap-1 text-center text-sm text-muted-foreground mt-1" style={{gridTemplateColumns: "2fr " + "1fr ".repeat(9)}}>
          <div className="text-left">PAR</div>
          {displayHoles.map((hole: any) => (
            <div key={`par-${hole.id}`} data-testid={`header-par-${hole.holeNumber}`}>
              {hole.par}
            </div>
          ))}
        </div>

        {/* HANDICAP row */}
        <div className="grid gap-1 text-center text-xs text-muted-foreground mt-1" style={{gridTemplateColumns: "2fr " + "1fr ".repeat(9)}}>
          <div className="text-left">HDCP</div>
          {displayHoles.map((hole: any) => (
            <div key={`hdcp-${hole.id}`} data-testid={`header-hdcp-${hole.holeNumber}`}>
              {hole.handicap || '-'}
            </div>
          ))}
        </div>

        {/* TEE COLORS row */}
        {Array.isArray(teeSelections) && teeSelections.length > 0 && (
          <div className="grid gap-1 text-center text-xs mt-1" style={{gridTemplateColumns: "2fr " + "1fr ".repeat(9)}}>
            <div className="text-left text-muted-foreground">TEES</div>
            {displayHoles.map((hole: any) => {
              const teeSelection = teeSelections.find((tee: any) => tee.holeNumber === hole.holeNumber);
              const teeColor = teeSelection?.teeColor || 'white';
              const teeColorClasses: Record<string, string> = {
                white: 'bg-gray-100 text-gray-800 border-gray-300',
                blue: 'bg-blue-100 text-blue-800 border-blue-300',
                red: 'bg-red-100 text-red-800 border-red-300', 
                gold: 'bg-yellow-100 text-yellow-800 border-yellow-300'
              };
              const teeColorClass = teeColorClasses[teeColor] || teeColorClasses.white;
              
              return (
                <div key={`tee-${hole.id}`} className="flex justify-center">
                  <div className={`px-1 py-0.5 rounded text-xs border ${teeColorClass}`}>
                    {teeColor.charAt(0).toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* YARDAGE row */}
        {Array.isArray(teeSelections) && teeSelections.length > 0 && (
          <div className="grid gap-1 text-center text-xs text-muted-foreground mt-1" style={{gridTemplateColumns: "2fr " + "1fr ".repeat(9)}}>
            <div className="text-left">YARDS</div>
            {displayHoles.map((hole: any) => {
              const teeSelection = teeSelections.find((tee: any) => tee.holeNumber === hole.holeNumber);
              const teeColor = teeSelection?.teeColor || 'white';
              
              // Get yardage based on tee color selection
              const getYardageForTeeColor = (hole: any, teeColor: string) => {
                switch (teeColor) {
                  case 'gold': return hole.yardageGold || hole.yardageWhite || 0;
                  case 'blue': return hole.yardageBlue || hole.yardageWhite || 0;
                  case 'red': return hole.yardageRed || hole.yardageWhite || 0;
                  case 'white':
                  default: return hole.yardageWhite || 0;
                }
              };
              
              const yardage = getYardageForTeeColor(hole, teeColor);
              
              return (
                <div key={`yards-${hole.id}`} data-testid={`header-yards-${hole.holeNumber}`}>
                  {yardage}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Player rows - hole-by-hole scores only */}
      <div className="divide-y divide-border">
        {sortedLeaderboard.map((player: any, index: number) => {
          const playerData = processedPlayerData[player.playerId];
          const holeScores = getPlayerHoleScores(player.playerId);
          
          const totalScore = playerData?.totalScore || 0;
          const totalPar = allHoles.reduce((sum: number, hole: any) => sum + hole.par, 0);
          const scoreToPar = totalScore > 0 ? totalScore - totalPar : 0;
          const isLeader = index === 0 && totalScore > 0;
          
          return (
            <div 
              key={player.playerId}
              className={`p-4 hover:bg-muted/30 transition-colors ${
                isLeader ? 'bg-primary/10 border-l-4 border-primary' : ''
              }`}
              data-testid={`row-player-${player.playerId}`}
            >
              <div className="grid gap-1 items-center text-center" style={{gridTemplateColumns: "2fr " + "1fr ".repeat(9)}}>
                <div className="text-left px-2">
                  <div className="flex items-center space-x-2">
                    <div className={`text-lg font-bold ${
                      isLeader ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        isLeader ? 'text-primary' : 'text-foreground'
                      }`} data-testid={`text-player-name-${player.playerId}`}>
                        {formatPlayerName(player.playerName)}
                      </div>
                      {totalScore > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar} ({totalScore})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hole scores */}
                {holeScores.map((score, holeIndex) => {
                  if (!score.hasScore) {
                    return (
                      <div key={holeIndex} className="text-center text-muted-foreground">
                        -
                      </div>
                    );
                  }
                  
                  const isUnder = isUnderPar(score.score, score.par);
                  const isOver = isOverPar(score.score, score.par);
                  const holeNumber = showingFrontNine ? holeIndex + 1 : holeIndex + 10;
                  
                  return (
                    <div 
                      key={holeIndex}
                      className="text-center"
                      data-testid={`score-hole-${holeNumber}-player-${player.playerId}`}
                    >
                      {isUnder ? (
                        <div className="under-par mx-auto">
                          {score.score}
                        </div>
                      ) : isOver ? (
                        <div className="over-par mx-auto">
                          {score.score}
                        </div>
                      ) : (
                        <div className={isLeader ? 'text-primary' : 'text-foreground'}>
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