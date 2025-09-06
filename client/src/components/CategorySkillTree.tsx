import { useState } from "react";
import { Achievement, PlayerAchievement } from "@shared/schema";
import { SkillNode } from "./SkillNode";
import type { SkillTreeCategory } from "@/types/skillTree";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface CategorySkillTreeProps {
  category: SkillTreeCategory;
  playerAchievements: (PlayerAchievement & { achievement: Achievement })[];
  playerId: string;
}

export function CategorySkillTree({ category, playerAchievements, playerId }: CategorySkillTreeProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedAchievementIds = new Set(playerAchievements.map(pa => pa.achievementId));

  // Organize achievements by rarity following Creately's hierarchical structure
  const achievementsByRarity = {
    common: category.achievements.filter(a => a.rarity === 'common'),
    rare: category.achievements.filter(a => a.rarity === 'rare'), 
    epic: category.achievements.filter(a => a.rarity === 'epic'),
    legendary: category.achievements.filter(a => a.rarity === 'legendary'),
  };

  // Find a root achievement (first tournament or tournament debut)
  const rootAchievement = category.achievements.find(a => 
    a.condition === 'first_tournament' || a.name.toLowerCase().includes('debut')
  );

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const getAchievementCriteria = (achievement: Achievement) => {
    const criteriaMap: Record<string, string> = {
      'first_tournament': 'Join and complete your first tournament',
      'hole_in_one': 'Score a hole-in-one on any hole',
      'eagle': 'Score an eagle (2 strokes under par) on any hole',
      'birdie': 'Score a birdie (1 stroke under par) on any hole',
      'under_par_round': 'Complete a round with a score under par',
      'tournament_win': 'Win a tournament by finishing in 1st place',
      'score_under_threshold': achievement.value ? `Score under ${achievement.value} strokes in a round` : 'Achieve a low score',
      'fairways_in_regulation': achievement.value ? `Hit ${achievement.value} or more fairways in regulation` : 'Hit fairways consistently',
      'two_putt_master': achievement.value ? `Two-putt or better on ${achievement.value}+ holes in a round` : 'Master two-putting',
      'one_putt_master': achievement.value ? `One-putt ${achievement.value}+ holes in a round` : 'Achieve multiple one-putts',
      'consistent_performance': achievement.value ? `Score bogey or better on ${achievement.value}+ holes` : 'Play consistently',
      'consecutive_double_bogeys': achievement.value ? `Score ${achievement.value}+ consecutive double bogeys` : 'Struggle with consecutive bad holes',
      'birdie_and_triple_bogey': 'Score both a birdie and triple bogey in the same round',
      'extreme_score': 'Score more than triple par on any hole',
      'multiple_birdies_tournament': achievement.value ? `Score ${achievement.value}+ birdies in a tournament` : 'Score multiple birdies in a tournament',
      'score_69': 'Score exactly 69 strokes in a complete round',
      'no_triple_bogey_streak': 'Complete a round without any triple bogeys',
      'low_putts_round': achievement.value ? `Complete a round with ${achievement.value} or fewer putts` : 'Achieve exceptionally low putts',
      'fairway_streak': achievement.value ? `Hit ${achievement.value} consecutive fairways` : 'Hit consecutive fairways',
      'comeback_round': achievement.value ? `Improve by ${achievement.value}+ strokes from your worst 9 holes` : 'Make a strong comeback',
      'par_streak': achievement.value ? `Score par on ${achievement.value}+ holes in a round` : 'Score multiple pars',
      'tournament_count': achievement.value ? `Complete ${achievement.value} tournaments` : 'Play in multiple tournaments',
      'fast_round': achievement.value ? `Complete a round in ${achievement.value} minutes or less` : 'Play a quick round',
      'weather_round': 'Complete a round in adverse weather conditions',
    };
    
    return criteriaMap[achievement.condition] || achievement.description;
  };

  if (category.achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No achievements available in this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement Details Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedAchievement(null)}
        >
          <Card 
            className="w-full max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedAchievement.rarity === 'legendary' ? 'bg-violet-100 text-violet-700' :
                    selectedAchievement.rarity === 'epic' ? 'bg-amber-100 text-amber-700' :
                    selectedAchievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedAchievement.name.toLowerCase().includes('nice') ? '😄' :
                     selectedAchievement.name.toLowerCase().includes('eagle') ? '🦅' :
                     selectedAchievement.name.toLowerCase().includes('tournament') ? '🏆' :
                     selectedAchievement.name.toLowerCase().includes('putt') ? '🏌️' : '⭐'}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold leading-tight">{selectedAchievement.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {selectedAchievement.rarity} • {selectedAchievement.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAchievement(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                <p className="text-sm leading-relaxed">{selectedAchievement.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">How to Complete</h4>
                <p className="text-sm leading-relaxed">{getAchievementCriteria(selectedAchievement)}</p>
              </div>
              
              <div className={`p-3 rounded-lg border-2 ${
                unlockedAchievementIds.has(selectedAchievement.id) 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200' 
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${
                    unlockedAchievementIds.has(selectedAchievement.id) 
                      ? 'text-emerald-700' 
                      : 'text-slate-600'
                  }`}>
                    Status: {unlockedAchievementIds.has(selectedAchievement.id) ? 'Completed ✓' : 'In Progress'}
                  </span>
                  <div className={`h-3 w-3 rounded-full ${
                    unlockedAchievementIds.has(selectedAchievement.id) 
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                      : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>
              
              {selectedAchievement.points && (
                <div className="text-center pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">
                    Worth {selectedAchievement.points} points
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Creately-inspired hierarchical skill tree layout */}
      <div className="relative">
        {/* Root Achievement (if exists in this category) */}
        {rootAchievement && (
          <div className="flex justify-center mb-12">
            <div className="relative">
              <SkillNode
                achievement={rootAchievement}
                isUnlocked={unlockedAchievementIds.has(rootAchievement.id)}
                onClick={() => handleAchievementClick(rootAchievement)}
                rarity={rootAchievement.rarity || 'common'}
                position={{x: 0, y: 0}}
              />
              {/* Connection line down to foundation level */}
              {achievementsByRarity.common.length > 0 && (
                <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-emerald-500 to-emerald-300"></div>
              )}
            </div>
          </div>
        )}

        {/* Foundation Level - Common Achievements */}
        {achievementsByRarity.common.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 text-center">Foundation Skills</h3>
            <div className={`grid gap-6 justify-items-center ${
              achievementsByRarity.common.length === 1 ? 'grid-cols-1' :
              achievementsByRarity.common.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {achievementsByRarity.common.map((achievement, index) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                  {/* Connection to next tier from middle achievement */}
                  {index === Math.floor(achievementsByRarity.common.length / 2) && achievementsByRarity.rare.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-emerald-500 to-emerald-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Level - Rare Achievements */}
        {achievementsByRarity.rare.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 text-center">Advanced Mastery</h3>
            <div className={`grid gap-8 justify-items-center ${
              achievementsByRarity.rare.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.rare.map((achievement, index) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                  {/* Connection to next tier from first achievement */}
                  {index === 0 && achievementsByRarity.epic.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-amber-500 to-amber-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expert Level - Epic Achievements */}
        {achievementsByRarity.epic.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 text-center">Expert Excellence</h3>
            <div className={`grid gap-10 justify-items-center ${
              achievementsByRarity.epic.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.epic.map((achievement, index) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                  {/* Connection to legendary tier from first achievement */}
                  {index === 0 && achievementsByRarity.legendary.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-violet-500 to-violet-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Level - Legendary Achievements */}
        {achievementsByRarity.legendary.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-violet-700 dark:text-violet-400 text-center">Legendary Mastery</h3>
            <div className={`grid gap-12 justify-items-center ${
              achievementsByRarity.legendary.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.legendary.map((achievement) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}