import { useState } from "react";
import { Achievement, PlayerAchievement } from "@shared/schema";
import { SkillNode } from "./SkillNode";
import { SkillTreeCategory } from "./MultiSkillTreeManager";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CategorySkillTreeProps {
  category: SkillTreeCategory;
  playerAchievements: (PlayerAchievement & { achievement: Achievement })[];
  playerId: string;
}

export function CategorySkillTree({ category, playerAchievements, playerId }: CategorySkillTreeProps) {
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

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

  const handleGenerateImage = async (achievement: Achievement) => {
    if (generatingImages.has(achievement.id) || generatedImages[achievement.id]) {
      return;
    }

    setGeneratingImages(prev => new Set([...Array.from(prev), achievement.id]));
    
    try {
      const response = await apiRequest(`/api/achievements/${achievement.id}/generate-image`, "POST");
      
      setGeneratedImages(prev => ({
        ...prev,
        [achievement.id]: (response as any).imageUrl
      }));
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setGeneratingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(achievement.id);
        return newSet;
      });
    }
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
    <div className="space-y-8">
      {/* Generate Images Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => category.achievements.forEach(achievement => handleGenerateImage(achievement))}
          disabled={generatingImages.size > 0}
          variant="secondary"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-green-50 border-green-500"
          data-testid="generate-ai-art-button"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generatingImages.size > 0 ? 'Generating AI Art...' : 'Generate AI Achievement Art'}
        </Button>
      </div>

      {/* Creately-inspired hierarchical skill tree layout */}
      <div className="relative">
        {/* Root Achievement (if exists in this category) */}
        {rootAchievement && (
          <div className="flex justify-center mb-16">
            <div className="relative">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <SkillNode
                    achievement={rootAchievement}
                    isUnlocked={unlockedAchievementIds.has(rootAchievement.id)}
                    onClick={() => {}}
                    rarity={rootAchievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                  {generatingImages.has(rootAchievement.id) && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-green-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              {/* Connection line down to foundation level */}
              {achievementsByRarity.common.length > 0 && (
                <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-16 bg-gradient-to-b from-emerald-500 to-emerald-300"></div>
              )}
            </div>
          </div>
        )}

        {/* Foundation Level - Common Achievements */}
        {achievementsByRarity.common.length > 0 && (
          <div className="space-y-12 mb-16">
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-400 text-center">Foundation Skills</h3>
            <div className={`grid gap-12 justify-items-center ${
              achievementsByRarity.common.length === 1 ? 'grid-cols-1' :
              achievementsByRarity.common.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {achievementsByRarity.common.map((achievement, index) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <SkillNode
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.has(achievement.id)}
                        onClick={() => {}}
                        rarity={achievement.rarity || 'common'}
                        position={{x: 0, y: 0}}
                      />
                      {generatingImages.has(achievement.id) && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Connection to next tier from middle achievement */}
                  {index === Math.floor(achievementsByRarity.common.length / 2) && achievementsByRarity.rare.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-16 bg-gradient-to-b from-emerald-500 to-emerald-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Level - Rare Achievements */}
        {achievementsByRarity.rare.length > 0 && (
          <div className="space-y-12 mb-16">
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 text-center">Advanced Mastery</h3>
            <div className={`grid gap-16 justify-items-center ${
              achievementsByRarity.rare.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.rare.map((achievement, index) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <SkillNode
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.has(achievement.id)}
                        onClick={() => {}}
                        rarity={achievement.rarity || 'common'}
                        position={{x: 0, y: 0}}
                      />
                      {generatingImages.has(achievement.id) && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Connection to next tier from first achievement */}
                  {index === 0 && achievementsByRarity.epic.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-16 bg-gradient-to-b from-amber-500 to-amber-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expert Level - Epic Achievements */}
        {achievementsByRarity.epic.length > 0 && (
          <div className="space-y-12 mb-16">
            <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-400 text-center">Expert Excellence</h3>
            <div className={`grid gap-20 justify-items-center ${
              achievementsByRarity.epic.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.epic.map((achievement, index) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <SkillNode
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.has(achievement.id)}
                        onClick={() => {}}
                        rarity={achievement.rarity || 'common'}
                        position={{x: 0, y: 0}}
                      />
                      {generatingImages.has(achievement.id) && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Connection to legendary tier from first achievement */}
                  {index === 0 && achievementsByRarity.legendary.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-16 bg-gradient-to-b from-violet-500 to-violet-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Level - Legendary Achievements */}
        {achievementsByRarity.legendary.length > 0 && (
          <div className="space-y-12">
            <h3 className="text-xl font-semibold text-violet-700 dark:text-violet-400 text-center">Legendary Mastery</h3>
            <div className={`grid gap-24 justify-items-center ${
              achievementsByRarity.legendary.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.legendary.map((achievement) => (
                <div key={achievement.id} className="relative" data-testid={`achievement-${achievement.id}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <SkillNode
                        achievement={achievement}
                        isUnlocked={unlockedAchievementIds.has(achievement.id)}
                        onClick={() => {}}
                        rarity={achievement.rarity || 'common'}
                        position={{x: 0, y: 0}}
                      />
                      {generatingImages.has(achievement.id) && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}