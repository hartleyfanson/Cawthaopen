import { useState, useRef, useEffect } from "react";
import { Achievement, PlayerAchievement } from "@shared/schema";
import { SkillNode } from "./SkillNode";
import type { SkillTreeCategory } from "@/types/skillTree";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface CategorySkillTreeProps {
  category: SkillTreeCategory;
  playerAchievements: (PlayerAchievement & { achievement: Achievement })[];
  playerId: string;
}

export function CategorySkillTree({ category, playerAchievements, playerId }: CategorySkillTreeProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number, width: number, height: number}>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const unlockedAchievementIds = new Set(playerAchievements.map(pa => pa.achievementId));

  // For scoring progression, organize by threshold values instead of rarity
  const isScoreProgression = category.id === "score-progression";
  
  // Organize achievements by rarity following Creately's hierarchical structure
  const achievementsByRarity = isScoreProgression ? {
    // Score progression ordered by difficulty (higher scores = easier)
    common: category.achievements.filter(a => a.value && a.value >= 100).sort((a, b) => (b.value || 0) - (a.value || 0)),
    rare: category.achievements.filter(a => a.value && a.value >= 80 && a.value < 100).sort((a, b) => (b.value || 0) - (a.value || 0)),
    epic: category.achievements.filter(a => a.value && a.value >= 70 && a.value < 80).sort((a, b) => (b.value || 0) - (a.value || 0)),
    legendary: category.achievements.filter(a => a.value && a.value < 70 || ['eagle', 'hole_in_one', 'albatross'].includes(a.condition)).sort((a, b) => (b.value || 0) - (a.value || 0)),
  } : {
    common: category.achievements.filter(a => a.rarity === 'common'),
    rare: category.achievements.filter(a => a.rarity === 'rare'), 
    epic: category.achievements.filter(a => a.rarity === 'epic'),
    legendary: category.achievements.filter(a => a.rarity === 'legendary'),
  };

  // Find a root achievement (first tournament or tournament debut)
  const rootAchievement = category.achievements.find(a => 
    a.condition === 'first_tournament' || a.name.toLowerCase().includes('debut')
  );

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const getAchievementCriteria = (achievement: Achievement) => {
    const criteriaMap: Record<string, string> = {
      'first_tournament': 'Join and complete your first tournament',
      'hole_in_one': 'Score a hole-in-one on any hole',
      'eagle': 'Score an eagle (2 strokes under par) on any hole',
      'birdie': 'Score a birdie (1 stroke under par) on any hole',
      'under_par_round': 'Complete a round with a score under par',
      'tournament_win': 'Win a tournament by finishing in 1st place',
      'score_under_threshold': achievement.value ? `Score under ${achievement.value} strokes in a round` : 'Achieve a low score',
      'fairways_in_regulation': achievement.value ? `Hit ${achievement.value} or more fairways in regulation` : 'Hit fairways consistently',
      'two_putt_master': achievement.value ? `Two-putt or better on ${achievement.value}+ holes in a round` : 'Master two-putting',
      'one_putt_master': achievement.value ? `One-putt ${achievement.value}+ holes in a round` : 'Achieve multiple one-putts',
      'consistent_performance': achievement.value ? `Score bogey or better on ${achievement.value}+ holes` : 'Play consistently',
      'consecutive_double_bogeys': achievement.value ? `Score ${achievement.value}+ consecutive double bogeys` : 'Struggle with consecutive bad holes',
      'birdie_and_triple_bogey': 'Score both a birdie and triple bogey in the same round',
      'extreme_score': 'Score more than triple par on any hole',
      'multiple_birdies_tournament': achievement.value ? `Score ${achievement.value}+ birdies in a tournament` : 'Score multiple birdies in a tournament',
      'score_69': 'Score exactly 69 strokes in a complete round',
      'no_triple_bogey_streak': 'Complete a round without any triple bogeys',
      'low_putts_round': achievement.value ? `Complete a round with ${achievement.value} or fewer putts` : 'Achieve exceptionally low putts',
      'fairway_streak': achievement.value ? `Hit ${achievement.value} consecutive fairways` : 'Hit consecutive fairways',
      'comeback_round': achievement.value ? `Improve by ${achievement.value}+ strokes from your worst 9 holes` : 'Make a strong comeback',
      'par_streak': achievement.value ? `Score par on ${achievement.value}+ holes in a round` : 'Score multiple pars',
      'tournament_count': achievement.value ? `Complete ${achievement.value} tournaments` : 'Play in multiple tournaments',
      'fast_round': achievement.value ? `Complete a round in ${achievement.value} minutes or less` : 'Play a quick round',
      'weather_round': 'Complete a round in adverse weather conditions',
    };
    
    return criteriaMap[achievement.condition] || achievement.description;
  };

  // Update node positions for SVG connections
  useEffect(() => {
    if (containerRef.current) {
      const updatePositions = () => {
        const positions: Record<string, {x: number, y: number, width: number, height: number}> = {};
        const nodes = containerRef.current?.querySelectorAll('[data-testid^="achievement-"]');
        
        nodes?.forEach(node => {
          const rect = node.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const achievementId = node.getAttribute('data-testid')?.replace('achievement-', '') || '';
            positions[achievementId] = {
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height / 2,
              width: rect.width,
              height: rect.height
            };
          }
        });
        setNodePositions(positions);
      };

      // Update positions initially and on resize
      setTimeout(updatePositions, 100);
      window.addEventListener('resize', updatePositions);
      return () => window.removeEventListener('resize', updatePositions);
    }
  }, [category.achievements]);

  // Generate SVG connections based on category type
  const generateSVGConnections = () => {
    if (Object.keys(nodePositions).length === 0) return null;

    const connections: JSX.Element[] = [];
    const strokeWidth = 6;

    // Map category colors to stroke colors
    const categoryColors: Record<string, string> = {
      'score-progression': '#ca8a04', // yellow-600
      'consistency': '#2563eb', // blue-600
      'putting-mastery': '#16a34a', // green-600
      'accuracy': '#9333ea', // purple-600 (course-strategy)
      'course-strategy': '#9333ea', // purple-600
      'tournament-journey': '#dc2626', // red-600
      'special-skills': '#4f46e5', // indigo-600
    };

    const strokeColor = categoryColors[category.id] || '#000000';

    // Helper function to create paths that avoid text headers
    const createSafeConnection = (startPos: {x: number, y: number}, endPos: {x: number, y: number}, avoidCenter = true) => {
      if (!avoidCenter) {
        // Simple direct connection for cases where we don't need to avoid text
        return `M ${startPos.x} ${startPos.y} Q ${(startPos.x + endPos.x) / 2} ${(startPos.y + endPos.y) / 2 - 20} ${endPos.x} ${endPos.y}`;
      }

      // For connections that might cross text, route them around the sides
      const midX = (startPos.x + endPos.x) / 2;
      const isLeftToRight = startPos.x < endPos.x;
      const routeOffset = isLeftToRight ? -50 : 50;
      
      if (startPos.y < endPos.y) {
        // Going down - route under the text area
        return `M ${startPos.x} ${startPos.y} Q ${startPos.x} ${startPos.y + 40} ${midX + routeOffset} ${(startPos.y + endPos.y) / 2 + 30} Q ${endPos.x} ${endPos.y - 40} ${endPos.x} ${endPos.y}`;
      } else {
        // Going up or sideways - route around the sides
        return `M ${startPos.x} ${startPos.y} Q ${midX + routeOffset} ${startPos.y - 30} ${endPos.x} ${endPos.y}`;
      }
    };

    switch (category.id) {
      case 'score-progression':
        // Score Progression: Horizontal flow with branching
        const commonAchievements = achievementsByRarity.common;
        const rareAchievements = achievementsByRarity.rare;
        const epicAchievements = achievementsByRarity.epic;

        // Connect common achievements horizontally
        for (let i = 0; i < commonAchievements.length - 1; i++) {
          const current = nodePositions[commonAchievements[i].id];
          const next = nodePositions[commonAchievements[i + 1].id];
          if (current && next) {
            connections.push(
              <path
                key={`common-${i}`}
                d={createSafeConnection(current, next, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Connect last common to first rare (flowing down)
        if (commonAchievements.length > 0 && rareAchievements.length > 0) {
          const lastCommon = nodePositions[commonAchievements[commonAchievements.length - 1].id];
          const firstRare = nodePositions[rareAchievements[0].id];
          if (lastCommon && firstRare) {
            connections.push(
              <path
                key="common-to-rare"
                d={createSafeConnection(lastCommon, firstRare, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Connect rare achievements horizontally
        for (let i = 0; i < rareAchievements.length - 1; i++) {
          const current = nodePositions[rareAchievements[i].id];
          const next = nodePositions[rareAchievements[i + 1].id];
          if (current && next) {
            connections.push(
              <path
                key={`rare-${i}`}
                d={createSafeConnection(current, next, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Branch down to epic (Breaking Par)
        if (rareAchievements.length > 0 && epicAchievements.length > 0) {
          const firstRare = nodePositions[rareAchievements[0].id];
          const firstEpic = nodePositions[epicAchievements[0].id];
          if (firstRare && firstEpic) {
            connections.push(
              <path
                key="rare-to-epic-branch"
                d={createSafeConnection(firstRare, firstEpic, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }
        break;

      case 'consistency':
        // Consistency & Control: Complex crossing pattern
        const consistencyCommon = achievementsByRarity.common;
        const consistencyRare = achievementsByRarity.rare;
        const consistencyEpic = achievementsByRarity.epic;

        // Connect foundation skills with crossing pattern
        if (consistencyCommon.length >= 2) {
          const pos1 = nodePositions[consistencyCommon[0].id];
          const pos2 = nodePositions[consistencyCommon[1].id];
          if (pos1 && pos2) {
            // Curved crossing connection
            connections.push(
              <path
                key="foundation-cross"
                d={createSafeConnection(pos1, pos2, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Connect to rare achievements with multiple paths
        consistencyCommon.forEach((commonAch, i) => {
          consistencyRare.forEach((rareAch, j) => {
            const commonPos = nodePositions[commonAch.id];
            const rarePos = nodePositions[rareAch.id];
            if (commonPos && rarePos) {
              connections.push(
                <path
                  key={`common-${i}-rare-${j}`}
                  d={createSafeConnection(commonPos, rarePos, true)}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            }
          });
        });

        // Connect rare to epic with diagonal lines
        consistencyRare.forEach((rareAch, i) => {
          consistencyEpic.forEach((epicAch, j) => {
            const rarePos = nodePositions[rareAch.id];
            const epicPos = nodePositions[epicAch.id];
            if (rarePos && epicPos) {
              connections.push(
                <path
                  key={`rare-${i}-epic-${j}`}
                  d={createSafeConnection(rarePos, epicPos, true)}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            }
          });
        });
        break;

      case 'putting-mastery':
        // Putting Mastery: Simple horizontal connection
        const puttingAchievements = [...achievementsByRarity.common, ...achievementsByRarity.rare, ...achievementsByRarity.epic, ...achievementsByRarity.legendary];
        if (puttingAchievements.length >= 2) {
          const pos1 = nodePositions[puttingAchievements[0].id];
          const pos2 = nodePositions[puttingAchievements[1].id];
          if (pos1 && pos2) {
            connections.push(
              <path
                key="putting-connection"
                d={createSafeConnection(pos1, pos2, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }
        break;

      case 'tournament-journey':
        // Tournament Journey: Complex hierarchical tree
        // Connect foundation to advanced level
        const tourneyCommon = achievementsByRarity.common;
        const tourneyRare = achievementsByRarity.rare;
        const tourneyEpic = achievementsByRarity.epic;
        const tourneyLegendary = achievementsByRarity.legendary;

        // Root to foundation level
        if (rootAchievement && tourneyCommon.length > 0) {
          const rootPos = nodePositions[rootAchievement.id];
          const middleCommon = tourneyCommon[Math.floor(tourneyCommon.length / 2)];
          const middlePos = nodePositions[middleCommon.id];
          if (rootPos && middlePos) {
            connections.push(
              <path
                key="root-to-foundation"
                d={createSafeConnection(rootPos, middlePos, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Foundation level horizontal connections
        for (let i = 0; i < tourneyCommon.length - 1; i++) {
          const current = nodePositions[tourneyCommon[i].id];
          const next = nodePositions[tourneyCommon[i + 1].id];
          if (current && next) {
            connections.push(
              <path
                key={`foundation-${i}`}
                d={createSafeConnection(current, next, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Branch down to advanced mastery
        if (tourneyCommon.length > 0 && tourneyRare.length > 0) {
          const leftCommon = nodePositions[tourneyCommon[0].id];
          const rightCommon = nodePositions[tourneyCommon[tourneyCommon.length - 1].id];
          const leftRare = nodePositions[tourneyRare[0].id];
          const rightRare = nodePositions[tourneyRare[tourneyRare.length - 1].id];

          if (leftCommon && leftRare) {
            connections.push(
              <path
                key="left-branch"
                d={createSafeConnection(leftCommon, leftRare, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }

          if (rightCommon && rightRare) {
            connections.push(
              <path
                key="right-branch"
                d={createSafeConnection(rightCommon, rightRare, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Advanced level horizontal connection
        if (tourneyRare.length >= 2) {
          const pos1 = nodePositions[tourneyRare[0].id];
          const pos2 = nodePositions[tourneyRare[1].id];
          if (pos1 && pos2) {
            connections.push(
              <path
                key="advanced-connection"
                d={createSafeConnection(pos1, pos2, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Branch to legendary mastery
        if (tourneyRare.length > 0 && tourneyLegendary.length > 0) {
          const middleRare = tourneyRare[Math.floor(tourneyRare.length / 2)];
          const rarePos = nodePositions[middleRare.id];
          const legendaryPos = nodePositions[tourneyLegendary[0].id];
          if (rarePos && legendaryPos) {
            connections.push(
              <path
                key="legendary-branch"
                d={createSafeConnection(rarePos, legendaryPos, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }
        break;

      case 'course-strategy':
        // Special Skills: T-shaped branching structure
        const specialCommon = achievementsByRarity.common;
        const specialRare = achievementsByRarity.rare;
        const specialLegendary = achievementsByRarity.legendary;

        // Foundation skill branches to advanced skills (T-shape)
        if (specialCommon.length > 0 && specialRare.length >= 2) {
          const foundation = nodePositions[specialCommon[0].id];
          const leftAdvanced = nodePositions[specialRare[0].id];
          const rightAdvanced = nodePositions[specialRare[1].id];

          if (foundation && leftAdvanced && rightAdvanced) {
            // T-connection: foundation to both advanced skills
            connections.push(
              <path
                key="t-horizontal"
                d={createSafeConnection(leftAdvanced, rightAdvanced, false)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
            
            connections.push(
              <path
                key="t-vertical"
                d={createSafeConnection(foundation, {x: (leftAdvanced.x + rightAdvanced.x) / 2, y: leftAdvanced.y}, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }

        // Branch to legendary skills
        if (specialRare.length > 0 && specialLegendary.length >= 2) {
          const leftRare = nodePositions[specialRare[0].id];
          const rightRare = nodePositions[specialRare[1].id];
          const leftLegendary = nodePositions[specialLegendary[0].id];
          const rightLegendary = nodePositions[specialLegendary[1].id];

          if (leftRare && leftLegendary) {
            connections.push(
              <path
                key="left-legendary-branch"
                d={createSafeConnection(leftRare, leftLegendary, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }

          if (rightRare && rightLegendary) {
            connections.push(
              <path
                key="right-legendary-branch"
                d={createSafeConnection(rightRare, rightLegendary, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }
        break;

      default:
        // Default simple linear connections for other categories
        const allAchievements = [...achievementsByRarity.common, ...achievementsByRarity.rare, ...achievementsByRarity.epic, ...achievementsByRarity.legendary];
        for (let i = 0; i < allAchievements.length - 1; i++) {
          const current = nodePositions[allAchievements[i].id];
          const next = nodePositions[allAchievements[i + 1].id];
          if (current && next) {
            connections.push(
              <path
                key={`default-${i}`}
                d={createSafeConnection(current, next, true)}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            );
          }
        }
        break;
    }

    return connections;
  };

  if (category.achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No achievements available in this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Achievement Details Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedAchievement(null)}
        >
          <Card 
            className="w-full max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedAchievement.rarity === 'legendary' ? 'bg-violet-100 text-violet-700' :
                    selectedAchievement.rarity === 'epic' ? 'bg-amber-100 text-amber-700' :
                    selectedAchievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedAchievement.name.toLowerCase().includes('nice') ? '😄' :
                     selectedAchievement.name.toLowerCase().includes('eagle') ? '🦅' :
                     selectedAchievement.name.toLowerCase().includes('tournament') ? '🏆' :
                     selectedAchievement.name.toLowerCase().includes('putt') ? '🏌️' : '⭐'}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold leading-tight">{selectedAchievement.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {selectedAchievement.rarity} • {selectedAchievement.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAchievement(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                <p className="text-sm leading-relaxed">{selectedAchievement.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">How to Complete</h4>
                <p className="text-sm leading-relaxed">{getAchievementCriteria(selectedAchievement)}</p>
              </div>
              
              <div className={`p-3 rounded-lg border-2 ${
                unlockedAchievementIds.has(selectedAchievement.id) 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200' 
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${
                    unlockedAchievementIds.has(selectedAchievement.id) 
                      ? 'text-emerald-700' 
                      : 'text-slate-600'
                  }`}>
                    Status: {unlockedAchievementIds.has(selectedAchievement.id) ? 'Completed ✓' : 'In Progress'}
                  </span>
                  <div className={`h-3 w-3 rounded-full ${
                    unlockedAchievementIds.has(selectedAchievement.id) 
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                      : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>
              
              {selectedAchievement.points && (
                <div className="text-center pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">
                    Worth {selectedAchievement.points} points
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Creately-inspired hierarchical skill tree layout */}
      <div className="relative" ref={containerRef}>
        {/* SVG Connections Overlay */}
        {Object.keys(nodePositions).length > 0 && (
          <svg 
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
          >
            {generateSVGConnections()}
          </svg>
        )}
        {/* Root Achievement (if exists in this category) */}
        {rootAchievement && (
          <div className="flex justify-center mb-12">
            <div className="relative z-10">
              <SkillNode
                achievement={rootAchievement}
                isUnlocked={unlockedAchievementIds.has(rootAchievement.id)}
                onClick={() => handleAchievementClick(rootAchievement)}
                rarity={rootAchievement.rarity || 'common'}
                position={{x: 0, y: 0}}
              />
            </div>
          </div>
        )}

        {/* Foundation Level - Common Achievements */}
        {achievementsByRarity.common.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 text-center">
              {isScoreProgression ? "Breaking Barriers" : "Foundation Skills"}
            </h3>
            <div className={`grid gap-6 justify-items-center ${
              achievementsByRarity.common.length === 1 ? 'grid-cols-1' :
              achievementsByRarity.common.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {achievementsByRarity.common.map((achievement, index) => (
                <div key={achievement.id} className="relative z-10" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Level - Rare Achievements */}
        {achievementsByRarity.rare.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 text-center">
              {isScoreProgression ? "Solid Scores" : "Advanced Mastery"}
            </h3>
            <div className={`grid gap-8 justify-items-center ${
              achievementsByRarity.rare.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.rare.map((achievement, index) => (
                <div key={achievement.id} className="relative z-10" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expert Level - Epic Achievements */}
        {achievementsByRarity.epic.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 text-center">
              {isScoreProgression ? "Breaking Par" : "Expert Excellence"}
            </h3>
            <div className={`grid gap-10 justify-items-center ${
              achievementsByRarity.epic.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.epic.map((achievement, index) => (
                <div key={achievement.id} className="relative z-10" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Level - Legendary Achievements */}
        {achievementsByRarity.legendary.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-violet-700 dark:text-violet-400 text-center">
              {isScoreProgression ? "Elite Performance" : "Legendary Mastery"}
            </h3>
            <div className={`grid gap-12 justify-items-center ${
              achievementsByRarity.legendary.length === 1 ? 'grid-cols-1' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {achievementsByRarity.legendary.map((achievement) => (
                <div key={achievement.id} className="relative z-10" data-testid={`achievement-${achievement.id}`}>
                  <SkillNode
                    achievement={achievement}
                    isUnlocked={unlockedAchievementIds.has(achievement.id)}
                    onClick={() => handleAchievementClick(achievement)}
                    rarity={achievement.rarity || 'common'}
                    position={{x: 0, y: 0}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}