import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AchievementDetailsModal } from "@/components/AchievementDetailsModal";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[achievement.badgeIcon] || LucideIcons.Award;
  
  const sizeClasses = {
    sm: "w-12 h-14 xs:w-14 xs:h-16 sm:w-16 sm:h-20",
    md: "w-14 h-16 xs:w-16 xs:h-20 sm:w-18 sm:h-22 md:w-20 md:h-24", 
    lg: "w-16 h-20 xs:w-18 xs:h-22 sm:w-20 sm:h-24 md:w-24 md:h-28"
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22
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
    <>
      <Card 
        className={`
          ${sizeClasses[size]} 
          ${className} 
          ${getRarityBorder(achievement.rarity || 'common')} 
          ${isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'} 
          border-2 transition-all duration-200 hover:scale-105 cursor-pointer
          ${(achievement.rarity || 'common') === 'legendary' ? 'shadow-lg' : 'shadow-md'}
        `}
        onClick={() => setIsModalOpen(true)}
        data-testid={`achievement-badge-${achievement.id}`}
      >
        <CardContent className="p-1 xs:p-1.5 sm:p-2 flex flex-col items-center justify-center h-full relative overflow-hidden">
          {/* Rarity indicator */}
          {(achievement.rarity || 'common') !== 'common' && (
            <Badge 
              variant="secondary" 
              className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[10px] xs:text-xs px-0.5 xs:px-1 py-0 min-w-0 ${
                (achievement.rarity || 'common') === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                (achievement.rarity || 'common') === 'epic' ? 'bg-purple-200 text-purple-800' :
                'bg-blue-200 text-blue-800'
              }`}
            >
              {(achievement.rarity || 'common').charAt(0).toUpperCase()}
            </Badge>
          )}
          
          {/* Icon with badge color */}
          <div className={`
            rounded-full p-1 xs:p-1.5 sm:p-2 mb-0.5 xs:mb-1 flex-shrink-0
            ${getBadgeColor(achievement.badgeColor || 'blue')}
            ${isUnlocked ? '' : 'bg-gray-400 text-gray-600'}
          `}>
            <IconComponent size={iconSizes[size]} />
          </div>
          
          {/* Achievement name */}
          <div className="text-center w-full px-0.5 xs:px-1 flex-grow flex flex-col justify-center min-h-0">
            <p className={`font-semibold leading-tight text-center overflow-hidden ${
              size === 'sm' ? 'text-[8px] xs:text-[10px] line-clamp-3' : 
              size === 'md' ? 'text-[10px] xs:text-xs line-clamp-3' :
              'text-xs line-clamp-3'
            }`}>
              {achievement.name}
            </p>
            {unlockedAt && size !== 'sm' && (
              <p className="text-[8px] xs:text-[10px] text-muted-foreground mt-0.5 xs:mt-1 truncate">
                {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AchievementDetailsModal
        achievement={achievement}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isUnlocked={isUnlocked}
        unlockedAt={unlockedAt}
      />
    </>
  );
}