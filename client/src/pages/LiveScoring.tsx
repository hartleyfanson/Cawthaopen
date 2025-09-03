import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
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
import { ShareScorecard } from "@/components/ShareScorecard";

export default function LiveScoring() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentHole, setCurrentHole] = useState(1);
  const [strokes, setStrokes] = useState(4);
  const [putts, setPutts] = useState(2);
  const [fairwayHit, setFairwayHit] = useState(false);
  const [greenInRegulation, setGreenInRegulation] = useState(false);
  const [powerupUsed, setPowerupUsed] = useState(false);
  const [powerupNotes, setPowerupNotes] = useState("");

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

  const { data: holes } = useQuery({
    queryKey: ["/api/courses", (tournament as any)?.courseId, "holes"],
    enabled: !!(tournament as any)?.courseId,
  });

  const { data: currentRound } = useQuery({
    queryKey: ["/api/rounds", id, "1"],
    enabled: !!user && !!id,
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

  useEffect(() => {
    if (currentHoleData) {
      setStrokes(currentHoleData.par);
    }
  }, [currentHoleData]);

  const handleSaveScore = async () => {
    let roundToUse = currentRound;
    
    if (!roundToUse) {
      // Create round first and use the returned data
      roundToUse = await createRoundMutation.mutateAsync({
        tournamentId: id,
        roundNumber: 1,
      });
    }

    // Save score with the correct roundId
    await createScoreMutation.mutateAsync({
      roundId: roundToUse.id,
      holeId: currentHoleData?.id,
      strokes,
      putts,
      fairwayHit,
      greenInRegulation,
      powerupUsed,
      powerupNotes: powerupUsed ? powerupNotes : null,
    });
  };

  const nextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
      resetHoleData();
    }
  };

  const previousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
      resetHoleData();
    }
  };

  const resetHoleData = () => {
    setStrokes(4);
    setPutts(2);
    setFairwayHit(false);
    setGreenInRegulation(false);
    setPowerupUsed(false);
    setPowerupNotes("");
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
              {tournament?.name} • Round 1
            </p>
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
                        onClick={() => setStrokes(Math.max(1, strokes - 1))}
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
                        {strokes}
                      </span>
                      <Button
                        onClick={() => setStrokes(strokes + 1)}
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
                        onClick={() => setPutts(Math.max(0, putts - 1))}
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
                        {putts}
                      </span>
                      <Button
                        onClick={() => setPutts(putts + 1)}
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
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Fairway Hit</span>
                    <Switch
                      checked={fairwayHit}
                      onCheckedChange={setFairwayHit}
                      data-testid="switch-fairway-hit"
                    />
                  </div>
                  
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
                
                <Button
                  onClick={handleSaveScore}
                  disabled={createScoreMutation.isPending}
                  className="bg-secondary text-secondary-foreground hover:bg-accent font-semibold"
                  data-testid="button-save-score"
                >
                  {createScoreMutation.isPending ? "Saving..." : "Save & Continue"}
                </Button>
                
                <Button
                  onClick={nextHole}
                  disabled={currentHole === 18}
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm bg-primary text-accent hover:bg-primary/80"
                  data-testid="button-next-hole"
                >
                  <span className="hidden sm:inline">Next Hole</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              {/* Share Scorecard */}
              <div className="mt-6 text-center">
                <ShareScorecard 
                  tournamentId={id || ''}
                  roundData={currentRound}
                  playerData={user}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
