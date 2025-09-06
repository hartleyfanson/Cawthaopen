import { Achievement, PlayerAchievement } from '@shared/schema';
import { SkillNode } from './SkillNode';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface VerticalAchievementTreeProps {
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  playerAchievements: PlayerAchievement[];
}

export function VerticalAchievementTree({ 
  achievements, 
  unlockedAchievements, 
  playerAchievements 
}: VerticalAchievementTreeProps) {
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

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
  // Group achievements by rarity
  const achievementsByRarity = {
    common: achievements.filter(a => a.rarity === 'common'),
    rare: achievements.filter(a => a.rarity === 'rare'),
    epic: achievements.filter(a => a.rarity === 'epic'),
    legendary: achievements.filter(a => a.rarity === 'legendary')
  };

  // Find the tournament debut achievement as the root
  const rootAchievement = achievements.find(a => 
    a.name.toLowerCase().includes('tournament') || 
    a.condition === 'tournament_count' ||
    a.category === 'tournament' ||
    a.name.toLowerCase().includes('debut')
  );

  return (
    <div className="w-full bg-gradient-to-b from-green-50 via-emerald-100 to-green-200 rounded-2xl border border-green-300 shadow-2xl overflow-hidden">
      {/* Golf course pattern background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.3) 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`,
          backgroundSize: '50px 50px, 30px 30px'
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-200/30 to-emerald-300/20"></div>
      </div>

      {/* Header with progress */}
      <div className="relative z-10 p-6 bg-green-800/90 backdrop-blur-sm text-green-50">
        <h2 className="text-2xl font-bold mb-4 text-center">Golf Mastery Journey</h2>
        <div className="flex justify-center items-center gap-6 mb-4">
          {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => {
            const rarityAchievements = achievementsByRarity[rarity];
            const unlockedCount = rarityAchievements.filter(a => unlockedAchievements.has(a.id)).length;
            const total = rarityAchievements.length;
            const colors = {
              common: 'bg-slate-400',
              rare: 'bg-emerald-400', 
              epic: 'bg-amber-400',
              legendary: 'bg-violet-400'
            };
            return (
              <div key={rarity} className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${colors[rarity]} ${unlockedCount === total ? 'opacity-100 shadow-lg' : 'opacity-30'} transition-all duration-300`} />
                <div className="text-xs text-green-100/70 mt-1 capitalize">{rarity}</div>
                <div className="text-xs text-green-100/70">{unlockedCount}/{total}</div>
              </div>
            );
          })}
        </div>
        
        {/* Generate Images Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => achievements.forEach(achievement => handleGenerateImage(achievement))}
            disabled={generatingImages.size > 0}
            variant="secondary"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-green-50 border-green-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatingImages.size > 0 ? 'Generating AI Art...' : 'Generate AI Achievement Art'}
          </Button>
        </div>
      </div>

      <div className="relative z-10 p-8 space-y-16">
        {/* Tournament Debut - Root */}
        {rootAchievement && (
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex flex-col items-center gap-2">
                <SkillNode
                  achievement={rootAchievement}
                  isUnlocked={unlockedAchievements.has(rootAchievement.id)}
                  onClick={() => handleGenerateImage(rootAchievement)}
                  rarity={rootAchievement.rarity || 'common'}
                  position={{ x: 0, y: 0 }}
                />
                {generatedImages[rootAchievement.id] && (
                  <img 
                    src={generatedImages[rootAchievement.id]} 
                    alt={rootAchievement.name}
                    className="w-16 h-16 rounded-lg object-cover shadow-lg border-2 border-green-300"
                  />
                )}
                {generatingImages.has(rootAchievement.id) && (
                  <div className="w-16 h-16 rounded-lg bg-green-100 animate-pulse flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-green-600 animate-spin" />
                  </div>
                )}
              </div>
              {/* Root connection line down */}
              <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-emerald-500 to-emerald-300"></div>
            </div>
          </div>
        )}

        {/* Common Achievements - Foundation Level */}
        {achievementsByRarity.common.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-green-800 text-center">Foundation Skills</h3>
            <div className={`grid gap-8 justify-items-center ${
              achievementsByRarity.common.length === 1 ? 'grid-cols-1' :
              achievementsByRarity.common.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {achievementsByRarity.common.map((achievement, index) => (
                <div key={achievement.id} className="relative">
                  <div className="flex flex-col items-center gap-2">
                    <SkillNode
                      achievement={achievement}
                      isUnlocked={unlockedAchievements.has(achievement.id)}
                      onClick={() => handleGenerateImage(achievement)}
                      rarity={achievement.rarity || 'common'}
                      position={{ x: 0, y: 0 }}
                    />
                    {generatedImages[achievement.id] && (
                      <img 
                        src={generatedImages[achievement.id]} 
                        alt={achievement.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-lg border border-green-300"
                      />
                    )}
                    {generatingImages.has(achievement.id) && (
                      <div className="w-12 h-12 rounded-lg bg-green-100 animate-pulse flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  {/* Connection line to next tier if not the last common achievement */}
                  {index === Math.floor(achievementsByRarity.common.length / 2) && achievementsByRarity.rare.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-emerald-500 to-emerald-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rare Achievements - Advanced Level */}
        {achievementsByRarity.rare.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-green-700 text-center">Advanced Mastery</h3>
            <div className={`grid gap-12 justify-items-center ${
              achievementsByRarity.rare.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.rare.map((achievement, index) => (
                <div key={achievement.id} className="relative">
                  <div className="flex flex-col items-center gap-2">
                    <SkillNode
                      achievement={achievement}
                      isUnlocked={unlockedAchievements.has(achievement.id)}
                      onClick={() => handleGenerateImage(achievement)}
                      rarity={achievement.rarity || 'common'}
                      position={{ x: 0, y: 0 }}
                    />
                    {generatedImages[achievement.id] && (
                      <img 
                        src={generatedImages[achievement.id]} 
                        alt={achievement.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-lg border border-green-300"
                      />
                    )}
                    {generatingImages.has(achievement.id) && (
                      <div className="w-12 h-12 rounded-lg bg-green-100 animate-pulse flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  {/* Connection line to next tier if middle rare achievement */}
                  {index === Math.floor(achievementsByRarity.rare.length / 2) && achievementsByRarity.epic.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-amber-500 to-amber-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Epic Achievements - Expert Level */}
        {achievementsByRarity.epic.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-amber-700 text-center">Expert Excellence</h3>
            <div className={`grid gap-16 justify-items-center ${
              achievementsByRarity.epic.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.epic.map((achievement, index) => (
                <div key={achievement.id} className="relative">
                  <div className="flex flex-col items-center gap-2">
                    <SkillNode
                      achievement={achievement}
                      isUnlocked={unlockedAchievements.has(achievement.id)}
                      onClick={() => handleGenerateImage(achievement)}
                      rarity={achievement.rarity || 'common'}
                      position={{ x: 0, y: 0 }}
                    />
                    {generatedImages[achievement.id] && (
                      <img 
                        src={generatedImages[achievement.id]} 
                        alt={achievement.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-lg border border-green-300"
                      />
                    )}
                    {generatingImages.has(achievement.id) && (
                      <div className="w-12 h-12 rounded-lg bg-green-100 animate-pulse flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  {/* Connection line to next tier if first epic achievement */}
                  {index === 0 && achievementsByRarity.legendary.length > 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-0.5 w-1 h-12 bg-gradient-to-b from-violet-500 to-violet-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legendary Achievements - Master Level */}
        {achievementsByRarity.legendary.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-violet-700 text-center">Legendary Mastery</h3>
            <div className={`grid gap-20 justify-items-center ${
              achievementsByRarity.legendary.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.legendary.map((achievement) => (
                <div key={achievement.id} className="relative">
                  <div className="flex flex-col items-center gap-2">
                    <SkillNode
                      achievement={achievement}
                      isUnlocked={unlockedAchievements.has(achievement.id)}
                      onClick={() => handleGenerateImage(achievement)}
                      rarity={achievement.rarity || 'common'}
                      position={{ x: 0, y: 0 }}
                    />
                    {generatedImages[achievement.id] && (
                      <img 
                        src={generatedImages[achievement.id]} 
                        alt={achievement.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-lg border border-green-300"
                      />
                    )}
                    {generatingImages.has(achievement.id) && (
                      <div className="w-12 h-12 rounded-lg bg-green-100 animate-pulse flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}