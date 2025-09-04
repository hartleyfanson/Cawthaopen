import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function LiveScoring() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRound, setSelectedRound] = useState(1);
  const [currentHole, setCurrentHole] = useState(1);
  const [strokes, setStrokes] = useState<number | null>(null);
  const [putts, setPutts] = useState<number | null>(null);
  const [fairwayHit, setFairwayHit] = useState(false);
  const [greenInRegulation, setGreenInRegulation] = useState(false);
  const [powerupUsed, setPowerupUsed] = useState(false);
  const [powerupNotes, setPowerupNotes] = useState("");
  
  // Cache all hole scores until completion
  const [cachedScores, setCachedScores] = useState<Array<{
    holeNumber: number;
    holeId: string;
    strokes: number | null;
    putts: number | null;
    fairwayHit: boolean;
    greenInRegulation: boolean;
    powerupUsed: boolean;
    powerupNotes: string;
  }>>([]);
  
  const [, setLocation] = useLocation();

  // Local storage key for persisting scoring state (includes round number)
  const storageKey = `live-scoring-${id}-${user?.id}-round-${selectedRound}`;

  // Load scoring state from local storage on mount
  useEffect(() => {
    if (!id || !user?.id) return;
    
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedRound) setSelectedRound(parsed.selectedRound);
        if (parsed.currentHole) setCurrentHole(parsed.currentHole);
        if (parsed.strokes) setStrokes(parsed.strokes);
        if (parsed.putts) setPutts(parsed.putts);
        if (parsed.fairwayHit !== undefined) setFairwayHit(parsed.fairwayHit);
        if (parsed.greenInRegulation !== undefined) setGreenInRegulation(parsed.greenInRegulation);
        if (parsed.powerupUsed !== undefined) setPowerupUsed(parsed.powerupUsed);
        if (parsed.powerupNotes) setPowerupNotes(parsed.powerupNotes);
        if (parsed.cachedScores) setCachedScores(parsed.cachedScores);
      }
    } catch (error) {
      console.log('Could not load saved scoring state:', error);
    }
  }, [id, user?.id, storageKey]);

  // Save scoring state to local storage whenever it changes
  useEffect(() => {
    if (!id || !user?.id) return;
    
    const stateToSave = {
      selectedRound,
      currentHole,
      strokes,
      putts,
      fairwayHit,
      greenInRegulation,
      powerupUsed,
      powerupNotes,
      cachedScores,
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.log('Could not save scoring state:', error);
    }
  }, [selectedRound, currentHole, strokes, putts, fairwayHit, greenInRegulation, powerupUsed, powerupNotes, cachedScores, storageKey, id, user?.id]);

  // Clear local storage when round is completed
  const clearSavedState = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.log('Could not clear saved state:', error);
    }
  };

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

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournaments", id],
    enabled: !!user && !!id,
  });

  // Fetch tournament rounds to enable round navigation
  const { data: tournamentRounds } = useQuery({
    queryKey: ["/api/tournaments", id, "rounds"],
    enabled: !!user && !!id,
  });

  const { data: holes } = useQuery({
    queryKey: ["/api/courses", (tournament as any)?.courseId, "holes"],
    enabled: !!(tournament as any)?.courseId,
  });

  const { data: currentRoundData } = useQuery({
    queryKey: ["/api/rounds", id, selectedRound.toString()],
    enabled: !!user && !!id,
  });

  const { data: existingScores } = useQuery({
    queryKey: ["/api/rounds", (currentRoundData as any)?.id, "scores"],
    enabled: !!(currentRoundData as any)?.id,
    queryFn: () => fetch(`/api/rounds/${(currentRoundData as any)?.id}/scores`).then(res => res.json()),
  });

  const createRoundMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/rounds", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
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
        description: "Failed to create round",
        variant: "destructive",
      });
    },
  });

  const createScoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/scores", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      toast({
        title: "Score Saved",
        description: `Hole ${currentHole} score saved successfully`,
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
        description: "Failed to save score",
        variant: "destructive",
      });
    },
  });

  const currentHoleData = holes?.find((hole: any) => hole.holeNumber === currentHole);

  // Load existing score data when navigating to a hole (for editing)
  useEffect(() => {
    if (currentHoleData) {
      // Check if there's an existing score for this hole
      const existingScore = cachedScores.find(score => score.holeNumber === currentHole);
      
      if (existingScore) {
        // Pre-populate with existing score data
        setStrokes(existingScore.strokes);
        setPutts(existingScore.putts);
        setFairwayHit(existingScore.fairwayHit);
        setGreenInRegulation(existingScore.greenInRegulation);
        setPowerupUsed(existingScore.powerupUsed);
        setPowerupNotes(existingScore.powerupNotes);
      } else {
        // Reset to blank for new holes
        setStrokes(null);
        setPutts(null);
        setFairwayHit(false);
        setGreenInRegulation(false);
        setPowerupUsed(false);
        setPowerupNotes("");
      }
    }
  }, [currentHoleData, currentHole, cachedScores]);

  // Load existing scores into cache when component mounts (for editing mode)
  useEffect(() => {
    if (Array.isArray(existingScores) && Array.isArray(holes) && existingScores.length > 0) {
      const loadedScores = existingScores.map((score: any) => {
        const hole = holes.find((h: any) => h.id === score.holeId);
        return {
          holeNumber: hole?.holeNumber || 1,
          holeId: score.holeId,
          strokes: score.strokes,
          putts: score.putts,
          fairwayHit: score.fairwayHit,
          greenInRegulation: score.greenInRegulation,
          powerupUsed: score.powerupUsed,
          powerupNotes: score.powerupNotes || "",
        };
      }).filter(score => score.holeNumber).sort((a: any, b: any) => a.holeNumber - b.holeNumber);
      
      setCachedScores(loadedScores);
    }
  }, [existingScores, holes]);

  

  // Save individual hole score
  const saveHoleScore = async () => {
    if (!currentHoleData || strokes === null || putts === null) return;
    
    try {
      let roundToUse = currentRoundData;
      
      if (!roundToUse) {
        // Create round first
        roundToUse = await createRoundMutation.mutateAsync({
          tournamentId: id,
          roundNumber: selectedRound,
        });
      }

      // Save the current hole score
      await createScoreMutation.mutateAsync({
        roundId: (roundToUse as any).id,
        holeId: currentHoleData.id,
        strokes,
        putts,
        fairwayHit: currentHoleData.par === 3 ? false : fairwayHit,
        greenInRegulation,
        powerupUsed,
        powerupNotes: powerupUsed ? powerupNotes : "",
      });

      // Cache this score for local navigation
      const holeScore = {
        holeNumber: currentHole,
        holeId: currentHoleData.id,
        strokes,
        putts,
        fairwayHit: currentHoleData.par === 3 ? false : fairwayHit,
        greenInRegulation,
        powerupUsed,
        powerupNotes: powerupUsed ? powerupNotes : "",
      };
      
      setCachedScores(prev => {
        const filtered = prev.filter(score => score.holeNumber !== currentHole);
        return [...filtered, holeScore].sort((a, b) => a.holeNumber - b.holeNumber);
      });
      
      if (currentHole === 18) {
        toast({
          title: "Round Complete!",
          description: "All scores have been saved. Returning to leaderboard.",
        });
        
        // Clear saved scoring state since round is complete
        clearSavedState();
        
        // Invalidate caches to trigger real-time leaderboard updates
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "player-scores"] });
        queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
        
        // Navigate back to leaderboard
        setLocation(`/tournaments/${id}/leaderboard`);
      } else {
        toast({
          title: "Score Saved",
          description: `Hole ${currentHole} score saved successfully`,
        });
        
        // Move to next hole
        if (currentHole < 18) {
          setCurrentHole(currentHole + 1);
        }
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save score. Please try again.",
        variant: "destructive",
      });
    }
  };

  const nextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const previousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

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
      
      {/* Header */}
      <section className="py-12 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-accent mb-2">Live Scoring</h2>
            <p className="text-xl text-muted-foreground">
              {(tournament as any)?.name} • Round {selectedRound}
            </p>
            
            {/* Round Selection - show only if tournament has multiple rounds */}
            {Array.isArray(tournamentRounds) && tournamentRounds.length > 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex bg-background rounded-lg p-1 shadow-sm">
                  {tournamentRounds.map((round: any) => (
                    <Button
                      key={round.id}
                      onClick={() => setSelectedRound(round.roundNumber)}
                      variant={selectedRound === round.roundNumber ? "default" : "ghost"}
                      size="sm"
                      className={`px-4 py-2 text-sm transition-all ${
                        selectedRound === round.roundNumber
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      data-testid={`button-round-${round.roundNumber}`}
                    >
                      Round {round.roundNumber}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Card className="bg-background card-shadow">
            {/* Hole Header */}
            <div className="flex justify-between items-center mb-6 p-4 bg-primary rounded-t-lg">
              <div>
                <h3 className="text-2xl font-bold text-accent" data-testid="text-hole-number">
                  Hole {currentHole}
                </h3>
                <p className="text-muted-foreground">
                  Par {currentHoleData?.par} • {currentHoleData?.yardageWhite} yards • White Tees
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Your Score</div>
                <div className="text-3xl font-bold text-accent" data-testid="text-current-score">
                  {strokes}
                </div>
              </div>
            </div>
            
            <CardContent>
              {/* Score Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Strokes
                    </label>
                    <div className="flex items-center justify-center space-x-4 bg-muted rounded-lg p-4">
                      <Button
                        onClick={() => {
                          if (strokes === null) {
                            setStrokes(currentHoleData?.par ? currentHoleData.par - 1 : 3);
                          } else {
                            setStrokes(Math.max(1, strokes - 1));
                          }
                        }}
                        size="icon"
                        className="w-12 h-12 bg-primary text-accent rounded-full hover:bg-primary/80"
                        data-testid="button-strokes-minus"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span 
                        className="text-4xl font-bold text-accent w-16 text-center"
                        data-testid="text-strokes"
                      >
                        {strokes ?? '-'}
                      </span>
                      <Button
                        onClick={() => {
                          if (strokes === null) {
                            setStrokes(currentHoleData?.par ? currentHoleData.par + 1 : 5);
                          } else {
                            setStrokes(strokes + 1);
                          }
                        }}
                        size="icon"
                        className="w-12 h-12 bg-primary text-accent rounded-full hover:bg-primary/80"
                        data-testid="button-strokes-plus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Putts
                    </label>
                    <div className="flex items-center justify-center space-x-4 bg-muted rounded-lg p-4">
                      <Button
                        onClick={() => {
                          if (putts === null) {
                            setPutts(1);
                          } else {
                            setPutts(Math.max(0, putts - 1));
                          }
                        }}
                        size="icon"
                        className="w-12 h-12 bg-primary text-accent rounded-full hover:bg-primary/80"
                        data-testid="button-putts-minus"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span 
                        className="text-2xl font-bold text-accent w-16 text-center"
                        data-testid="text-putts"
                      >
                        {putts ?? '-'}
                      </span>
                      <Button
                        onClick={() => {
                          if (putts === null) {
                            setPutts(2);
                          } else {
                            setPutts(putts + 1);
                          }
                        }}
                        size="icon"
                        className="w-12 h-12 bg-primary text-accent rounded-full hover:bg-primary/80"
                        data-testid="button-putts-plus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Hide Fairway Hit for Par 3s */}
                  {currentHoleData?.par !== 3 && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">Fairway Hit</span>
                      <Switch
                        checked={fairwayHit}
                        onCheckedChange={setFairwayHit}
                        data-testid="switch-fairway-hit"
                      />
                    </div>
                  )}
                  
                  {/* GIR toggle now available for all holes including par 3s */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Green in Regulation</span>
                    <Switch
                      checked={greenInRegulation}
                      onCheckedChange={setGreenInRegulation}
                      data-testid="switch-gir"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Powerup Used</span>
                    <Switch
                      checked={powerupUsed}
                      onCheckedChange={setPowerupUsed}
                      data-testid="switch-powerup"
                    />
                  </div>
                </div>
              </div>
              
              {/* Powerup Notes */}
              {powerupUsed && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Powerup Description
                  </label>
                  <Textarea
                    value={powerupNotes}
                    onChange={(e) => setPowerupNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe the powerup used and its result..."
                    className="w-full bg-muted border-border"
                    data-testid="textarea-powerup-notes"
                  />
                </div>
              )}
              
              {/* Navigation */}
              <div className="flex justify-between items-center mt-8">
                <Button
                  onClick={previousHole}
                  disabled={currentHole === 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                  data-testid="button-previous-hole"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Previous Hole</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  {Array.isArray(existingScores) && existingScores.length > 0 ? 'Editing Mode' : `Hole ${cachedScores.length}/18 scored`}
                </div>
                
                <Button
                  onClick={saveHoleScore}
                  disabled={createScoreMutation.isPending || strokes === null || putts === null}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  data-testid={currentHole === 18 ? "button-submit-round" : "button-save-hole"}
                >
                  {createScoreMutation.isPending ? "Saving..." : (currentHole === 18 ? "Submit Round" : "Save Hole")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
