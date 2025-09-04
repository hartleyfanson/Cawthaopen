import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as LucideIcons from "lucide-react";
import type { Achievement, PlayerAchievement } from "@shared/schema";

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  unlockedAt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ 
  achievement, 
  isUnlocked = false, 
  unlockedAt,
  className = "",
  size = "md"
}: AchievementBadgeProps) {
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[achievement.badgeIcon] || LucideIcons.Award;
  
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-24", 
    lg: "w-24 h-28"
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28
  };

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

  const getRarityBorder = (rarity: string) => {
    const borders = {
      common: "border-gray-300",
      rare: "border-blue-400 shadow-blue-200",
      epic: "border-purple-400 shadow-purple-200",
      legendary: "border-yellow-400 shadow-yellow-200"
    };
    return borders[rarity as keyof typeof borders] || borders.common;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`
            ${sizeClasses[size]} 
            ${className} 
            ${getRarityBorder(achievement.rarity)} 
            ${isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'} 
            border-2 transition-all duration-200 hover:scale-105 cursor-pointer
            ${achievement.rarity === 'legendary' ? 'shadow-lg' : 'shadow-md'}
          `}>
            <CardContent className="p-2 flex flex-col items-center justify-center h-full relative">
              {/* Rarity indicator */}
              {achievement.rarity !== 'common' && (
                <Badge 
                  variant="secondary" 
                  className={`absolute top-1 right-1 text-xs px-1 py-0 ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                    achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                    'bg-blue-200 text-blue-800'
                  }`}
                >
                  {achievement.rarity.charAt(0).toUpperCase()}
                </Badge>
              )}
              
              {/* Icon with badge color */}
              <div className={`
                rounded-full p-2 mb-1
                ${getBadgeColor(achievement.badgeColor)}
                ${isUnlocked ? '' : 'bg-gray-400 text-gray-600'}
              `}>
                <IconComponent size={iconSizes[size]} />
              </div>
              
              {/* Achievement name */}
              <div className="text-center">
                <p className={`font-semibold text-xs leading-tight ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                  {achievement.name}
                </p>
                {unlockedAt && size !== 'sm' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64">
          <div className="text-center">
            <p className="font-semibold mb-1">{achievement.name}</p>
            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
            <div className="flex justify-between items-center text-xs">
              <Badge variant="outline" className="text-xs">
                {achievement.category}
              </Badge>
              <span className="text-muted-foreground">
                {achievement.points} pts
              </span>
            </div>
            {unlockedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Unlocked: {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}