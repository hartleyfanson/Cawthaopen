import { Achievement } from "@shared/schema";

interface SkillNodeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  onClick: () => void;
  rarity: string;
}

export function SkillNode({ achievement, isUnlocked, onClick, rarity }: SkillNodeProps) {
  const rarityConfig = {
    legendary: { 
      color: 'from-purple-500 to-pink-500', 
      bgColor: 'bg-purple-50 border-purple-200', 
      textColor: 'text-purple-700',
      shadowColor: 'shadow-purple-500/20'
    },
    epic: { 
      color: 'from-orange-500 to-red-500', 
      bgColor: 'bg-orange-50 border-orange-200', 
      textColor: 'text-orange-700',
      shadowColor: 'shadow-orange-500/20'
    },
    rare: { 
      color: 'from-blue-500 to-cyan-500', 
      bgColor: 'bg-blue-50 border-blue-200', 
      textColor: 'text-blue-700',
      shadowColor: 'shadow-blue-500/20'
    },
    common: { 
      color: 'from-gray-400 to-gray-600', 
      bgColor: 'bg-gray-50 border-gray-200', 
      textColor: 'text-gray-700',
      shadowColor: 'shadow-gray-500/20'
    }
  };
  
  const config = rarityConfig[rarity as keyof typeof rarityConfig];
  
  const iconMap = {
    'Trophy': '🏆', 'Target': '🎯', 'Zap': '⚡', 'Star': '⭐', 'Crown': '👑', 'Award': '🏅',
    'Eye': '👁️', 'CheckCircle': '✅', 'Navigation': '🧭', 'TrendingUp': '📈', 'Cog': '⚙️',
    'CloudRain': '🌧️', 'SmileIcon': '😎'
  };
  const icon = iconMap[achievement.badgeIcon as keyof typeof iconMap] || '🏆';
  
  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3 ${
        isUnlocked 
          ? `bg-white ${config.bgColor.replace('bg-', 'border-').replace('-50', '-400')} shadow-lg ${config.shadowColor}` 
          : 'bg-gray-100 border-gray-400 hover:bg-gray-200'
      }`}
      onClick={onClick}
      data-testid={`skill-node-${achievement.id}`}
    >
      {/* Glow effect for unlocked skills */}
      {isUnlocked && (
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-20 group-hover:opacity-40 transition-opacity animate-pulse`} />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 text-2xl sm:text-3xl md:text-4xl transition-all duration-200 ${
        isUnlocked ? 'group-hover:scale-110' : 'grayscale opacity-60'
      }`}>
        {icon}
      </div>
      
      {/* Lock overlay for locked skills */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
          <div className="text-lg opacity-80">🔒</div>
        </div>
      )}
      
      {/* Skill name tooltip on hover */}
      <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
        isUnlocked ? `${config.bgColor} ${config.textColor} border` : 'bg-gray-200 text-gray-600'
      }`}>
        {achievement.name}
      </div>
    </div>
  );
}