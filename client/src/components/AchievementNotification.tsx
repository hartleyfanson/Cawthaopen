import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import type { Achievement } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHide?: number; // Duration in ms before auto-hiding
}

export function AchievementNotification({ 
  achievement, 
  onDismiss,
  autoHide = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[achievement.badgeIcon] || LucideIcons.Award;
  
  useEffect(() => {
    // Show notification after a brief delay
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide if specified
    if (autoHide > 0) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow animation to complete
      }, autoHide);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
    
    return () => clearTimeout(showTimer);
  }, [autoHide, onDismiss]);

  const getBadgeColor = (color: string) => {
    const colors = {
      gold: "from-yellow-400 to-yellow-600",
      silver: "from-gray-300 to-gray-500",
      bronze: "from-amber-600 to-amber-800",
      blue: "from-blue-400 to-blue-600",
      green: "from-green-400 to-green-600",
      purple: "from-purple-400 to-purple-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "border-gray-300 bg-white",
      rare: "border-blue-400 bg-blue-50",
      epic: "border-purple-400 bg-purple-50",
      legendary: "border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-200"
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.4 
          }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card 
            className={`
              border-2 cursor-pointer transition-all duration-200 hover:scale-105
              ${getRarityColor(achievement.rarity)}
            `}
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {/* Achievement Icon */}
                <div className={`
                  rounded-full p-3 bg-gradient-to-br ${getBadgeColor(achievement.badgeColor)}
                  ${achievement.rarity === 'legendary' ? 'animate-pulse' : ''}
                `}>
                  <IconComponent size={24} className="text-white" />
                </div>
                
                {/* Achievement Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">
                      Achievement Unlocked!
                    </p>
                    {achievement.rarity !== 'common' && (
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                          achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                          'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {achievement.rarity}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="font-bold text-lg text-foreground leading-tight mb-1">
                    {achievement.name}
                  </p>
                  
                  <p className="text-sm text-muted-foreground leading-tight mb-2">
                    {achievement.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {achievement.category}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      +{achievement.points} pts
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Click to dismiss hint */}
              <p className="text-xs text-muted-foreground text-center mt-3 opacity-70">
                Click to dismiss
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}