import { useState, useRef, useCallback } from "react";
import { Achievement, PlayerAchievement } from "@shared/schema";
import { SkillNode } from "./SkillNode";

interface DraggableSkillTreeProps {
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  onNodeClick: (achievement: Achievement) => void;
}

export function DraggableSkillTree({ achievements, unlockedAchievements, onNodeClick }: DraggableSkillTreeProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Define node positions for constellation layout
  const getNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Foundation tier - top area
    const commonAchievements = achievements.filter(a => a.rarity === 'common');
    commonAchievements.forEach((achievement, index) => {
      const angle = (index / commonAchievements.length) * Math.PI * 2;
      const radius = 200;
      positions[achievement.id] = {
        x: 400 + Math.cos(angle) * radius,
        y: 150 + Math.sin(angle) * radius * 0.5
      };
    });

    // Rare tier - middle area
    const rareAchievements = achievements.filter(a => a.rarity === 'rare');
    rareAchievements.forEach((achievement, index) => {
      const angle = (index / rareAchievements.length) * Math.PI * 2;
      const radius = 280;
      positions[achievement.id] = {
        x: 400 + Math.cos(angle + Math.PI / 4) * radius,
        y: 350 + Math.sin(angle + Math.PI / 4) * radius * 0.6
      };
    });

    // Epic tier - lower area
    const epicAchievements = achievements.filter(a => a.rarity === 'epic');
    epicAchievements.forEach((achievement, index) => {
      const angle = (index / epicAchievements.length) * Math.PI * 2;
      const radius = 220;
      positions[achievement.id] = {
        x: 400 + Math.cos(angle + Math.PI / 2) * radius,
        y: 580 + Math.sin(angle + Math.PI / 2) * radius * 0.4
      };
    });

    // Legendary tier - bottom center
    const legendaryAchievements = achievements.filter(a => a.rarity === 'legendary');
    legendaryAchievements.forEach((achievement, index) => {
      positions[achievement.id] = {
        x: 350 + index * 100,
        y: 750
      };
    });

    return positions;
  };

  const nodePositions = getNodePositions();

  // Connection lines between related achievements
  const getConnections = () => {
    const connections: Array<{ from: string; to: string }> = [];
    
    // Connect achievements based on categories and dependencies
    achievements.forEach(achievement => {
      const relatedAchievements = achievements.filter(other => 
        other.id !== achievement.id && 
        (other.category === achievement.category || 
         (achievement.condition === 'eagle' && other.condition === 'birdie') ||
         (achievement.name.includes('Putting') && other.name.includes('Par')) ||
         (achievement.condition === 'tournament_count' && other.name.includes('Champion')))
      );
      
      relatedAchievements.slice(0, 2).forEach(related => {
        connections.push({ from: achievement.id, to: related.id });
      });
    });

    return connections;
  };

  const connections = getConnections();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newPan = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    
    // Constrain panning
    newPan.x = Math.max(-600, Math.min(200, newPan.x));
    newPan.y = Math.max(-400, Math.min(100, newPan.y));
    
    setPan(newPan);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="relative w-full h-[800px] overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 rounded-2xl border border-slate-700 shadow-2xl">
      {/* Background stars */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '20%', left: '15%' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '40%', left: '80%', animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '70%', left: '25%', animationDelay: '2s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '85%', left: '75%', animationDelay: '3s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '60%', left: '60%', animationDelay: '4s' }}></div>
      </div>

      {/* Navigation hint */}
      <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
        Click and drag to explore the skill constellation
      </div>
      
      {/* Progress indicator */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
        <div className="text-white text-sm font-medium mb-2">Mastery Progress</div>
        <div className="flex gap-1">
          {['common', 'rare', 'epic', 'legendary'].map((rarity) => {
            const rarityAchievements = achievements.filter(a => a.rarity === rarity);
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
                <div className={`w-4 h-4 rounded-full ${colors[rarity as keyof typeof colors]} ${unlockedCount === total ? 'opacity-100 shadow-lg' : 'opacity-30'} transition-all duration-300`} />
                <div className="text-xs text-white/70 mt-1">{unlockedCount}/{total}</div>
              </div>
            );
          })}\n        </div>
      </div>

      {/* Draggable container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '1000px', height: '1000px' }}>
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(148, 163, 184, 0.4)" />
              <stop offset="50%" stopColor="rgba(99, 102, 241, 0.6)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {connections.map(({ from, to }, index) => {
            const fromPos = nodePositions[from];
            const toPos = nodePositions[to];
            if (!fromPos || !toPos) return null;
            
            const isFromUnlocked = unlockedAchievements.has(from);
            const isToUnlocked = unlockedAchievements.has(to);
            const isActive = isFromUnlocked && isToUnlocked;
            
            return (
              <line
                key={`${from}-${to}-${index}`}
                x1={fromPos.x + 50} // Center of node
                y1={fromPos.y + 50}
                x2={toPos.x + 50}
                y2={toPos.y + 50}
                stroke={isActive ? "url(#connectionGradient)" : "rgba(148, 163, 184, 0.2)"}
                strokeWidth={isActive ? "2" : "1"}
                filter={isActive ? "url(#glow)" : "none"}
                className="transition-all duration-500"
              />
            );
          })}\n        </svg>

        {/* Skill nodes */}
        {achievements.map((achievement) => {
          const position = nodePositions[achievement.id];
          if (!position) return null;
          
          return (
            <SkillNode
              key={achievement.id}
              achievement={achievement}
              isUnlocked={unlockedAchievements.has(achievement.id)}
              onClick={() => onNodeClick(achievement)}
              rarity={achievement.rarity || 'common'}
              position={position}
            />
          );
        })}
      </div>
    </div>
  );
}