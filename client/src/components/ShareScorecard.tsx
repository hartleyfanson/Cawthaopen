import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareScorecardProps {
  tournamentId: string;
  roundData?: any;
  playerData?: any;
}

export function ShareScorecard({ tournamentId, roundData, playerData }: ShareScorecardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournaments", tournamentId],
    enabled: !!tournamentId,
  });

  const { data: galleryPhotos } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "gallery"],
    enabled: !!tournamentId,
  });

  const { data: course } = useQuery({
    queryKey: ["/api/courses", (tournament as any)?.courseId],
    enabled: !!(tournament as any)?.courseId,
  });

  const generateScorecard = async () => {
    if (!canvasRef.current || !roundData || !playerData) return;

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for high quality
      canvas.width = 1200;
      canvas.height = 630;

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

      // Main scorecard background
      const cardX = 60;
      const cardY = 60;
      const cardWidth = canvas.width - 120;
      const cardHeight = canvas.height - 120;

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

      // Header section
      ctx.fillStyle = '#1a4a3a';
      roundRect(cardX + 20, cardY + 20, cardWidth - 40, 100, 10);
      ctx.fill();

      // Tournament title
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE CAWTHRA OPEN', canvas.width / 2, cardY + 65);

      // Course and date
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      const courseName = (course as any)?.name || 'Championship Course';
      const tournamentName = (tournament as any)?.name || 'Tournament';
      ctx.fillText(`${courseName} • ${tournamentName}`, canvas.width / 2, cardY + 95);

      // Player section
      const playerY = cardY + 160;
      
      // Player name
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'left';
      const playerName = `${(playerData as any)?.firstName || 'Player'} ${(playerData as any)?.lastName || ''}`.trim();
      ctx.fillText(playerName, cardX + 40, playerY);

      // Score summary
      const totalStrokes = (roundData as any)?.totalStrokes || 0;
      const coursePar = 72; // Default par
      const scoreToPar = totalStrokes - coursePar;
      const scoreText = scoreToPar === 0 ? 'EVEN' : 
                       scoreToPar > 0 ? `+${scoreToPar}` : 
                       `${scoreToPar}`;

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(scoreText, cardX + cardWidth - 40, playerY);

      // Total score
      ctx.fillStyle = '#666666';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Total: ${totalStrokes}`, cardX + cardWidth - 40, playerY + 35);

      // Stats section
      const statsY = playerY + 80;
      ctx.fillStyle = '#1a4a3a';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'left';

      const stats = [
        `Putts: ${(roundData as any)?.totalPutts || 'N/A'}`,
        `Fairways: ${(roundData as any)?.fairwaysHit || 0}/${(roundData as any)?.fairwayAttempts || 0}`,
        `GIR: ${(roundData as any)?.greensInRegulation || 0}/${(roundData as any)?.girAttempts || 0}`,
      ];

      stats.forEach((stat, index) => {
        ctx.fillText(stat, cardX + 40 + (index * 200), statsY);
      });

      // Hole-by-hole scores section
      const holesY = statsY + 60;
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';

      // Holes header
      const holeWidth = (cardWidth - 80) / 18;
      for (let i = 1; i <= 18; i++) {
        const x = cardX + 40 + (i - 1) * holeWidth;
        ctx.fillText(i.toString(), x + holeWidth / 2, holesY);
      }

      // Par row
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      for (let i = 1; i <= 18; i++) {
        const x = cardX + 40 + (i - 1) * holeWidth;
        ctx.fillText('4', x + holeWidth / 2, holesY + 25); // Default par 4
      }

      // Score row
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 16px sans-serif';
      for (let i = 1; i <= 18; i++) {
        const x = cardX + 40 + (i - 1) * holeWidth;
        const score = Math.floor(Math.random() * 3) + 3; // Demo scores 3-6
        
        // Highlight under par scores
        if (score < 4) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(x + holeWidth / 2, holesY + 45, 15, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#ff4444';
        } else {
          ctx.fillStyle = '#1a4a3a';
        }
        
        ctx.fillText(score.toString(), x + holeWidth / 2, holesY + 50);
      }

      // Footer
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      const currentDate = new Date().toLocaleDateString();
      ctx.fillText(`Generated on ${currentDate} • The Cawthra Open App`, canvas.width / 2, cardY + cardHeight - 20);

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
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <Button 
              onClick={generateScorecard}
              disabled={isGenerating}
              className="bg-secondary text-secondary-foreground hover:bg-accent"
              data-testid="button-generate-scorecard"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Scorecard'
              )}
            </Button>
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