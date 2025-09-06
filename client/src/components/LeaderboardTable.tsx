import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useMemo, Fragment } from "react";

interface LeaderboardTableProps {
  leaderboard: any[];
  courseId?: string;
  tournamentId?: string;
  tournament?: any;
  selectedRound?: 'all' | number;
  tournamentRounds?: any[];
}

// Helper function to format player name as "first initial. last name" with truncation for alignment
function formatPlayerName(playerName: string, maxLength: number = 12): string {
  if (!playerName) return "";
  
  const parts = playerName.trim().split(" ");
  if (parts.length < 2) {
    // Single name - truncate if too long
    return parts[0].length > maxLength ? parts[0].substring(0, maxLength - 1) + "…" : parts[0];
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  const formatted = `${firstName.charAt(0).toUpperCase()}. ${lastName}`;
  
  // Truncate if the formatted name is too long
  if (formatted.length > maxLength) {
    return formatted.substring(0, maxLength - 1) + "…";
  }
  
  return formatted;
}

export function LeaderboardTable({ leaderboard, courseId, tournamentId, tournament, selectedRound = 'all', tournamentRounds = [] }: LeaderboardTableProps) {
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

  // Determine if we need to fetch round-specific data
  const shouldFetchRounds = useMemo(() => {
    return selectedRound === 'all' && Array.isArray(tournamentRounds) && tournamentRounds.length > 1;
  }, [selectedRound, tournamentRounds]);

  // Fixed number of round queries to avoid hook order issues
  const maxRounds = 4; // Reasonable limit for tournament rounds
  const safeRounds = Array.isArray(tournamentRounds) ? tournamentRounds.slice(0, maxRounds) : [];
  
  // Create exactly maxRounds queries to maintain hook order
  const roundQuery1 = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "leaderboard", "round", safeRounds[0]?.roundNumber],
    enabled: shouldFetchRounds && !!tournamentId && safeRounds.length >= 1,
    refetchInterval: 5000,
  });
  
  const roundQuery2 = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "leaderboard", "round", safeRounds[1]?.roundNumber],
    enabled: shouldFetchRounds && !!tournamentId && safeRounds.length >= 2,
    refetchInterval: 5000,
  });
  
  const roundQuery3 = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "leaderboard", "round", safeRounds[2]?.roundNumber],
    enabled: shouldFetchRounds && !!tournamentId && safeRounds.length >= 3,
    refetchInterval: 5000,
  });
  
  const roundQuery4 = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "leaderboard", "round", safeRounds[3]?.roundNumber],
    enabled: shouldFetchRounds && !!tournamentId && safeRounds.length >= 4,
    refetchInterval: 5000,
  });

  // Collect active round queries
  const roundQueries = [roundQuery1, roundQuery2, roundQuery3, roundQuery4].slice(0, safeRounds.length);

  // Combine round data for multi-round summary
  const combinedRoundData = useMemo(() => {
    if (selectedRound !== 'all') return {};
    
    const combined: Record<number, any[]> = {};
    roundQueries.forEach((query, index) => {
      if (query.data && Array.isArray(query.data) && Array.isArray(tournamentRounds)) {
        const roundNumber = tournamentRounds[index]?.roundNumber;
        if (roundNumber) {
          combined[roundNumber] = query.data;
        }
      }
    });
    return combined;
  }, [roundQueries, selectedRound, tournamentRounds]);

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
          handicap: score.handicap || 0, // Include player handicap
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
    if (!(tournament as any)?.scoringFormat || totalScore === 0) return null;
    
    const playerData = processedPlayerData[playerId];
    const playerHandicap = playerData?.handicap || 0;
    
    switch ((tournament as any).scoringFormat) {
      case 'stroke_play':
        return Math.round(totalScore - playerHandicap);
      case 'handicap':
        return Math.round(totalScore - playerHandicap);
      case 'stableford':
        // Stableford points system - calculate points based on score relative to par + handicap
        return calculateStablefordPoints(totalScore, playerHandicap);
      case 'callaway':
        // Callaway system - deduct worst holes based on handicap
        return calculateCallawayScore(totalScore, playerHandicap, playerId);
      default:
        return totalScore;
    }
  };

  // Calculate Stableford points
  const calculateStablefordPoints = (totalScore: number, handicap: number) => {
    // Simplified stableford calculation - in real system would calculate per hole
    const totalPar = allHoles.reduce((sum: number, hole: any) => sum + hole.par, 0);
    const netScore = totalScore - handicap;
    const diff = totalPar - netScore;
    return Math.max(0, 36 + diff); // 36 points for playing to handicap
  };

  // Calculate Callaway score using proper Callaway system logic
  const calculateCallawayScore = (totalScore: number, handicap: number, playerId: string) => {
    const playerData = processedPlayerData[playerId];
    if (!playerData || playerData.holesCompleted < 18 || !Array.isArray(allHoles) || allHoles.length === 0) return totalScore;

    // Apply double par maximum rule to each hole score
    const adjustedHoleScores: number[] = [];
    let adjustedTotalScore = 0;

    for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
      const holeScore = playerData.scores?.[holeNumber];
      if (holeScore?.strokes) {
        const hole = allHoles.find((h: any) => h.holeNumber === holeNumber);
        const doublePar = hole ? hole.par * 2 : 8; // Default double par if hole not found
        const cappedScore = Math.min(holeScore.strokes, doublePar);
        adjustedHoleScores.push(cappedScore);
        adjustedTotalScore += cappedScore;
      }
    }

    if (!Array.isArray(adjustedHoleScores) || adjustedHoleScores.length !== 18) return totalScore;

    // Determine handicap deduction based on adjusted gross score
    const getCallawayDeduction = (grossScore: number): number => {
      if (grossScore <= 72) return 0; // Scratch
      if (grossScore <= 75) return 0.5; // 1/2 of Worst Hole
      if (grossScore <= 80) return 1; // Worst Hole
      if (grossScore <= 85) return 1.5; // 1 1/2 Worst Holes
      if (grossScore <= 90) return 2; // 2 Worst Holes
      if (grossScore <= 95) return 2.5; // 2 1/2 Worst Holes
      if (grossScore <= 100) return 3; // 3 Worst Holes
      if (grossScore <= 105) return 3.5; // 3 1/2 Worst Holes
      if (grossScore <= 110) return 4; // 4 Worst Holes
      if (grossScore <= 115) return 4.5; // 4 1/2 Worst Holes
      if (grossScore <= 120) return 5; // 5 Worst Holes
      if (grossScore <= 125) return 5.5; // 5 1/2 Worst Holes
      if (grossScore <= 130) return 6; // 6 Worst Holes
      return 6; // Cap at 6 worst holes
    };

    const deductionAmount = getCallawayDeduction(adjustedTotalScore);
    
    if (deductionAmount === 0) {
      return adjustedTotalScore + handicap; // Apply handicap adjustment
    }

    // Calculate par values for each hole to determine "worst" holes (strokes over par)
    const holeDeficits: { holeIndex: number; deficit: number; strokes: number }[] = [];
    
    for (let i = 0; i < 18; i++) {
      if (!Array.isArray(allHoles) || !Array.isArray(adjustedHoleScores)) break;
      const hole = allHoles.find((h: any) => h.holeNumber === i + 1);
      if (hole && adjustedHoleScores[i]) {
        const deficit = adjustedHoleScores[i] - hole.par;
        if (deficit > 0) { // Only consider holes over par as "worst"
          holeDeficits.push({
            holeIndex: i,
            deficit: deficit,
            strokes: adjustedHoleScores[i]
          });
        }
      }
    }

    // Sort by worst holes (highest deficit first, then highest strokes)
    if (Array.isArray(holeDeficits)) {
      holeDeficits.sort((a, b) => {
        if (b.deficit !== a.deficit) {
          return b.deficit - a.deficit;
        }
        return b.strokes - a.strokes;
      });
    }

    // Calculate deduction
    let totalDeduction = 0;
    const wholeHoles = Math.floor(deductionAmount);
    const hasHalfHole = deductionAmount % 1 === 0.5;

    // Deduct worst holes
    if (Array.isArray(holeDeficits)) {
      for (let i = 0; i < wholeHoles && i < holeDeficits.length; i++) {
        totalDeduction += holeDeficits[i].deficit;
      }

      // Handle half hole deduction
      if (hasHalfHole && wholeHoles < holeDeficits.length) {
        totalDeduction += Math.floor(holeDeficits[wholeHoles].deficit / 2);
      }
    }

    // Apply handicap adjustment (-2 to +2 range)
    const callawayScore = adjustedTotalScore - totalDeduction + handicap;
    
    return Math.round(callawayScore);
  };

  // Calculate if a score is under par or over par
  const isUnderPar = (score: number, par: number) => score < par;
  const isOverPar = (score: number, par: number) => score > par;

  // Get player hole scores for display
  const getPlayerHoleScores = (playerId: string) => {
    const playerData = processedPlayerData[playerId];
    if (!playerData) return [];
    
    return displayHoles.map((hole: any) => {
      const scoreData = playerData.scores?.[hole.holeNumber];
      return {
        holeId: hole.id,
        score: scoreData?.strokes || null,
        par: hole.par,
        hasScore: !!scoreData?.strokes
      };
    });
  };

  // Sort leaderboard by total score (lowest first)
  // Deduplicate leaderboard by playerId first, then sort
  const uniqueLeaderboard = leaderboard.reduce((acc: any[], current: any) => {
    const existingPlayer = acc.find(player => player.playerId === current.playerId);
    if (!existingPlayer) {
      acc.push(current);
    }
    return acc;
  }, []);

  const sortedLeaderboard = [...uniqueLeaderboard].sort((a, b) => {
    const playerDataA = processedPlayerData[a.playerId];
    const playerDataB = processedPlayerData[b.playerId];
    
    const scoreA = playerDataA?.totalScore || 999;
    const scoreB = playerDataB?.totalScore || 999;
    
    return scoreA - scoreB;
  });

  // Multi-round summary component for "All Rounds" view
  const renderMultiRoundSummary = () => {
    if (!Array.isArray(tournamentRounds) || tournamentRounds.length <= 1) {
      return null;
    }

    // Sort players by total net score across all rounds
    const sortedPlayers = [...leaderboard].sort((a, b) => {
      const playerDataA = processedPlayerData[a.playerId];
      const playerDataB = processedPlayerData[b.playerId];
      
      // Calculate total net scores across all rounds
      const totalNetA = calculateTotalNetScore(a.playerId);
      const totalNetB = calculateTotalNetScore(b.playerId);
      
      return (totalNetA || 999) - (totalNetB || 999);
    });

    return (
      <Card className="bg-background overflow-hidden card-shadow">
        <div className="bg-muted/50 p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-center">Tournament Summary - All Rounds</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold">Pos</th>
                <th className="text-left p-4 font-semibold">Player</th>
                {tournamentRounds.map((round: any) => [
                  <th key={`${round.id}-gross`} className="text-center p-4 font-semibold text-sm">R{round.roundNumber} Gross</th>,
                  <th key={`${round.id}-net`} className="text-center p-4 font-semibold text-sm">R{round.roundNumber} Net</th>
                ])}
                <th className="text-center p-4 font-semibold bg-primary/10">Total Gross</th>
                <th className="text-center p-4 font-semibold bg-primary/10">Total Net</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player: any, index: number) => {
                const totalNetScore = calculateTotalNetScore(player.playerId);
                const totalGrossScore = calculateTotalGrossScore(player.playerId);
                const isLeader = index === 0 && totalNetScore;
                
                return (
                  <tr key={player.playerId} className={`border-b border-border ${isLeader ? 'bg-primary/5' : ''}`}>
                    <td className="p-4">
                      <div className={`font-bold ${isLeader ? 'text-primary' : ''}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.profileImageUrl || ""} alt={player.playerName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {player.playerName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`font-semibold ${isLeader ? 'text-primary' : ''}`}>
                          {formatPlayerName(player.playerName)}
                        </span>
                      </div>
                    </td>
                    {tournamentRounds.map((round: any) => {
                      const roundGross = getRoundGrossScore(player.playerId, round.roundNumber);
                      const roundNet = getRoundNetScore(player.playerId, round.roundNumber);
                      return [
                        <td key={`${player.playerId}-${round.id}-gross`} className="p-4 text-center font-medium">
                          {roundGross || '-'}
                        </td>,
                        <td key={`${player.playerId}-${round.id}-net`} className="p-4 text-center font-medium">
                          {roundNet || '-'}
                        </td>
                      ];
                    })}
                    <td className={`p-4 text-center font-bold bg-primary/5 ${isLeader ? 'text-primary' : ''}`}>
                      {totalGrossScore || '-'}
                    </td>
                    <td className={`p-4 text-center font-bold bg-primary/5 ${isLeader ? 'text-primary' : ''}`}>
                      {totalNetScore || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  // Helper functions for multi-round scoring
  const getRoundGrossScore = (playerId: string, roundNumber: number) => {
    const roundData = combinedRoundData[roundNumber];
    if (!roundData) return null;
    
    const playerRoundData = roundData.find((p: any) => p.playerId === playerId);
    if (!playerRoundData) return null;
    
    // Calculate total score from round data
    const playerScoreData = processedPlayerData[playerId];
    return playerScoreData?.totalScore > 0 ? playerScoreData.totalScore : null;
  };

  const getRoundNetScore = (playerId: string, roundNumber: number) => {
    const roundData = combinedRoundData[roundNumber];
    if (!roundData) return null;
    
    const playerRoundData = roundData.find((p: any) => p.playerId === playerId);
    if (!playerRoundData) return null;
    
    const roundGross = getRoundGrossScore(playerId, roundNumber);
    if (!roundGross) return null;
    
    return calculateNetScore(roundGross, playerId);
  };

  const calculateTotalGrossScore = (playerId: string) => {
    // Sum up gross scores across all rounds
    let total = 0;
    let hasScores = false;
    
    for (const round of tournamentRounds) {
      const roundScore = getRoundGrossScore(playerId, round.roundNumber);
      if (roundScore && roundScore > 0) {
        total += roundScore;
        hasScores = true;
      }
    }
    
    return hasScores ? total : null;
  };

  const calculateTotalNetScore = (playerId: string) => {
    // Sum up net scores across all rounds
    let total = 0;
    let hasScores = false;
    
    for (const round of tournamentRounds) {
      const roundNet = getRoundNetScore(playerId, round.roundNumber);
      if (roundNet !== null && roundNet > 0) {
        total += roundNet;
        hasScores = true;
      }
    }
    
    return hasScores ? total : null;
  };

  // Return different views based on selectedRound
  if (selectedRound === 'all' && Array.isArray(tournamentRounds) && tournamentRounds.length > 1) {
    return renderMultiRoundSummary();
  }

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
            
            // Calculate par for completed holes only (partial round support)
            const completedHolePars = Object.keys(playerData?.scores || {}).map(holeNum => {
              const hole = allHoles.find((h: any) => h.holeNumber === parseInt(holeNum));
              return hole ? hole.par : 0;
            });
            const completedHolesTotalPar = completedHolePars.reduce((sum: number, par: number) => sum + par, 0);
            const scoreToPar = totalScore > 0 && holesCompleted > 0 ? totalScore - completedHolesTotalPar : 0;
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
        <div className="grid text-center text-sm font-medium text-muted-foreground" style={{gridTemplateColumns: "1.5fr " + "1fr ".repeat(9), gap: "2px"}}>
          <div className="text-left">HOLE</div>
          {displayHoles.map((hole: any) => (
            <div key={hole.id} data-testid={`header-hole-${hole.holeNumber}`}>
              {hole.holeNumber}
            </div>
          ))}
        </div>
        
        {/* PAR row */}
        <div className="grid text-center text-sm text-muted-foreground mt-1" style={{gridTemplateColumns: "1.5fr " + "1fr ".repeat(9), gap: "2px"}}>
          <div className="text-left">PAR</div>
          {displayHoles.map((hole: any) => (
            <div key={`par-${hole.id}`} data-testid={`header-par-${hole.holeNumber}`}>
              {hole.par}
            </div>
          ))}
        </div>

        {/* HANDICAP row */}
        <div className="grid text-center text-xs text-muted-foreground mt-1" style={{gridTemplateColumns: "1.5fr " + "1fr ".repeat(9), gap: "2px"}}>
          <div className="text-left">HDCP</div>
          {displayHoles.map((hole: any) => (
            <div key={`hdcp-${hole.id}`} data-testid={`header-hdcp-${hole.holeNumber}`}>
              {hole.handicap || '-'}
            </div>
          ))}
        </div>

        {/* TEE COLORS row */}
        {Array.isArray(teeSelections) && teeSelections.length > 0 && (
          <div className="grid text-center text-xs mt-1" style={{gridTemplateColumns: "1.5fr " + "1fr ".repeat(9), gap: "2px"}}>
            <div className="text-left text-muted-foreground">TEES</div>
            {displayHoles.map((hole: any) => {
              const teeSelection = teeSelections.find((tee: any) => tee.holeNumber === hole.holeNumber);
              const teeColor = teeSelection?.teeColor || 'white';
              const teeColorClasses: Record<string, string> = {
                white: 'bg-gray-300 text-gray-900 border-gray-400',
                blue: 'bg-blue-300 text-blue-900 border-blue-400',
                red: 'bg-red-300 text-red-900 border-red-400', 
                gold: 'bg-amber-300 text-amber-900 border-amber-400'
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
          <div className="grid text-center text-xs text-muted-foreground mt-1" style={{gridTemplateColumns: "1.5fr " + "1fr ".repeat(9), gap: "2px"}}>
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
          const holesCompleted = playerData?.holesCompleted || 0;
          
          // Calculate par for completed holes only (partial round support)
          const completedHolePars = Object.keys(playerData?.scores || {}).map(holeNum => {
            const hole = allHoles.find((h: any) => h.holeNumber === parseInt(holeNum));
            return hole ? hole.par : 0;
          });
          const completedHolesTotalPar = completedHolePars.reduce((sum: number, par: number) => sum + par, 0);
          const scoreToPar = totalScore > 0 && holesCompleted > 0 ? totalScore - completedHolesTotalPar : 0;
          const isLeader = index === 0 && totalScore > 0;
          
          return (
            <div 
              key={player.playerId}
              className={`p-4 hover:bg-muted/30 transition-colors ${
                isLeader ? 'bg-primary/10 border-l-4 border-primary' : ''
              }`}
              data-testid={`row-player-${player.playerId}`}
            >
              <div className="grid items-center text-center" style={{gridTemplateColumns: "1.5fr " + "1fr ".repeat(9), gap: "2px"}}>
                <div className="text-left">
                  <div className="flex items-center space-x-1">
                    <div className={`text-xs font-bold ${
                      isLeader ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-xs leading-tight truncate ${
                        isLeader ? 'text-primary' : 'text-foreground'
                      }`} data-testid={`text-player-name-${player.playerId}`}>
                        {formatPlayerName(player.playerName, 6)}
                      </div>
                      {totalScore > 0 && (
                        <div className="text-xs text-muted-foreground leading-tight">
                          {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hole scores */}
                {holeScores.map((score, holeIndex) => {
                  if (!score.hasScore) {
                    return (
                      <div key={holeIndex} className="flex justify-center items-center h-7">
                        <span className="text-muted-foreground text-sm">-</span>
                      </div>
                    );
                  }
                  
                  const isUnder = isUnderPar(score.score, score.par);
                  const isOver = isOverPar(score.score, score.par);
                  const holeNumber = showingFrontNine ? holeIndex + 1 : holeIndex + 10;
                  
                  return (
                    <div 
                      key={holeIndex}
                      className="flex justify-center"
                      data-testid={`score-hole-${holeNumber}-player-${player.playerId}`}
                    >
                      {isUnder ? (
                        <div className="under-par w-6 h-6 flex items-center justify-center text-sm">
                          {score.score}
                        </div>
                      ) : isOver ? (
                        <div className="over-par w-6 h-6 flex items-center justify-center text-sm">
                          {score.score}
                        </div>
                      ) : (
                        <div className={`w-6 h-6 flex items-center justify-center text-sm ${isLeader ? 'text-primary' : 'text-foreground'}`}>
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