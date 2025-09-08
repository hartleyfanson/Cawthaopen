import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Minus,
  ChevronLeft,
  ArrowLeft,

} from "lucide-react";
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
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [puttsShakeAnimation, setPuttsShakeAnimation] = useState(false);

  // holds the DB id of the round we’re scoring (string when ready, null while loading/creating)
  const [roundId, setRoundId] = useState<string | null>(null);

  // Cache all hole scores until completion
  const [cachedScores, setCachedScores] = useState<
    Array<{
      holeNumber: number;
      holeId: string;
      strokes: number | null;
      putts: number | null;
      fairwayHit: boolean;
      greenInRegulation: boolean;
      powerupUsed: boolean;
      powerupNotes: string;
    }>
  >([]);

  const [, setLocation] = useLocation();

  // Local storage key for persisting scoring state (includes round number)
  const storageKey = `live-scoring-${id}-${(user as any)?.id}-round-${selectedRound}`;

  // Load scoring state from local storage on mount
  useEffect(() => {
    if (!id || !(user as any)?.id) return;

    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only load saved state if it matches the current selected round
        if (parsed.selectedRound === selectedRound) {
          if (parsed.currentHole) setCurrentHole(parsed.currentHole);
          if (parsed.strokes) setStrokes(parsed.strokes);
          if (parsed.putts) setPutts(parsed.putts);
          if (parsed.fairwayHit !== undefined) setFairwayHit(parsed.fairwayHit);
          if (parsed.greenInRegulation !== undefined)
            setGreenInRegulation(parsed.greenInRegulation);
          if (parsed.powerupUsed !== undefined)
            setPowerupUsed(parsed.powerupUsed);
          if (parsed.powerupNotes) setPowerupNotes(parsed.powerupNotes);
          if (parsed.cachedScores) setCachedScores(parsed.cachedScores);
        } else {
          // Clear state when round changes - start fresh
          setCurrentHole(1);
          setStrokes(null);
          setPutts(null);
          setFairwayHit(false);
          setGreenInRegulation(false);
          setPowerupUsed(false);
          setPowerupNotes("");
          setCachedScores([]);
        }
      } else {
        // No saved state - start fresh
        setCurrentHole(1);
        setStrokes(null);
        setPutts(null);
        setFairwayHit(false);
        setGreenInRegulation(false);
        setPowerupUsed(false);
        setPowerupNotes("");
        setCachedScores([]);
      }
    } catch (error) {
      console.log("Could not load saved scoring state:", error);
      // Fallback to fresh state on error
      setCurrentHole(1);
      setStrokes(null);
      setPutts(null);
      setFairwayHit(false);
      setGreenInRegulation(false);
      setPowerupUsed(false);
      setPowerupNotes("");
      setCachedScores([]);
    }
  }, [id, (user as any)?.id, storageKey, selectedRound]);

  // Reset scoring state when round changes (ensures fresh start for each round)
  useEffect(() => {
    setCurrentHole(1);
    setStrokes(null);
    setPutts(null);
    setFairwayHit(false);
    setGreenInRegulation(false);
    setPowerupUsed(false);
    setPowerupNotes("");
    // Reset roundId so it gets reloaded for the new round
    setRoundId(null);
    // Don't clear cached scores immediately - let the storage loading logic handle it
  }, [selectedRound]);

  // Save scoring state to local storage whenever it changes
  useEffect(() => {
    if (!id || !(user as any)?.id) return;

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
      console.log("Could not save scoring state:", error);
    }
  }, [
    selectedRound,
    currentHole,
    strokes,
    putts,
    fairwayHit,
    greenInRegulation,
    powerupUsed,
    powerupNotes,
    cachedScores,
    storageKey,
    id,
    (user as any)?.id,
  ]);

  // Clear local storage when round is completed
  const clearSavedState = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.log("Could not clear saved state:", error);
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

  // Initialize all rounds for this player when first accessing live scoring
  const initializeRoundsMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const res = await apiRequest("POST", `/api/tournaments/${tournamentId}/initialize-rounds`, {});
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      console.log(`Initialized ${data.rounds?.length || 0} rounds for tournament:`, data.rounds);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "rounds"] });
      
      // Trigger a refetch of current round data to ensure roundId gets set
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(id), String(selectedRound)] });
    },
    onError: (error: any) => {
      console.error("Failed to initialize rounds:", error);
      // Don't show error toast as this is a background operation
      // The user can still proceed if rounds already exist or will be created on-demand
    },
  });

  // Auto-initialize rounds when component loads (only once per tournament per user)
  useEffect(() => {
    if (!user || !id || initializeRoundsMutation.isPending) return;
    
    // Only initialize if we haven't done so yet for this tournament
    const storageKey = `rounds-initialized-${id}-${(user as any)?.id}`;
    const alreadyInitialized = localStorage.getItem(storageKey);
    
    if (!alreadyInitialized) {
      console.log("Initializing rounds for tournament:", id);
      initializeRoundsMutation.mutate(String(id));
      localStorage.setItem(storageKey, "true");
    } else {
      console.log("Rounds already initialized for tournament:", id);
    }
  }, [user, id, initializeRoundsMutation]);

  const { data: holes } = useQuery({
    queryKey: ["/api/courses", (tournament as any)?.courseId, "holes"],
    enabled: !!(tournament as any)?.courseId,
  });

  const { data: currentRoundData } = useQuery({
    queryKey: ["/api/rounds", String(id), String(selectedRound)],
    enabled: !!user && !!id && !!selectedRound,
    retry: 3, // Retry more times in case round is still being created
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),
    queryFn: async () => {
      console.log(`Loading round ${selectedRound} for tournament ${id}...`);
      // Try to load the round (should exist after initialization)
      const res = await fetch(`/api/rounds/${id}/${selectedRound}`);
      if (res.status === 404) {
        // Fallback: create the round if it somehow doesn't exist
        console.log(`Round ${selectedRound} not found, creating it...`);
        const createRes = await apiRequest("POST", "/api/rounds", {
          tournamentId: String(id),
          roundNumber: Number(selectedRound),
        });

        if (!createRes.ok) {
          const errorText = await createRes.text();
          console.error("Failed to create round:", errorText);
          throw new Error(errorText);
        }
        const created = await createRes.json();
        console.log("Round created successfully:", created);
        setRoundId(created.id);
        return created;
      }
      if (!res.ok) {
        console.error("Failed to load round:", res.status, res.statusText);
        throw new Error("Failed to load current round");
      }
      const data = await res.json();
      console.log("Round loaded successfully:", data);
      setRoundId(data.id);
      return data;
    },
  });

  const { data: existingScores } = useQuery({
    queryKey: ["/api/rounds", String(roundId), "scores"],
    enabled: !!roundId,
    queryFn: () =>
      fetch(`/api/rounds/${roundId}/scores`).then((res) => res.json()),
  });

  const { data: teeSelections } = useQuery({
    queryKey: ["/api/tournaments", id, "tee-selections"],
    enabled: !!id,
  });

  // Check round completion status for validation
  const { data: roundCompletionData } = useQuery({
    queryKey: ["/api/rounds", id, "completion-status"],
    queryFn: async () => {
      if (!id || !(user as any)?.id) return {};

      const completionChecks = [];
      // Check completion for all rounds (including current round for unlocking next rounds)
      const maxRounds = Array.isArray(tournamentRounds)
        ? tournamentRounds.length
        : 2;
      for (let i = 1; i <= maxRounds; i++) {
        completionChecks.push(
          fetch(`/api/rounds/${id}/${i}/completed`)
            .then((res) => res.json())
            .then((data) => ({ round: i, isCompleted: data.isCompleted }))
            .catch(() => ({ round: i, isCompleted: false })), // Handle errors gracefully
        );
      }

      const results = await Promise.all(completionChecks);
      return results.reduce(
        (acc, result) => {
          acc[result.round] = result.isCompleted;
          return acc;
        },
        {} as Record<number, boolean>,
      );
    },
    enabled: !!id && !!(user as any)?.id,
  });

  const createScoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scores", data);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(id), String(selectedRound), "ensure"] }),
        roundId
        ? queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(roundId), "scores"] })
        : Promise.resolve(),

        queryClient.invalidateQueries({ queryKey: ["/api/rounds", id, "completion-status"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "leaderboard", selectedRound] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "player-scores", selectedRound] }),
      ]);

      toast({
        title: "Score Saved",
        description: `Hole ${currentHole} score saved successfully`,
      });
    },

    onError: (error: any) => {
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

  const updateScoreMutation = useMutation({
    mutationFn: async ({ scoreId, data }: { scoreId: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/scores/${scoreId}`, data);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(id), String(selectedRound), "ensure"] }),
        roundId
        ? queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(roundId), "scores"] })
        : Promise.resolve(),

        queryClient.invalidateQueries({ queryKey: ["/api/rounds", id, "completion-status"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "leaderboard", selectedRound] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "player-scores", selectedRound] }),
      ]);

      toast({
        title: "Score Updated",
        description: `Hole ${currentHole} score updated successfully`,
      });
    },

    onError: (error: any) => {
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
        description: "Failed to update score",
        variant: "destructive",
      });
    },
  });

  const currentHoleData = (holes as any[])?.find(
    (hole: any) => hole.holeNumber === currentHole,
  );

  // Auto-correct golf scores based on professional rules
  useEffect(() => {
    if (strokes !== null && putts !== null && currentHoleData) {
      // Auto-correct GIR based on shots to green
      const shotsToGreen = strokes - putts;
      const girRequired = currentHoleData.par - 2; // Par 3: 1 shot, Par 4: 2 shots, Par 5: 3 shots
      const shouldBeGIR = shotsToGreen <= girRequired;

      if (shouldBeGIR !== greenInRegulation) {
        setGreenInRegulation(shouldBeGIR);
      }

      // Auto-correct putts if they exceed total strokes
      if (putts > strokes) {
        setPutts(Math.max(0, strokes - 1)); // Leave at least 1 stroke for approach
      }

      // Professional rule: if no GIR but made par, you can't have 2+ putts
      if (!shouldBeGIR && strokes === currentHoleData.par && putts >= 2) {
        setPutts(1); // Must be 1 putt after chip/pitch
      }

      // If GIR with 0 putts, you likely holed out (not GIR)
      if (shouldBeGIR && putts === 0 && strokes < currentHoleData.par) {
        setGreenInRegulation(false); // Holed out from off the green
      }

      setValidationWarnings([]); // Clear warnings since we auto-correct
    } else {
      setValidationWarnings([]);
    }
  }, [strokes, putts, currentHoleData]);

  // Get tee selection for current hole
  const currentTeeSelection = Array.isArray(teeSelections)
    ? teeSelections.find((tee: any) => tee.holeNumber === currentHole)
    : null;
  const currentTeeColor = currentTeeSelection?.teeColor || "white";

  // Get yardage based on tee selection
  const getHoleYardage = (hole: any, teeColor: string) => {
    if (!hole) return 0;
    switch (teeColor.toLowerCase()) {
      case "blue":
        return hole.yardageBlue || hole.yardageWhite || 0;
      case "red":
        return hole.yardageRed || hole.yardageWhite || 0;
      case "gold":
        return hole.yardageGold || hole.yardageWhite || 0;
      default:
        return hole.yardageWhite || 0;
    }
  };

  const currentYardage = getHoleYardage(currentHoleData, currentTeeColor);

  // Format tee color for display
  const formatTeeColor = (teeColor: string) => {
    return (
      teeColor.charAt(0).toUpperCase() +
      teeColor.slice(1).toLowerCase() +
      " Tees"
    );
  };
  
  const roundReady = !!roundId && Array.isArray(holes) && holes.length > 0;
  

  // Calculate round progress (score-to-par for holes completed so far)
  const calculateRoundProgress = () => {
    if (!Array.isArray(holes) || cachedScores.length === 0) {
      return { holesCompleted: 0, totalStrokes: 0, totalPar: 0, scoreToPar: 0 };
    }

    let totalStrokes = 0;
    let totalPar = 0;
    let holesCompleted = 0;

    cachedScores.forEach((score) => {
      if (score.strokes !== null && score.strokes > 0) {
        const hole = holes.find((h: any) => h.holeNumber === score.holeNumber);
        if (hole) {
          totalStrokes += score.strokes;
          totalPar += hole.par;
          holesCompleted++;
        }
      }
    });

    const scoreToPar = holesCompleted > 0 ? totalStrokes - totalPar : 0;
    return { holesCompleted, totalStrokes, totalPar, scoreToPar };
  };

  const roundProgress = calculateRoundProgress();

  // Load existing score data when navigating to a hole (for editing)
  useEffect(() => {
    if (currentHoleData) {
      // Check if there's an existing score for this hole
      const existingScore = cachedScores.find(
        (score) => score.holeNumber === currentHole,
      );

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
    if (
      Array.isArray(existingScores) &&
      Array.isArray(holes) &&
      existingScores.length > 0
    ) {
      const loadedScores = existingScores
        .map((score: any) => {
          const hole = (holes as any[]).find((h: any) => h.id === score.holeId);
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
        })
        .filter((score) => score.holeNumber)
        .sort((a: any, b: any) => a.holeNumber - b.holeNumber);

      setCachedScores(loadedScores);
    }
  }, [existingScores, holes]);

  // Save individual hole score
      const saveHoleScore = async () => {
        if (!currentHoleData || strokes === null || strokes < 1) return;

        try {
          // Round should already be created when entering live scoring
          if (!roundId) {
            toast({
              title: "Please wait…",
              description: "Setting up your round. Try again in a moment.",
            });
            return;
          }

          const scoreData = {
            strokes,
            putts: putts || 0, // Default putts to 0 if null
            fairwayHit: currentHoleData.par === 3 ? false : fairwayHit,
            greenInRegulation,
            powerupUsed,
            powerupNotes: powerupUsed ? powerupNotes : "",
          };

          // Check if a score already exists for this hole
          const existingScore = Array.isArray(existingScores)
            ? existingScores.find((s: any) => s.holeId === currentHoleData.id)
            : null;

          if (existingScore) {
            // Update existing score
            await updateScoreMutation.mutateAsync({
              scoreId: existingScore.id,
              data: scoreData,
            });
          } else {
            // Create new score
            await createScoreMutation.mutateAsync({
              roundId,
              holeId: currentHoleData.id,
              ...scoreData,
            });
          }

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

          setCachedScores((prev) => {
            const filtered = prev.filter((score) => score.holeNumber !== currentHole);
            return [...filtered, holeScore].sort((a, b) => a.holeNumber - b.holeNumber);
          });

          if (currentHole === 18) {
            toast({
              title: "Round Complete!",
              description: "All scores have been saved. Returning to leaderboard.",
            });

            // Clear saved scoring state since round is complete
            clearSavedState();

            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "leaderboard", selectedRound] }),
              queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "player-scores", selectedRound] }),
              queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(id), String(selectedRound), "ensure"] }),
              roundId
                ? queryClient.invalidateQueries({ queryKey: ["/api/rounds", String(roundId), "scores"] })
                : Promise.resolve(),
              queryClient.invalidateQueries({ queryKey: ["/api/rounds"] }),
              queryClient.invalidateQueries({ queryKey: ["/api/rounds", id, "completion-status"] }),
            ]);

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
            <div className="flex items-center justify-center mb-4 relative">
              <Link href={`/tournaments/${id}/leaderboard`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-0 flex items-center gap-2"
                  data-testid="button-back-to-leaderboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Leaderboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <h2 className="text-3xl font-serif font-bold text-accent">
                Live Scoring
              </h2>
            </div>
            <p className="text-xl text-muted-foreground">
              {(tournament as any)?.name} • Round {selectedRound}
            </p>

            {/* Round Selection - show only if tournament has multiple rounds */}
            {Array.isArray(tournamentRounds) && tournamentRounds.length > 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex bg-background rounded-lg p-1 shadow-sm">
                  {tournamentRounds.map((round: any) => {
                    // Check if previous rounds are completed
                    const isPreviousRoundCompleted =
                      round.roundNumber === 1 ||
                      (roundCompletionData &&
                        roundCompletionData[round.roundNumber - 1]);

                    // Check if this round itself is completed (should be locked for editing)
                    const isThisRoundCompleted =
                      roundCompletionData &&
                      roundCompletionData[round.roundNumber];

                    // Can access round if: previous rounds are complete AND this round is not yet completed
                    const canAccessRound =
                      isPreviousRoundCompleted && !isThisRoundCompleted;

                    // Show reason for lock
                    let lockReason = "";
                    if (!isPreviousRoundCompleted) {
                      lockReason = `Complete Round ${round.roundNumber - 1} first`;
                    } else if (isThisRoundCompleted) {
                      lockReason = `Round ${round.roundNumber} is completed and locked`;
                    }

                    return (
                      <Button
                        key={round.id}
                        onClick={() =>
                          canAccessRound && setSelectedRound(round.roundNumber)
                        }
                        variant={
                          selectedRound === round.roundNumber
                            ? "default"
                            : "ghost"
                        }
                        size="sm"
                        disabled={!canAccessRound}
                        className={`px-4 py-2 text-sm transition-all ${
                          selectedRound === round.roundNumber
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : canAccessRound
                              ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                              : "text-muted-foreground/50 cursor-not-allowed"
                        }`}
                        data-testid={`button-round-${round.roundNumber}`}
                        title={!canAccessRound ? lockReason : undefined}
                      >
                        Round {round.roundNumber}
                        {!canAccessRound && (
                          <span className="ml-1 text-xs">
                            {isThisRoundCompleted ? "✅" : "🔒"}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Check if current round is completed and locked */}
          {roundCompletionData && roundCompletionData[selectedRound] ? (
            <Card className="bg-background card-shadow">
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <span className="text-6xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold text-accent mb-2">
                  Round {selectedRound} Complete
                </h3>
                <p className="text-muted-foreground mb-4">
                  You have completed all 18 holes for Round {selectedRound}.
                  This round is now locked and cannot be edited.
                </p>
                <Link href={`/tournaments/${id}/leaderboard`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-background card-shadow">
              {/* Hole Header */}
              <div className="flex justify-between items-center mb-6 p-4 bg-primary rounded-t-lg">
                <div>
                  <h3
                    className="text-2xl font-bold text-accent"
                    data-testid="text-hole-number"
                  >
                    Hole {currentHole}
                  </h3>
                  <p className="text-muted-foreground">
                    Par {currentHoleData?.par} • {currentYardage} yards •{" "}
                    {formatTeeColor(currentTeeColor)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Your Score
                  </div>
                  <div
                    className="text-3xl font-bold text-accent"
                    data-testid="text-current-score"
                  >
                    {strokes}
                  </div>
                  {/* Round Progress */}
                  {roundProgress.holesCompleted > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      After {roundProgress.holesCompleted} holes:{" "}
                      <span
                        className={`font-medium ${
                          roundProgress.scoreToPar === 0
                            ? "text-gray-400"
                            : roundProgress.scoreToPar < 0
                              ? "text-green-400"
                              : "text-red-400"
                        }`}
                      >
                        {roundProgress.scoreToPar === 0
                          ? "E"
                          : roundProgress.scoreToPar > 0
                            ? `+${roundProgress.scoreToPar}`
                            : roundProgress.scoreToPar}
                      </span>
                    </div>
                  )}
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
                              // First press sets to par
                              setStrokes(currentHoleData?.par || 4);
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
                          {strokes ?? "-"}
                        </span>
                        <Button
                          onClick={() => {
                            if (strokes === null) {
                              // First press sets to par
                              setStrokes(currentHoleData?.par || 4);
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
                      <div
                        className={`flex items-center justify-center space-x-4 bg-muted rounded-lg p-4 ${puttsShakeAnimation ? "shake-animation" : ""}`}
                      >
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
                          {putts ?? "-"}
                        </span>
                        <Button
                          onClick={() => {
                            if (putts === null) {
                              setPutts(2);
                            } else {
                              const maxPutts = Math.max(1, (strokes || 1) - 1); // Max putts = strokes - 1
                              if (putts >= maxPutts) {
                                // Trigger shake animation when trying to exceed max
                                setPuttsShakeAnimation(true);
                                setTimeout(
                                  () => setPuttsShakeAnimation(false),
                                  500,
                                );
                              } else {
                                setPutts(putts + 1);
                              }
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
                        <span className="font-medium text-foreground">
                          Fairway Hit
                        </span>
                        <Switch
                          checked={fairwayHit}
                          onCheckedChange={setFairwayHit}
                          data-testid="switch-fairway-hit"
                        />
                      </div>
                    )}

                    {/* GIR toggle now available for all holes including par 3s */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">
                        Green in Regulation
                      </span>
                      <Switch
                        checked={greenInRegulation}
                        onCheckedChange={(checked) => {
                          // Only allow GIR if putts > 0 (or if unchecking)
                          if (!checked || (putts !== null && putts > 0)) {
                            setGreenInRegulation(checked);
                          }
                        }}
                        disabled={putts === 0}
                        data-testid="switch-gir"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">
                        Powerup Used
                      </span>
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
                    {Array.isArray(existingScores) && existingScores.length > 0
                      ? "Editing Mode"
                      : `Hole ${cachedScores.length}/18 scored`}
                  </div>

                  <Button
                    onClick={saveHoleScore}
                    disabled={
                      !roundReady ||
                      createScoreMutation.isPending ||
                      strokes === null ||
                      strokes < 1
                    }
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                    data-testid={currentHole === 18 ? "button-submit-round" : "button-save-hole"}
                  >
                    {createScoreMutation.isPending
                      ? "Saving..."
                      : currentHole === 18
                        ? "Submit Round"
                        : "Save Hole"}
                  </Button>

                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
