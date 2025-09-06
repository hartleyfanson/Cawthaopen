import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

interface RoundScorecardProps {
  tournamentId: string;
  selectedRound: number;
  courseId?: string;
}

interface PlayerRoundData {
  playerId: string;
  playerName: string;
  profileImageUrl?: string;
  handicap?: number;
  holes: {
    [holeNumber: number]: {
      holeId: string;
      holePar: number;
      strokes: number;
      putts?: number;
      fairwayHit?: boolean;
      greenInRegulation?: boolean;
    };
  };
}

function formatPlayerName(playerName: string, maxLength: number = 16): string {
  if (!playerName) return "";
  
  const parts = playerName.trim().split(" ");
  if (parts.length < 2) {
    return parts[0].length > maxLength ? parts[0].substring(0, maxLength - 1) + "…" : parts[0];
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  const formatted = `${firstName.charAt(0).toUpperCase()}. ${lastName}`;
  
  if (formatted.length > maxLength) {
    return formatted.substring(0, maxLength - 1) + "…";
  }
  
  return formatted;
}

export function RoundScorecard({ tournamentId, selectedRound, courseId }: RoundScorecardProps) {
  const [showingFrontNine, setShowingFrontNine] = useState(true);

  // Fetch all player scores for the tournament
  const { data: playerScores, isLoading: loadingScores } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "player-scores"],
    enabled: !!tournamentId,
  });

  // Fetch course holes for par information
  const { data: holes } = useQuery({
    queryKey: ["/api/courses", courseId, "holes"],
    enabled: !!courseId,
  });

  // Process player scores for the selected round
  const roundPlayerData = useMemo((): PlayerRoundData[] => {
    if (!Array.isArray(playerScores)) return [];

    // Filter scores for the selected round
    const roundScores = playerScores.filter((score: any) => score.roundNumber === selectedRound);

    // Group scores by player
    const playerGroups: { [playerId: string]: any[] } = {};
    roundScores.forEach((score: any) => {
      if (!playerGroups[score.playerId]) {
        playerGroups[score.playerId] = [];
      }
      playerGroups[score.playerId].push(score);
    });

    // Transform into player round data
    return Object.entries(playerGroups).map(([playerId, scores]: [string, any[]]) => {
      const firstScore = scores[0];
      const holes: { [holeNumber: number]: any } = {};

      scores.forEach((score: any) => {
        holes[score.holeNumber] = {
          holeId: score.holeId,
          holePar: score.holePar,
          strokes: score.strokes,
          putts: score.putts,
          fairwayHit: score.fairwayHit,
          greenInRegulation: score.greenInRegulation,
        };
      });

      return {
        playerId,
        playerName: firstScore.playerName,
        profileImageUrl: firstScore.profileImageUrl,
        handicap: firstScore.handicap,
        holes,
      };
    });
  }, [playerScores, selectedRound]);

  // Calculate totals for each player
  const playersWithTotals = useMemo(() => {
    return roundPlayerData.map((player) => {
      let totalStrokes = 0;
      let totalPutts = 0;
      let fairwaysHit = 0;
      let greensInRegulation = 0;
      let totalPar = 0;

      Object.entries(player.holes).forEach(([holeNumber, holeData]) => {
        totalStrokes += holeData.strokes;
        totalPar += holeData.holePar;
        if (holeData.putts) totalPutts += holeData.putts;
        if (holeData.fairwayHit) fairwaysHit++;
        if (holeData.greenInRegulation) greensInRegulation++;
      });

      const scoreToPar = totalStrokes - totalPar;

      return {
        ...player,
        totalStrokes,
        totalPutts,
        fairwaysHit,
        greensInRegulation,
        totalPar,
        scoreToPar,
      };
    });
  }, [roundPlayerData]);

  // Sort players by total strokes (ascending)
  const sortedPlayers = useMemo(() => {
    return [...playersWithTotals].sort((a, b) => a.totalStrokes - b.totalStrokes);
  }, [playersWithTotals]);

  // Determine which holes to show (front 9 or back 9)
  const holesToShow = showingFrontNine ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [10, 11, 12, 13, 14, 15, 16, 17, 18];

  if (loadingScores) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading scorecards...</div>
        </CardContent>
      </Card>
    );
  }

  if (sortedPlayers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">No scores recorded for Round {selectedRound}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Round {selectedRound} Scorecards
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={showingFrontNine ? "default" : "outline"}
              size="sm"
              onClick={() => setShowingFrontNine(true)}
              data-testid="button-front-nine"
            >
              Front 9
            </Button>
            <Button
              variant={!showingFrontNine ? "default" : "outline"}
              size="sm"
              onClick={() => setShowingFrontNine(false)}
              data-testid="button-back-nine"
            >
              Back 9
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium min-w-[120px]">Player</th>
                {holesToShow.map((holeNumber) => (
                  <th key={holeNumber} className="text-center p-1 font-medium w-12">
                    {holeNumber}
                  </th>
                ))}
                <th className="text-center p-2 font-medium w-16">
                  {showingFrontNine ? "Out" : "In"}
                </th>
                {!showingFrontNine && (
                  <th className="text-center p-2 font-medium w-16">Total</th>
                )}
              </tr>
              {/* Par row */}
              <tr className="border-b bg-muted/30">
                <td className="p-2 font-medium text-muted-foreground">Par</td>
                {holesToShow.map((holeNumber) => {
                  const hole = Array.isArray(holes) ? holes.find((h: any) => h.holeNumber === holeNumber) : null;
                  return (
                    <td key={holeNumber} className="text-center p-1 font-medium text-muted-foreground">
                      {hole?.par || '-'}
                    </td>
                  );
                })}
                <td className="text-center p-2 font-medium text-muted-foreground">
                  {Array.isArray(holes) 
                    ? holesToShow.reduce((sum, holeNum) => {
                        const hole = holes.find((h: any) => h.holeNumber === holeNum);
                        return sum + (hole?.par || 0);
                      }, 0)
                    : '-'}
                </td>
                {!showingFrontNine && (
                  <td className="text-center p-2 font-medium text-muted-foreground">
                    {Array.isArray(holes) 
                      ? holes.reduce((sum: number, hole: any) => sum + (hole.par || 0), 0)
                      : '-'}
                  </td>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                // Calculate nine-hole totals
                const nineHoleStrokes = holesToShow.reduce((sum, holeNum) => {
                  const holeData = player.holes[holeNum];
                  return sum + (holeData?.strokes || 0);
                }, 0);

                const nineHolePar = Array.isArray(holes) 
                  ? holesToShow.reduce((sum, holeNum) => {
                      const hole = holes.find((h: any) => h.holeNumber === holeNum);
                      return sum + (hole?.par || 0);
                    }, 0)
                  : 0;

                return (
                  <tr 
                    key={player.playerId} 
                    className={`border-b hover:bg-muted/50 ${index === 0 ? 'bg-accent/20' : ''}`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={player.profileImageUrl} />
                          <AvatarFallback>
                            {player.playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium" data-testid={`player-name-${player.playerId}`}>
                            {formatPlayerName(player.playerName)}
                          </div>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Leader
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    {holesToShow.map((holeNumber) => {
                      const holeData = player.holes[holeNumber];
                      const hole = Array.isArray(holes) ? holes.find((h: any) => h.holeNumber === holeNumber) : null;
                      
                      if (!holeData) {
                        return (
                          <td key={holeNumber} className="text-center p-1 text-muted-foreground">
                            -
                          </td>
                        );
                      }

                      const scoreToPar = holeData.strokes - (hole?.par || 0);
                      let bgColor = "";
                      let textColor = "";

                      if (scoreToPar < 0) {
                        bgColor = "bg-green-100 dark:bg-green-900";
                        textColor = "text-green-800 dark:text-green-200";
                      } else if (scoreToPar > 0) {
                        bgColor = "bg-red-100 dark:bg-red-900";
                        textColor = "text-red-800 dark:text-red-200";
                      }

                      return (
                        <td 
                          key={holeNumber} 
                          className={`text-center p-1 font-medium ${bgColor} ${textColor}`}
                          data-testid={`score-${player.playerId}-hole-${holeNumber}`}
                        >
                          {holeData.strokes}
                        </td>
                      );
                    })}
                    <td className="text-center p-2 font-medium">
                      <div className={`px-2 py-1 rounded ${
                        nineHoleStrokes - nineHolePar < 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : nineHoleStrokes - nineHolePar > 0
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {nineHoleStrokes}
                      </div>
                    </td>
                    {!showingFrontNine && (
                      <td className="text-center p-2 font-bold">
                        <div className={`px-2 py-1 rounded ${
                          player.scoreToPar < 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : player.scoreToPar > 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {player.totalStrokes}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Round summary stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-lg">{sortedPlayers.length}</div>
            <div className="text-muted-foreground">Players</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg">
              {sortedPlayers.length > 0 ? Math.min(...sortedPlayers.map(p => p.totalStrokes)) : '-'}
            </div>
            <div className="text-muted-foreground">Low Round</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg">
              {sortedPlayers.length > 0 
                ? (sortedPlayers.reduce((sum, p) => sum + p.totalStrokes, 0) / sortedPlayers.length).toFixed(1)
                : '-'}
            </div>
            <div className="text-muted-foreground">Average</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-lg">
              {sortedPlayers.length > 0 
                ? sortedPlayers.filter(p => p.scoreToPar < 0).length
                : 0}
            </div>
            <div className="text-muted-foreground">Under Par</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}