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
      borderStyle: 'border-8 border-double border-violet-400 shadow-2xl shadow-violet-500/30',
      bgGradient: 'bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100',
      glowColor: 'shadow-violet-400/40',
      textColor: 'text-violet-800'
    },
    epic: { 
      borderStyle: 'border-6 border-solid border-amber-400 shadow-xl shadow-amber-500/40',
      bgGradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-gold-100',
      glowColor: 'shadow-amber-400/50',
      textColor: 'text-amber-800'
    },
    rare: { 
      borderStyle: 'border-4 border-solid border-emerald-400 shadow-lg shadow-emerald-500/25',
      bgGradient: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
      glowColor: 'shadow-emerald-400/30',
      textColor: 'text-emerald-800'
    },
    common: { 
      borderStyle: 'border-2 border-solid border-slate-300 shadow-md shadow-slate-400/20',
      bgGradient: 'bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50',
      glowColor: 'shadow-slate-400/20',
      textColor: 'text-slate-700'
    }
  };
  
  const config = rarityConfig[rarity as keyof typeof rarityConfig];
  
  // More specific and relevant icons for golf achievements
  const getAchievementIcon = (achievement: Achievement): string => {
    const name = achievement.name.toLowerCase();
    const condition = achievement.condition;
    
    if (name.includes('nice') || condition === 'score_69') return '😎';
    if (name.includes('eagle') || condition === 'eagle') return '🦅';
    if (name.includes('birdie') || condition === 'birdie') return '🐦';
    if (name.includes('hole') && name.includes('one')) return '🕳️';
    if (name.includes('putting') || name.includes('putt')) return '⛳';
    if (name.includes('fairway') || name.includes('driving')) return '🏌️';
    if (name.includes('weather') || name.includes('rain')) return '🌧️';
    if (name.includes('speed') || name.includes('fast')) return '⚡';
    if (name.includes('consistency') || name.includes('streak')) return '🎯';
    if (name.includes('comeback') || name.includes('recovery')) return '↗️';
    if (name.includes('champion') || name.includes('winner')) return '👑';
    if (name.includes('first') || name.includes('rookie')) return '🌱';
    if (name.includes('master') || name.includes('expert')) return '🏆';
    if (name.includes('precision') || name.includes('accurate')) return '📐';
    return '⭐'; // Default fallback
  };
  
  const icon = getAchievementIcon(achievement);
  
  return (
    <button
      className={`group relative flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-lg cursor-pointer transition-all duration-500 hover:scale-110 hover:rotate-2 focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${
        isUnlocked 
          ? `${config.bgGradient} ${config.borderStyle} ${config.glowColor}` 
          : 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400 opacity-70 hover:opacity-85'
      }`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${achievement.name} achievement - ${isUnlocked ? 'Unlocked' : 'Locked'}: ${achievement.description}`}
      role="button"
      tabIndex={0}
      data-testid={`skill-node-${achievement.id}`}
    >
      {/* Enhanced glow effect for unlocked skills */}
      {isUnlocked && (
        <>
          <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${rarity === 'epic' ? 'from-amber-300/30 to-gold-400/30' : config.bgGradient.replace('from-', 'from-').replace('to-', 'to-')} opacity-30 group-hover:opacity-50 transition-all duration-300 animate-pulse`} />
          <div className={`absolute -inset-1 rounded-lg blur-sm ${config.glowColor} group-hover:blur-md transition-all duration-300`} />
        </>
      )}
      
      {/* Icon with enhanced styling */}
      <div className={`relative z-10 text-3xl sm:text-4xl md:text-5xl transition-all duration-300 ${
        isUnlocked 
          ? `group-hover:scale-125 filter ${rarity === 'epic' ? 'drop-shadow-lg' : 'drop-shadow-md'}` 
          : 'grayscale opacity-50 group-hover:opacity-70'
      }`}>
        {icon}
      </div>
      
      {/* Lock overlay for locked skills with better visibility */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg backdrop-blur-sm">
          <div className="text-xl opacity-80 filter drop-shadow-sm">🔒</div>
        </div>
      )}
      
      {/* Enhanced skill name tooltip */}
      <div className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 z-20 ${
        isUnlocked 
          ? `${config.bgGradient} ${config.textColor} border-2 ${config.borderStyle.split(' ')[3]} shadow-lg` 
          : 'bg-gray-700 text-gray-100 border border-gray-600'
      }`}>
        {achievement.name}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-current"></div>
      </div>
    </button>
  );
}