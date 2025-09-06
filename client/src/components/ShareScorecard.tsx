import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/IMG_4006_1756925482771.png";

interface ShareScorecardProps {
  tournamentId: string;
  roundData?: any;
  playerData?: any;
  selectedRound?: 'all' | number;
  tournamentRounds?: any[];
}

export function ShareScorecard({ tournamentId, roundData, playerData, selectedRound = 'all', tournamentRounds = [] }: ShareScorecardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedScorecardRound, setSelectedScorecardRound] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Find the selected round data
  const selectedRoundData = Array.isArray(tournamentRounds) 
    ? tournamentRounds.find(r => r.roundNumber === selectedScorecardRound)
    : null;

  // Use selected round data or fallback
  const effectiveRoundData = selectedRoundData || roundData;
  const effectiveScores = null; // Always fetch fresh data
  const effectiveTournament = null;
  const effectiveCourse = null;

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournaments", tournamentId],
    enabled: !!tournamentId && !effectiveTournament,
  });

  const { data: galleryPhotos } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "gallery"],
    enabled: !!tournamentId,
  });

  const { data: course } = useQuery({
    queryKey: ["/api/courses", (effectiveTournament || tournament as any)?.courseId],
    enabled: !!(effectiveTournament || tournament as any)?.courseId && !effectiveCourse,
  });

  const { data: holes } = useQuery({
    queryKey: ["/api/courses", (effectiveCourse || course as any)?.id, "holes"],
    enabled: !!(effectiveCourse || course as any)?.id,
  });

  // Fetch tournament player scores and filter by selected round
  const { data: tournamentPlayerScores } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "player-scores"],
    enabled: !!tournamentId,
    staleTime: 0,
  });

  // Use the EXACT same data source as the working leaderboard - player-scores API  
  const { data: playerScores } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "player-scores"],
    enabled: !!tournamentId,
    staleTime: 0,
  });

  // Process player data the EXACT same way as LeaderboardTable does
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
          handicap: score.handicap || 0,
          scores: {},
          frontNineTotal: 0,
          backNineTotal: 0,
          totalScore: 0,
          holesCompleted: 0,
        };
      }

      // Store individual hole scores - filter by selected round ONLY
      if (score.strokes !== null && score.strokes !== undefined && score.roundNumber === selectedScorecardRound) {
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

    // Calculate totals for each player (same logic as LeaderboardTable)
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
  }, [playerScores, selectedScorecardRound]);
  
  // Get current player's data from processed data (same as leaderboard)
  const currentPlayerRoundData = processedPlayerData[(playerData as any)?.id];
  

  const generateScorecard = async () => {
    
    if (!canvasRef.current || !effectiveRoundData || !playerData || !currentPlayerRoundData) return;

    setIsGenerating(true);
    
    try {
      // Use the exact same data source and processing as the working leaderboard
      if (!currentPlayerRoundData || currentPlayerRoundData.totalScore === 0) {
        toast({
          title: "No Data Found",
          description: `No score data found for Round ${selectedScorecardRound}.`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
      
      // Use the exact same processed data as the leaderboard
      const totalStrokes = currentPlayerRoundData.totalScore || 0;
      const totalPutts = Object.values(currentPlayerRoundData.scores).reduce((sum: number, score: any) => sum + (score.putts || 0), 0);
      const fairwaysHit = Object.values(currentPlayerRoundData.scores).filter((score: any) => score.fairwayHit).length;
      const greensInRegulation = Object.values(currentPlayerRoundData.scores).filter((score: any) => score.greenInRegulation).length;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for 9:16 aspect ratio (mobile-optimized)
      canvas.width = 720;
      canvas.height = 1280;

      // Get random background image from gallery
      let backgroundImageUrl = null;
      if (Array.isArray(galleryPhotos) && galleryPhotos.length > 0) {
        const randomPhoto = galleryPhotos[Math.floor(Math.random() * galleryPhotos.length)];
        backgroundImageUrl = (randomPhoto as any)?.imageUrl;
      }

      // Load and draw background image
      if (backgroundImageUrl) {
        const bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          bgImage.onload = resolve;
          bgImage.onerror = reject;
          bgImage.src = backgroundImageUrl;
        });

        // Draw background with overlay
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Add dark overlay for text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Fallback gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a4a3a');
        gradient.addColorStop(1, '#0f2419');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Main scorecard background (square layout centered on 9x16 canvas)
      const cardX = 30;
      const cardWidth = canvas.width - 60;
      const cardHeight = cardWidth; // Make it square
      const cardY = (canvas.height - cardHeight) / 2; // Center vertically

      // Helper function for rounded rectangles
      const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      // White card background with rounded corners
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      roundRect(cardX, cardY, cardWidth, cardHeight, 20);
      ctx.fill();

      // Gold accent border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      roundRect(cardX, cardY, cardWidth, cardHeight, 20);
      ctx.stroke();

      // Header section (even larger green area)
      ctx.fillStyle = '#1a4a3a';
      roundRect(cardX + 20, cardY + 20, cardWidth - 40, 250, 10);
      ctx.fill();

      // Load and draw the logo
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = logoImage;
      });

      // Draw logo in header (much larger)
      const logoHeight = 120;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = cardY + 40;
      
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

      // Course and tournament name (adjusted for even larger green area)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      const courseName = (effectiveCourse || course as any)?.name || 'Championship Course';
      const tournamentName = (effectiveTournament || tournament as any)?.name || 'Tournament';
      ctx.fillText(courseName, canvas.width / 2, cardY + 195);
      ctx.fillText(tournamentName, canvas.width / 2, cardY + 225);

      // Player section (adjusted for even larger header)
      const playerY = cardY + 310;
      
      // Player name (centered for mobile)
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      const playerName = `${(playerData as any)?.firstName || 'Player'} ${(playerData as any)?.lastName || ''}`.trim();
      ctx.fillText(playerName, canvas.width / 2, playerY);

      // Score summary (large centered display) - calculate par for completed holes only
      const completedScores = Object.values(currentPlayerRoundData.scores || {});
      const holesCompleted = completedScores.length;
      
      // Calculate par for actually played holes using hole numbers
      let completedHolesTotalPar = 0;
      Object.keys(currentPlayerRoundData.scores || {}).forEach(holeNumberStr => {
        const holeNumber = parseInt(holeNumberStr);
        const hole = Array.isArray(holes) ? holes.find((h: any) => (h.holeNumber || h.holes?.holeNumber) === holeNumber) : null;
        if (hole) {
          completedHolesTotalPar += (hole.par || hole.holes?.par || 4);
        }
      });
      
      const scoreToPar = totalStrokes > 0 && holesCompleted > 0 ? totalStrokes - completedHolesTotalPar : 0;
      const scoreToParText = scoreToPar === 0 ? 'EVEN' : 
                            scoreToPar > 0 ? `+${scoreToPar}` : 
                            `${scoreToPar}`;

      // Main score display - total strokes
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${totalStrokes}`, canvas.width / 2, playerY + 60);

      // Score relative to par (centered below main score)
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(scoreToParText, canvas.width / 2, playerY + 95);

      // Holes played (centered below par score)
      ctx.fillStyle = '#666666';
      ctx.font = '20px sans-serif';
      ctx.fillText(`(${holesCompleted} holes)`, canvas.width / 2, playerY + 120);

      // Calculate fairway stats (only par 4s and 5s count)
      const par4And5Holes = Array.isArray(holes) ? holes.filter((hole: any) => (hole.par || hole.holes?.par) === 4 || (hole.par || hole.holes?.par) === 5) : [];
      const fairwayDenominator = par4And5Holes.length;
      
      // Stats section (much larger and bold)
      const statsY = playerY + 160;
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';

      const stats = [
        `Putts: ${totalPutts || 'N/A'}`,
        `Fairways: ${fairwaysHit}/${fairwayDenominator}`,
        `GIR: ${greensInRegulation}/18`,
      ];

      stats.forEach((stat, index) => {
        ctx.fillText(stat, canvas.width / 2, statsY + (index * 40));
      });

      // Round Notes section (if any notes exist) - adjusted for larger stats
      const notesY = statsY + 120;
      const roundNotes: string[] = [];
      const currentScoresArray = Object.values(currentPlayerRoundData.scores || {});
      if (Array.isArray(currentScoresArray)) {
        currentScoresArray.forEach((score: any) => {
          const actualScore = score.scores || score;
          if (actualScore.powerupNotes && actualScore.powerupNotes.trim()) {
            const hole = Array.isArray(holes) ? holes.find((h: any) => (h.id || h.holes?.id) === actualScore.holeId) : null;
            if (hole) {
              const holeNumber = hole.holeNumber || hole.holes?.holeNumber;
              roundNotes.push(`Hole ${holeNumber}: "${actualScore.powerupNotes}"`);
            }
          }
        });
      }
      
      if (roundNotes.length > 0) {
        ctx.fillStyle = '#1a4a3a';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ROUND NOTES', canvas.width / 2, notesY);
        
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        const maxNotes = Math.min(roundNotes.length, 4); // Limit to 4 notes
        for (let i = 0; i < maxNotes; i++) {
          const noteText = roundNotes[i];
          // Wrap text if too long
          const maxWidth = cardWidth - 80;
          if (ctx.measureText(noteText).width > maxWidth) {
            const truncated = noteText.substring(0, 60) + '...';
            ctx.fillText(truncated, cardX + 40, notesY + 30 + (i * 25));
          } else {
            ctx.fillText(noteText, cardX + 40, notesY + 30 + (i * 25));
          }
        }
      }
      
      // Footer (positioned at bottom of card)
      const footerY = roundNotes.length > 0 ? notesY + 140 : cardY + cardHeight - 60;
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      const currentDate = new Date().toLocaleDateString();
      ctx.fillText(`Generated on ${currentDate}`, canvas.width / 2, footerY);
      ctx.fillText(`The Cawthra Open App`, canvas.width / 2, footerY + 20);

      // Convert to image
      const imageUrl = canvas.toDataURL('image/png', 0.9);
      setGeneratedImageUrl(imageUrl);
      
      toast({
        title: "Scorecard Generated",
        description: "Your shareable scorecard is ready!",
      });
    } catch (error) {
      console.error('Error generating scorecard:', error);
      toast({
        title: "Error",
        description: "Failed to generate scorecard",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `cawthra-open-scorecard-${Date.now()}.png`;
    link.href = generatedImageUrl;
    link.click();
  };

  const shareImage = async () => {
    if (!generatedImageUrl || !navigator.share) {
      // Fallback: copy to clipboard
      try {
        if (!generatedImageUrl) return;
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        toast({
          title: "Copied to Clipboard",
          description: "Scorecard image copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Share not supported",
          description: "Please use the download button to save the image",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'scorecard.png', { type: 'image/png' });
      
      await navigator.share({
        title: 'My Golf Scorecard',
        text: 'Check out my round at The Cawthra Open!',
        files: [file],
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
          data-testid="button-share-scorecard"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Scorecard
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-accent">
            Share Your Scorecard
          </DialogTitle>
          <DialogDescription>
            Generate a beautiful scorecard image to share your round with friends and family.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Round Selection */}
          {Array.isArray(tournamentRounds) && tournamentRounds.length > 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Select Round for Scorecard:
              </label>
              <select 
                value={selectedScorecardRound}
                onChange={(e) => setSelectedScorecardRound(Number(e.target.value))}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                {tournamentRounds.map((round: any) => (
                  <option key={round.id} value={round.roundNumber}>
                    Round {round.roundNumber}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              onClick={generateScorecard}
              disabled={isGenerating || !currentPlayerRoundData}
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-generate-scorecard"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate Round ${selectedScorecardRound} Scorecard`
              )}
            </Button>
            {!currentPlayerRoundData && (
              <p className="text-sm text-muted-foreground mt-2">
                No scores found for Round {selectedScorecardRound}
              </p>
            )}
          </div>
          
          {generatedImageUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-4">
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated Scorecard" 
                    className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                    data-testid="img-generated-scorecard"
                  />
                  
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={downloadImage}
                      variant="outline"
                      data-testid="button-download-scorecard"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <Button 
                      onClick={shareImage}
                      className="bg-secondary text-secondary-foreground hover:bg-accent"
                      data-testid="button-share-generated"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Hidden canvas for image generation */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
            data-testid="canvas-scorecard"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}