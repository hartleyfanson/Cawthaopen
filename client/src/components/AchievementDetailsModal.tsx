import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import * as LucideIcons from "lucide-react";
import type { Achievement } from "@shared/schema";

interface AchievementDetailsModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  isUnlocked?: boolean;
  unlockedAt?: string;
}

export function AchievementDetailsModal({ 
  achievement, 
  isOpen, 
  onClose, 
  isUnlocked = false,
  unlockedAt
}: AchievementDetailsModalProps) {
  if (!achievement) return null;

  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[achievement.badgeIcon] || LucideIcons.Award;

  const getBadgeColor = (color: string) => {
    const colors = {
      gold: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900",
      silver: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900",
      bronze: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100",
      blue: "bg-gradient-to-br from-blue-400 to-blue-600 text-blue-900",
      green: "bg-gradient-to-br from-green-400 to-green-600 text-green-900",
      purple: "bg-gradient-to-br from-purple-400 to-purple-600 text-purple-900",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getRarityColor = (rarity: string | null) => {
    const colors = {
      common: "text-gray-600 bg-gray-100",
      rare: "text-blue-800 bg-blue-100",
      epic: "text-purple-800 bg-purple-100",
      legendary: "text-yellow-800 bg-yellow-100"
    };
    return colors[(rarity || 'common') as keyof typeof colors] || colors.common;
  };

  const getEarningCriteria = (condition: string, value?: number | null) => {
    const criteria: Record<string, string> = {
      'first_tournament': 'Join and complete your first tournament',
      'hole_in_one': 'Score a hole-in-one on any par 2+ hole',
      'eagle': 'Score an eagle (2 strokes under par) on any hole',
      'birdie': 'Score a birdie (1 stroke under par) on any hole',
      'under_par_round': 'Complete a round with a total score under par',
      'tournament_win': 'Win a tournament by finishing in 1st place',
      'score_under_threshold': value ? `Complete a round with ${value} or fewer total strokes` : 'Complete a round under a specific stroke count',
      'fairways_in_regulation': value ? `Hit ${value} or more fairways in regulation in a single round` : 'Hit multiple fairways in regulation in a round',
      'two_putt_master': value ? `Make ${value} or more holes with 2 putts or better in a single round` : 'Demonstrate consistent putting performance',
      'one_putt_master': value ? `Make ${value} or more one-putt holes in a single round` : 'Show exceptional putting skill with multiple one-putts',
      'consistent_performance': value ? `Play ${value} or more holes at bogey or better in a single round` : 'Show consistent scoring throughout a round',
      'consecutive_double_bogeys': value ? `Make ${value} or more consecutive double bogeys in a round` : 'Experience a challenging streak of double bogeys',
      'birdie_and_triple_bogey': 'Score both a birdie and a triple bogey in the same round',
      'extreme_score': 'Score more than triple the par on any hole',
      'multiple_birdies_tournament': value ? `Score ${value} or more birdies across an entire tournament` : 'Score multiple birdies throughout a tournament',
      'crowd_favorite_vote': 'Be voted as the crowd favorite by fellow players for exceptional sportsmanship or memorable moments'
    };
    
    return criteria[condition] || 'Complete specific golf performance criteria';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Achievement Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Achievement Icon and Title */}
          <div className="flex flex-col items-center space-y-4">
            <Card className={`w-24 h-28 border-2 ${
              (achievement.rarity || 'common') === 'legendary' ? 'border-yellow-400 shadow-lg shadow-yellow-200' :
              (achievement.rarity || 'common') === 'epic' ? 'border-purple-400 shadow-purple-200' :
              (achievement.rarity || 'common') === 'rare' ? 'border-blue-400 shadow-blue-200' :
              'border-gray-300'
            } ${isUnlocked ? 'opacity-100' : 'opacity-60 grayscale'}`}>
              <CardContent className="p-2 flex flex-col items-center justify-center h-full relative">
                {/* Rarity indicator */}
                {(achievement.rarity || 'common') !== 'common' && (
                  <Badge 
                    variant="secondary" 
                    className={`absolute top-1 right-1 text-xs px-1 py-0 ${getRarityColor(achievement.rarity || 'common')}`}
                  >
                    {(achievement.rarity || 'common').charAt(0).toUpperCase()}
                  </Badge>
                )}
                
                {/* Icon with badge color */}
                <div className={`
                  rounded-full p-3 mb-2
                  ${getBadgeColor(achievement.badgeColor)}
                  ${isUnlocked ? '' : 'bg-gray-400 text-gray-600'}
                `}>
                  <IconComponent size={28} />
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">{achievement.name}</h3>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className={getRarityColor(achievement.rarity || 'common')}>
                  {(achievement.rarity || 'common').charAt(0).toUpperCase() + (achievement.rarity || 'common').slice(1)}
                </Badge>
                <Badge variant="secondary">{achievement.category}</Badge>
                <Badge variant="outline">{achievement.points} pts</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
              <p className="text-foreground">{achievement.description}</p>
            </div>

            {/* How to Earn */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">How to Earn</h4>
              <p className="text-foreground">{getEarningCriteria(achievement.condition, achievement.value)}</p>
            </div>

            {/* Unlock Status */}
            {isUnlocked && unlockedAt && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Unlocked</h4>
                <p className="text-foreground">
                  {new Date(unlockedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {!isUnlocked && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">🔒 Complete the criteria above to unlock this achievement</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}