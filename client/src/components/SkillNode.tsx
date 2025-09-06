import { Achievement } from "@shared/schema";
import { 
  Trophy, Target, Zap, Star, Crown, Award, Eye, CheckCircle, 
  Navigation, TrendingUp, Settings, CloudRain, Smile, Lock,
  Flag, Crosshair, Timer
} from "lucide-react";

interface SkillNodeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  onClick: () => void;
  rarity: string;
  position: { x: number; y: number };
}

export function SkillNode({ achievement, isUnlocked, onClick, rarity, position }: SkillNodeProps) {
  const rarityConfig = {
    legendary: {
      borderClass: 'skill-border-legendary',
      bgGradient: 'bg-gradient-to-br from-violet-900/10 via-purple-800/10 to-indigo-900/10',
      glowColor: 'shadow-violet-500/50',
      textColor: 'text-violet-900',
      size: 'w-32 h-32'
    },
    epic: {
      borderClass: 'skill-border-epic', 
      bgGradient: 'bg-gradient-to-br from-amber-800/10 via-yellow-700/10 to-orange-800/10',
      glowColor: 'shadow-amber-500/60',
      textColor: 'text-amber-900',
      size: 'w-28 h-28'
    },
    rare: {
      borderClass: 'skill-border-rare',
      bgGradient: 'bg-gradient-to-br from-emerald-800/10 via-green-700/10 to-teal-800/10',
      glowColor: 'shadow-emerald-500/40',
      textColor: 'text-emerald-900',
      size: 'w-24 h-24'
    },
    common: {
      borderClass: 'skill-border-common',
      bgGradient: 'bg-gradient-to-br from-slate-700/10 via-gray-600/10 to-stone-700/10',
      glowColor: 'shadow-slate-500/30',
      textColor: 'text-slate-800',
      size: 'w-20 h-20'
    }
  };
  
  const config = rarityConfig[rarity as keyof typeof rarityConfig];
  
  // Professional golf achievement icons using Lucide React
  const getAchievementIcon = (achievement: Achievement) => {
    const name = achievement.name.toLowerCase();
    const condition = achievement.condition;
    
    if (name.includes('nice') || condition === 'score_69') return <Smile className="w-full h-full" />;
    if (name.includes('eagle') || condition === 'eagle') return <Eye className="w-full h-full" />;
    if (name.includes('birdie') || condition === 'birdie') return <Target className="w-full h-full" />;
    if (name.includes('hole') && name.includes('one')) return <Crosshair className="w-full h-full" />;
    if (name.includes('putting') || name.includes('putt')) return <Flag className="w-full h-full" />;
    if (name.includes('fairway') || name.includes('driving')) return <Navigation className="w-full h-full" />;
    if (name.includes('weather') || name.includes('rain')) return <CloudRain className="w-full h-full" />;
    if (name.includes('speed') || name.includes('fast')) return <Timer className="w-full h-full" />;
    if (name.includes('consistency') || name.includes('streak')) return <Target className="w-full h-full" />;
    if (name.includes('comeback') || name.includes('recovery')) return <TrendingUp className="w-full h-full" />;
    if (name.includes('champion') || name.includes('winner')) return <Crown className="w-full h-full" />;
    if (name.includes('first') || name.includes('rookie')) return <Star className="w-full h-full" />;
    if (name.includes('master') || name.includes('expert')) return <Trophy className="w-full h-full" />;
    if (name.includes('precision') || name.includes('accurate')) return <Crosshair className="w-full h-full" />;
    if (name.includes('grinder') || name.includes('tournament')) return <Settings className="w-full h-full" />;
    if (name.includes('par')) return <Award className="w-full h-full" />;
    return <Star className="w-full h-full" />; // Default fallback
  };
  
  const IconComponent = getAchievementIcon(achievement);
  
  return (
    <button
      className={`group relative flex flex-col items-center justify-center ${config.size} rounded-xl cursor-pointer transition-all duration-700 hover:scale-110 hover:rotate-1 focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${config.borderClass} ${config.bgGradient} backdrop-blur-sm`}
      style={{
        position: 'relative',
        filter: isUnlocked ? 'none' : 'grayscale(0.8) opacity(0.7)',
      }}
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
      {/* Particle effect for unlocked skills */}
      {isUnlocked && (
        <>
          <div className={`absolute inset-0 rounded-xl ${config.glowColor} group-hover:shadow-2xl transition-all duration-500`} />
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${rarity === 'epic' ? 'from-amber-300/20 to-gold-400/20' : config.bgGradient.replace('/10', '/20')} opacity-20 group-hover:opacity-40 transition-all duration-300 animate-pulse`} />
        </>
      )}
      
      {/* Icon container */}
      <div className={`relative z-10 p-3 transition-all duration-500 ${config.textColor} ${
        isUnlocked 
          ? `group-hover:scale-125 filter drop-shadow-lg` 
          : 'opacity-50 group-hover:opacity-70'
      }`}>
        {IconComponent}
      </div>
      
      {/* Lock overlay for locked skills */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm border-2 border-dashed border-gray-400/50">
          <Lock className="w-6 h-6 text-white opacity-90 drop-shadow-lg" />
        </div>
      )}
      
      {/* Enhanced skill name tooltip */}
      <div className={`absolute -bottom-14 left-1/2 transform -translate-x-1/2 px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-300 z-30 backdrop-blur-md ${
        isUnlocked 
          ? `${config.bgGradient} ${config.textColor} border-2 ${config.borderClass.includes('legendary') ? 'border-violet-400' : config.borderClass.includes('epic') ? 'border-amber-400' : config.borderClass.includes('rare') ? 'border-emerald-400' : 'border-slate-400'} shadow-xl` 
          : 'bg-gray-800/90 text-gray-200 border border-gray-500 shadow-lg'
      }`}>
        {achievement.name}
        {!isUnlocked && (
          <div className="text-xs opacity-75 mt-1">Click to see how to unlock</div>
        )}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-current"></div>
      </div>
    </button>
  );
}