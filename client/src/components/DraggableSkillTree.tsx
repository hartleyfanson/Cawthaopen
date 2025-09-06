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

  // Define node positions for top-down tree layout
  const getNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Find the "join tournament" or tournament debut achievement as root
    const rootAchievement = achievements.find(a => 
      a.name.toLowerCase().includes('tournament') || 
      a.condition === 'tournament_count' ||
      a.category === 'tournament' ||
      a.name.toLowerCase().includes('debut')
    ) || achievements[0];
    
    // Root node - at the top center
    if (rootAchievement) {
      positions[rootAchievement.id] = { x: 500, y: 80 };
    }
    
    // Common achievements (foundation) - second tier, spread horizontally
    const commonAchievements = achievements.filter(a => a.rarity === 'common' && a.id !== rootAchievement?.id);
    const commonSpacing = 180;
    const commonStartX = 500 - (commonAchievements.length - 1) * commonSpacing / 2;
    commonAchievements.forEach((achievement, index) => {
      positions[achievement.id] = {
        x: commonStartX + index * commonSpacing,
        y: 220
      };
    });

    // Rare achievements - third tier, more spread out
    const rareAchievements = achievements.filter(a => a.rarity === 'rare');
    const rareSpacing = 160;
    const rareStartX = 500 - (rareAchievements.length - 1) * rareSpacing / 2;
    rareAchievements.forEach((achievement, index) => {
      positions[achievement.id] = {
        x: rareStartX + index * rareSpacing,
        y: 380
      };
    });

    // Epic achievements - fourth tier, wider spread
    const epicAchievements = achievements.filter(a => a.rarity === 'epic');
    const epicSpacing = 200;
    const epicStartX = 500 - (epicAchievements.length - 1) * epicSpacing / 2;
    epicAchievements.forEach((achievement, index) => {
      positions[achievement.id] = {
        x: epicStartX + index * epicSpacing,
        y: 560
      };
    });

    // Legendary achievements - bottom tier, widest spread
    const legendaryAchievements = achievements.filter(a => a.rarity === 'legendary');
    const legendarySpacing = 250;
    const legendaryStartX = 500 - (legendaryAchievements.length - 1) * legendarySpacing / 2;
    legendaryAchievements.forEach((achievement, index) => {
      positions[achievement.id] = {
        x: legendaryStartX + index * legendarySpacing,
        y: 740
      };
    });

    return positions;
  };

  const nodePositions = getNodePositions();

  // Connection lines creating top-down tree structure
  const getConnections = () => {
    const connections: Array<{ from: string; to: string }> = [];
    
    const rootAchievement = achievements.find(a => 
      a.name.toLowerCase().includes('tournament') || 
      a.condition === 'tournament_count' ||
      a.category === 'tournament' ||
      a.name.toLowerCase().includes('debut')
    ) || achievements[0];
    
    if (!rootAchievement) return connections;
    
    // Connect root to all common achievements (direct branches from top)
    const commonAchievements = achievements.filter(a => a.rarity === 'common' && a.id !== rootAchievement.id);
    commonAchievements.forEach(achievement => {
      connections.push({ from: rootAchievement.id, to: achievement.id });
    });
    
    // Connect each common achievement to related rare achievements
    const rareAchievements = achievements.filter(a => a.rarity === 'rare');
    if (rareAchievements.length > 0 && commonAchievements.length > 0) {
      rareAchievements.forEach((rareAchievement, index) => {
        // Distribute rare achievements among common achievements
        const parentIndex = index % commonAchievements.length;
        const parentCommon = commonAchievements[parentIndex];
        connections.push({ from: parentCommon.id, to: rareAchievement.id });
      });
    }
    
    // Connect rare achievements to epic achievements
    const epicAchievements = achievements.filter(a => a.rarity === 'epic');
    if (epicAchievements.length > 0 && rareAchievements.length > 0) {
      epicAchievements.forEach((epicAchievement, index) => {
        // Distribute epic achievements among rare achievements
        const parentIndex = index % rareAchievements.length;
        const parentRare = rareAchievements[parentIndex];
        connections.push({ from: parentRare.id, to: epicAchievement.id });
      });
    }
    
    // Connect epic achievements to legendary achievements
    const legendaryAchievements = achievements.filter(a => a.rarity === 'legendary');
    if (legendaryAchievements.length > 0 && epicAchievements.length > 0) {
      legendaryAchievements.forEach((legendaryAchievement, index) => {
        // Distribute legendary achievements among epic achievements
        const parentIndex = index % epicAchievements.length;
        const parentEpic = epicAchievements[parentIndex];
        connections.push({ from: parentEpic.id, to: legendaryAchievement.id });
      });
    }

    return connections;
  };

  const connections = getConnections();

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const pos = getEventPosition(e);
    setDragStart({ x: pos.x - pan.x, y: pos.y - pan.y });
  }, [pan]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const pos = getEventPosition(e);
    const newPan = {
      x: pos.x - dragStart.x,
      y: pos.y - dragStart.y
    };
    
    // Constrain panning for top-down layout
    newPan.x = Math.max(-600, Math.min(400, newPan.x));
    newPan.y = Math.max(-500, Math.min(50, newPan.y));
    
    setPan(newPan);
  }, [isDragging, dragStart]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="relative w-full h-[900px] overflow-hidden bg-gradient-to-b from-green-50 via-emerald-100 to-green-200 rounded-2xl border border-green-300 shadow-2xl">
      {/* Golf course pattern background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.3) 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`,
          backgroundSize: '50px 50px, 30px 30px'
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-200/30 to-emerald-300/20"></div>
      </div>

      {/* Navigation hint */}
      <div className="absolute top-4 left-4 bg-green-800/90 text-green-50 px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
        Click and drag to explore the achievement tree
      </div>
      
      {/* Progress indicator */}
      <div className="absolute top-4 right-4 bg-green-800/90 backdrop-blur-sm rounded-lg p-3">
        <div className="text-green-50 text-sm font-medium mb-2">Mastery Progress</div>
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
                <div className="text-xs text-green-100/70 mt-1">{unlockedCount}/{total}</div>
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
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '1200px', height: '1200px' }}>
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.6)" />
              <stop offset="50%" stopColor="rgba(16, 185, 129, 0.8)" />
              <stop offset="100%" stopColor="rgba(5, 150, 105, 0.6)" />
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
                stroke={isActive ? "url(#connectionGradient)" : "rgba(34, 197, 94, 0.3)"}
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