import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Achievement, PlayerAchievement } from "@shared/schema";
import { CategorySkillTree } from "./CategorySkillTree";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Target, Flag, Navigation, Users, Sparkles,
  TrendingUp, Crosshair, Eye, Timer, Crown, CloudRain
} from "lucide-react";

import type { SkillTreeCategory } from "@/types/skillTree";

interface MultiSkillTreeManagerProps {
  playerId: string;
}

export function MultiSkillTreeManager({ playerId }: MultiSkillTreeManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState("score-progression");

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: playerAchievements = [], isLoading: playerAchievementsLoading } = useQuery<
    (PlayerAchievement & { achievement: Achievement })[]
  >({
    queryKey: ["/api/players", playerId, "achievements"],
  });

  // Organize achievements into categories inspired by Creately's skill tree structure
  const skillTreeCategories: SkillTreeCategory[] = [
    {
      id: "score-progression",
      name: "Score Progression",
      icon: Trophy,
      color: "from-yellow-600 to-yellow-400",
      description: "Master the art of low scoring and breakthrough performances",
      achievements: achievements.filter(a => 
        a.condition === 'score_under_threshold' ||
        a.condition === 'under_par_round'
      )
    },
    {
      id: "consistency",
      name: "Consistency & Control",
      icon: Target,
      color: "from-blue-600 to-blue-400", 
      description: "Build reliable performance and mental toughness",
      achievements: achievements.filter(a =>
        a.condition === 'no_triple_bogey_streak' ||
        a.condition === 'consistent_performance' ||
        a.condition === 'par_streak' ||
        a.condition === 'fairway_streak' ||
        a.condition === 'fairways_in_regulation' ||
        a.condition === 'two_putt_master' ||
        a.condition === 'one_putt_master' ||
        a.condition === 'birdie' ||
        a.condition === 'eagle' ||
        a.category === 'consistency' ||
        a.name.toLowerCase().includes('consistency') ||
        a.name.toLowerCase().includes('fairway finder') ||
        a.name.toLowerCase().includes('one putt wonder') ||
        a.name.toLowerCase().includes('consistent carl') ||
        a.name.toLowerCase().includes('two putt master') ||
        a.description.toLowerCase().includes('consistent')
      )
    },
    {
      id: "putting-mastery",
      name: "Putting Mastery",
      icon: Flag,
      color: "from-green-600 to-green-400",
      description: "Perfect your touch on the greens",
      achievements: achievements.filter(a =>
        a.condition === 'low_putts_round' ||
        a.category === 'putting' ||
        (a.name.toLowerCase().includes('putt') && 
         !a.name.toLowerCase().includes('one putt wonder') &&
         !a.name.toLowerCase().includes('two putt master'))
      )
    },
    {
      id: "accuracy",
      name: "Course Strategy", 
      icon: Crosshair,
      color: "from-purple-600 to-purple-400",
      description: "Strategic play and precision shot making",
      achievements: achievements.filter(a =>
        a.condition === 'greens_in_regulation' ||
        a.condition === 'approach_accuracy' ||
        a.condition === 'smart_course_management' ||
        a.condition === 'hazard_avoidance' ||
        a.condition === 'club_selection_mastery' ||
        a.condition === 'recovery_shot_expert' ||
        a.condition === 'wind_management' ||
        a.condition === 'course_knowledge' ||
        a.condition === 'multiple_birdies_tournament' ||
        a.category === 'strategy' ||
        a.name.toLowerCase().includes('strategy') ||
        a.name.toLowerCase().includes('course management') ||
        a.name.toLowerCase().includes('smart') ||
        a.name.toLowerCase().includes('tactical')
      )
    },
    {
      id: "tournament-journey",
      name: "Tournament Journey",
      icon: Crown,
      color: "from-red-600 to-red-400",
      description: "Competitive achievements and milestone victories",
      achievements: achievements.filter(a =>
        a.condition === 'first_tournament' ||
        a.condition === 'tournament_win' ||
        a.condition === 'tournament_count' ||
        a.category === 'tournament' ||
        a.category === 'milestone'
      )
    },
    {
      id: "special-skills",
      name: "Special Skills",
      icon: Sparkles,
      color: "from-indigo-600 to-indigo-400",
      description: "Unique achievements and extraordinary moments",
      achievements: achievements.filter(a =>
        a.condition === 'weather_round' ||
        a.condition === 'fast_round' ||
        a.condition === 'comeback_round' ||
        a.condition === 'extreme_score' ||
        a.condition === 'birdie_and_triple_bogey' ||
        a.condition === 'consecutive_double_bogeys' ||
        a.condition === 'score_69' ||
        a.condition === 'hole_in_one' ||
        a.condition === 'albatross' ||
        a.category === 'special' ||
        a.name.toLowerCase().includes('weather') ||
        a.name.toLowerCase().includes('speed') ||
        a.name.toLowerCase().includes('comeback')
      )
    }
  ];

  const selectedCategoryData = skillTreeCategories.find(cat => cat.id === selectedCategory);

  if (achievementsLoading || playerAchievementsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Golf Skill Trees
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {skillTreeCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-3 flex flex-col items-center gap-1 transition-all duration-200 ${
                  isSelected 
                    ? `bg-gradient-to-r ${category.color} text-white border-0` 
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`category-${category.id}`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-xs font-medium text-center leading-tight px-1">
                  {category.name}
                </span>
                <span className="text-xs opacity-75">
                  {category.achievements.length} skills
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Skill Tree */}
      {selectedCategoryData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${selectedCategoryData.color} text-white p-4`}>
            <div className="flex items-center gap-3">
              <selectedCategoryData.icon className="w-6 h-6 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-tight">{selectedCategoryData.name}</h3>
                <p className="text-white/90 mt-1 text-sm leading-tight">{selectedCategoryData.description}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <CategorySkillTree
              category={selectedCategoryData}
              playerAchievements={playerAchievements}
              playerId={playerId}
            />
          </div>
        </div>
      )}
    </div>
  );
}