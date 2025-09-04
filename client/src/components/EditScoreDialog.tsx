import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EditScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  currentRoundData: any;
}

export function EditScoreDialog({ open, onOpenChange, tournamentId, currentRoundData }: EditScoreDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedHole, setSelectedHole] = useState<string>("");
  const [strokes, setStrokes] = useState<number | null>(null);
  const [putts, setPutts] = useState<number | null>(null);
  const [fairwayHit, setFairwayHit] = useState(false);
  const [greenInRegulation, setGreenInRegulation] = useState(false);
  const [powerupUsed, setPowerupUsed] = useState(false);
  const [powerupNotes, setPowerupNotes] = useState("");

  // Get tournament data
  const { data: tournament } = useQuery({
    queryKey: ["/api/tournaments", tournamentId],
    enabled: !!tournamentId,
  });

  // Get course holes
  const { data: holes } = useQuery({
    queryKey: ["/api/courses", (tournament as any)?.courseId, "holes"],
    enabled: !!(tournament as any)?.courseId,
  });

  // Get existing scores for this round
  const { data: existingScores } = useQuery({
    queryKey: ["/api/rounds", currentRoundData?.id, "scores"],
    enabled: !!currentRoundData?.id,
    queryFn: () => fetch(`/api/rounds/${currentRoundData?.id}/scores`).then(res => res.json()),
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ scoreId, data }: { scoreId: string; data: any }) => {
      return await apiRequest("PUT", `/api/scores/${scoreId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournamentId, "leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournamentId, "player-scores"] });
      toast({
        title: "Score Updated",
        description: "Your score has been updated successfully",
      });
      onOpenChange(false);
      resetForm();
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
        description: "Failed to update score",
        variant: "destructive",
      });
    },
  });

  // Get available holes with scores
  const holesWithScores = (holes as any[])?.map((hole: any) => {
    const existingScore = Array.isArray(existingScores) 
      ? existingScores.find((s: any) => s.holeId === hole.id)
      : null;
    return {
      ...hole,
      existingScore,
      hasScore: !!existingScore
    };
  }).filter(hole => hole.hasScore) || [];

  // Load score data when hole is selected
  useEffect(() => {
    if (selectedHole) {
      const selectedHoleData = holesWithScores.find(h => h.id === selectedHole);
      if (selectedHoleData?.existingScore) {
        const score = selectedHoleData.existingScore;
        setStrokes(score.strokes);
        setPutts(score.putts);
        setFairwayHit(score.fairwayHit);
        setGreenInRegulation(score.greenInRegulation);
        setPowerupUsed(score.powerupUsed);
        setPowerupNotes(score.powerupNotes || "");
      }
    }
  }, [selectedHole, holesWithScores]);

  const resetForm = () => {
    setSelectedHole("");
    setStrokes(null);
    setPutts(null);
    setFairwayHit(false);
    setGreenInRegulation(false);
    setPowerupUsed(false);
    setPowerupNotes("");
  };

  const handleSave = () => {
    if (!selectedHole || strokes === null || strokes < 1) {
      toast({
        title: "Invalid Input",
        description: "Please select a hole and enter a valid score",
        variant: "destructive",
      });
      return;
    }

    const selectedHoleData = holesWithScores.find(h => h.id === selectedHole);
    if (!selectedHoleData?.existingScore?.id) {
      toast({
        title: "Error",
        description: "No existing score found for this hole",
        variant: "destructive",
      });
      return;
    }

    updateScoreMutation.mutate({
      scoreId: selectedHoleData.existingScore.id,
      data: {
        strokes,
        putts: putts || 0,
        fairwayHit: selectedHoleData.par === 3 ? false : fairwayHit,
        greenInRegulation,
        powerupUsed,
        powerupNotes: powerupUsed ? powerupNotes : "",
      },
    });
  };

  const selectedHoleData = holesWithScores.find(h => h.id === selectedHole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Score</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Hole Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Hole
            </label>
            <Select value={selectedHole} onValueChange={setSelectedHole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a hole to edit" />
              </SelectTrigger>
              <SelectContent>
                {holesWithScores.map((hole: any) => (
                  <SelectItem key={hole.id} value={hole.id}>
                    Hole {hole.holeNumber} • Par {hole.par} • {hole.yardageWhite} yards
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedHole && selectedHoleData && (
            <div className="space-y-4 border-t pt-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Hole {selectedHoleData.holeNumber}
                </h3>
                <p className="text-muted-foreground">
                  Par {selectedHoleData.par} • {selectedHoleData.yardageWhite} yards
                </p>
              </div>

              {/* Score Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Strokes
                  </label>
                  <div className="flex items-center justify-center space-x-4 bg-muted rounded-lg p-3">
                    <Button
                      onClick={() => setStrokes(Math.max(1, (strokes || 4) - 1))}
                      size="icon"
                      variant="outline"
                      className="w-8 h-8"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-2xl font-bold w-8 text-center">
                      {strokes ?? '-'}
                    </span>
                    <Button
                      onClick={() => setStrokes((strokes || 3) + 1)}
                      size="icon"
                      variant="outline"
                      className="w-8 h-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Putts
                  </label>
                  <div className="flex items-center justify-center space-x-4 bg-muted rounded-lg p-3">
                    <Button
                      onClick={() => setPutts(Math.max(0, (putts || 2) - 1))}
                      size="icon"
                      variant="outline"
                      className="w-8 h-8"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">
                      {putts ?? '-'}
                    </span>
                    <Button
                      onClick={() => setPutts((putts || 1) + 1)}
                      size="icon"
                      variant="outline"
                      className="w-8 h-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {selectedHoleData.par !== 3 && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Fairway Hit</span>
                    <Switch
                      checked={fairwayHit}
                      onCheckedChange={setFairwayHit}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Green in Regulation</span>
                  <Switch
                    checked={greenInRegulation}
                    onCheckedChange={setGreenInRegulation}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Powerup Used</span>
                  <Switch
                    checked={powerupUsed}
                    onCheckedChange={setPowerupUsed}
                  />
                </div>
              </div>

              {/* Powerup Notes */}
              {powerupUsed && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Powerup Description
                  </label>
                  <Textarea
                    value={powerupNotes}
                    onChange={(e) => setPowerupNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe the powerup used and its result..."
                    className="bg-muted border-border"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={updateScoreMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateScoreMutation.isPending || !selectedHole || strokes === null}
          >
            {updateScoreMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}