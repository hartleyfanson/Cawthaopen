import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/IMG_4006_1756925482771.png";

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

      // Main scorecard background (portrait layout)
      const cardX = 30;
      const cardY = 30;
      const cardWidth = canvas.width - 60;
      const cardHeight = canvas.height - 60;

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

      // Header section (taller for mobile)
      ctx.fillStyle = '#1a4a3a';
      roundRect(cardX + 20, cardY + 20, cardWidth - 40, 160, 10);
      ctx.fill();

      // Load and draw the logo
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = logoImage;
      });

      // Draw logo in header (larger for mobile)
      const logoHeight = 80;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = cardY + 35;
      
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

      // Course and tournament name (multi-line for mobile)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      const courseName = (course as any)?.name || 'Championship Course';
      const tournamentName = (tournament as any)?.name || 'Tournament';
      ctx.fillText(courseName, canvas.width / 2, cardY + 135);
      ctx.fillText(tournamentName, canvas.width / 2, cardY + 155);

      // Player section (adjusted for mobile)
      const playerY = cardY + 220;
      
      // Player name (centered for mobile)
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      const playerName = `${(playerData as any)?.firstName || 'Player'} ${(playerData as any)?.lastName || ''}`.trim();
      ctx.fillText(playerName, canvas.width / 2, playerY);

      // Score summary (large centered display)
      const totalStrokes = (roundData as any)?.totalStrokes || 0;
      const coursePar = 72; // Default par
      const scoreToPar = totalStrokes - coursePar;
      const scoreText = scoreToPar === 0 ? 'EVEN' : 
                       scoreToPar > 0 ? `+${scoreToPar}` : 
                       `${scoreToPar}`;

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(scoreText, canvas.width / 2, playerY + 70);

      // Total score (centered below main score)
      ctx.fillStyle = '#666666';
      ctx.font = '28px sans-serif';
      ctx.fillText(`Total: ${totalStrokes}`, canvas.width / 2, playerY + 105);

      // Stats section (stacked vertically for mobile)
      const statsY = playerY + 150;
      ctx.fillStyle = '#1a4a3a';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';

      const stats = [
        `Putts: ${(roundData as any)?.totalPutts || 'N/A'}`,
        `Fairways: ${(roundData as any)?.fairwaysHit || 0}/${(roundData as any)?.fairwayAttempts || 0}`,
        `GIR: ${(roundData as any)?.greensInRegulation || 0}/${(roundData as any)?.girAttempts || 0}`,
      ];

      stats.forEach((stat, index) => {
        ctx.fillText(stat, canvas.width / 2, statsY + (index * 30));
      });

      // Hole-by-hole scores section (mobile-friendly grid)
      const holesY = statsY + 120;
      ctx.fillStyle = '#1a4a3a';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';

      // Title for holes section
      ctx.fillText('HOLE-BY-HOLE SCORES', canvas.width / 2, holesY);

      // Create 2 rows of 9 holes each for mobile layout
      const holeBoxWidth = (cardWidth - 80) / 9; // 9 holes per row
      const holeBoxHeight = 60;

      // Front 9 (holes 1-9)
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.fillText('Front 9', canvas.width / 2, holesY + 35);
      
      for (let i = 1; i <= 9; i++) {
        const x = cardX + 40 + (i - 1) * holeBoxWidth;
        const y = holesY + 50;
        
        // Hole number
        ctx.fillStyle = '#1a4a3a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(i.toString(), x + holeBoxWidth / 2, y);
        
        // Par (default 4)
        ctx.fillStyle = '#666666';
        ctx.font = '12px sans-serif';
        ctx.fillText('Par 4', x + holeBoxWidth / 2, y + 15);
        
        // Score
        const score = Math.floor(Math.random() * 3) + 3; // Demo scores 3-6
        ctx.fillStyle = score < 4 ? '#ff4444' : '#1a4a3a';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(score.toString(), x + holeBoxWidth / 2, y + 35);
      }

      // Back 9 (holes 10-18)
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.fillText('Back 9', canvas.width / 2, holesY + 130);
      
      for (let i = 10; i <= 18; i++) {
        const x = cardX + 40 + ((i - 10) * holeBoxWidth);
        const y = holesY + 145;
        
        // Hole number
        ctx.fillStyle = '#1a4a3a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(i.toString(), x + holeBoxWidth / 2, y);
        
        // Par (default 4)
        ctx.fillStyle = '#666666';
        ctx.font = '12px sans-serif';
        ctx.fillText('Par 4', x + holeBoxWidth / 2, y + 15);
        
        // Score
        const score = Math.floor(Math.random() * 3) + 3; // Demo scores 3-6
        ctx.fillStyle = score < 4 ? '#ff4444' : '#1a4a3a';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(score.toString(), x + holeBoxWidth / 2, y + 35);
      }

      // Footer (positioned at bottom of card)
      ctx.fillStyle = '#666666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      const currentDate = new Date().toLocaleDateString();
      ctx.fillText(`Generated on ${currentDate}`, canvas.width / 2, cardY + cardHeight - 40);
      ctx.fillText(`The Cawthra Open App`, canvas.width / 2, cardY + cardHeight - 20);

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