import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Trophy, Award, Target, TrendingUp, Calendar, BarChart3, Star } from "lucide-react";
import type { Achievement, PlayerAchievement, PlayerStats, User } from "@shared/schema";

interface PlayerAchievementWithDetails extends PlayerAchievement {
  achievement: Achievement;
}

function PlayerProfile() {
  const { playerId } = useParams();
  const searchParams = useSearch();
  const [activeTab, setActiveTab] = useState("overview");

  // Check for tab parameter in URL and set active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'achievements', 'stats'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch player data
  const { data: player, isLoading: playerLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"], // For now, showing current user
  });

  // Fetch achievements data
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: playerAchievements = [], isLoading: playerAchievementsLoading } = useQuery<PlayerAchievementWithDetails[]>({
    queryKey: ["/api/players", playerId || player?.id, "achievements"],
    enabled: !!(playerId || player?.id),
  });

  const { data: playerStats, isLoading: statsLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId || player?.id, "stats"],
    enabled: !!(playerId || player?.id),
  });

  const { data: detailedStats, isLoading: detailedStatsLoading } = useQuery<any>({
    queryKey: ["/api/users", playerId || player?.id, "stats"],
    enabled: !!(playerId || player?.id),
  });

  if (playerLoading || achievementsLoading || playerAchievementsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-secondary animate-bounce mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Player not found</p>
        </div>
      </div>
    );
  }

  const unlockedAchievements = new Set(playerAchievements.map(pa => pa.achievementId));
  const totalPoints = playerStats?.achievementPoints || 0;
  const totalAchievements = playerStats?.totalAchievements || 0;
  const achievementProgress = achievements.length > 0 ? (totalAchievements / achievements.length) * 100 : 0;

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'P';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Player Header */}
        <Card className="mb-8 border-green-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-secondary">
                <AvatarImage src={player.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-bold">
                  {getInitials(player.firstName || undefined, player.lastName || undefined)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {player.firstName && player.lastName 
                    ? `${player.firstName} ${player.lastName}`
                    : player.email?.split('@')[0] || 'Player'
                  }
                </h1>
                
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {totalAchievements} Achievements
                  </Badge>
                  {player.handicap && (
                    <Badge variant="outline">
                      Handicap: {player.handicap}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Achievement Progress</span>
                    <span>{totalAchievements}/{achievements.length}</span>
                  </div>
                  <Progress value={achievementProgress} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Rounds</p>
                      <p className="text-2xl font-bold">{detailedStats?.totalRounds || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">{detailedStats?.averageScore || '--'}</p>
                    </div>
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Best Round</p>
                      <p className="text-2xl font-bold">{detailedStats?.bestRound?.score || '--'}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Birdies</p>
                      <p className="text-2xl font-bold">{detailedStats?.totalBirdies || 0}</p>
                    </div>
                    <Award className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {playerAchievements.length > 0 ? (
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    {playerAchievements.slice(0, 6).map((pa) => (
                      <AchievementBadge
                        key={pa.id}
                        achievement={pa.achievement}
                        isUnlocked={true}
                        unlockedAt={pa.unlockedAt}
                        size="sm"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No achievements unlocked yet. Start playing to earn your first badges!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                    {categoryAchievements.map((achievement) => (
                      <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={unlockedAchievements.has(achievement.id)}
                        unlockedAt={playerAchievements.find(pa => pa.achievementId === achievement.id)?.unlockedAt}
                        size="md"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            {detailedStatsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Best Round */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                        Best Round
                      </CardTitle>
                      <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="stat-best-round">
                        {detailedStats?.bestRound?.score || "--"}
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {detailedStats?.bestRound?.courseName || "No rounds played"}
                        {detailedStats?.bestRound?.date && (
                          <span className="block">
                            {new Date(detailedStats.bestRound.date).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Best Hole Performance */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Best Hole Score
                      </CardTitle>
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="stat-best-hole">
                        {detailedStats?.bestHole?.score !== undefined ? 
                          `${detailedStats.bestHole.score}` : "--"
                        }
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {detailedStats?.bestHole?.holeNumber ? 
                          `Hole ${detailedStats.bestHole.holeNumber} (Par ${detailedStats.bestHole.par})` : 
                          "No holes completed"
                        }
                        {detailedStats?.bestHole?.relativeToPar && (
                          <span className="block">
                            {detailedStats.bestHole.relativeToPar > 0 ? '+' : ''}{detailedStats.bestHole.relativeToPar} to par
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Longest Fairway Streak */}
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Longest Fairway Streak
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="stat-fairway-streak">
                        {detailedStats?.longestFairwayStreak || 0}
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        consecutive holes
                      </p>
                    </CardContent>
                  </Card>

                  {/* Fewest Putts */}
                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Fewest Putts in a Round
                      </CardTitle>
                      <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-900 dark:text-amber-100" data-testid="stat-fewest-putts">
                        {detailedStats?.fewestPutts || "--"}
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {detailedStats?.fewestPuttsDate && (
                          <span>
                            {new Date(detailedStats.fewestPuttsDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Total Birdies */}
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
                        Total Birdies
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-900 dark:text-red-100" data-testid="stat-total-birdies">
                        {detailedStats?.totalBirdies || 0}
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        lifetime gross score birdies
                      </p>
                    </CardContent>
                  </Card>

                  {/* Rounds Played */}
                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Total Rounds
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-total-rounds">
                        {detailedStats?.totalRounds || 0}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        completed rounds
                        {detailedStats?.averageScore && (
                          <span className="block">
                            {parseFloat(detailedStats.averageScore).toFixed(1)} avg score
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                </div>

                {/* Performance Summary */}
                {detailedStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-accent">
                            {detailedStats.greensInRegulation || "--"}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Greens in Regulation
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent">
                            {detailedStats.fairwaysHit || "--"}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Fairways Hit
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent">
                            {detailedStats.puttsPerRound || "--"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Avg Putts/Round
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent">
                            {detailedStats.birdiePercentage || "--"}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Birdie Rate
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PlayerProfile;