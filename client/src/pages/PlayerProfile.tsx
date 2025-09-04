import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Trophy, Award, Target, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import type { Achievement, PlayerAchievement, PlayerStats, User } from "@shared/schema";

interface PlayerAchievementWithDetails extends PlayerAchievement {
  achievement: Achievement;
}

export default function PlayerProfile() {
  const { playerId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

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

  const { data: detailedStats, isLoading: detailedStatsLoading } = useQuery({
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
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {totalPoints} Points
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
                  <div className="flex flex-wrap gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailedStats?.greensInRegulation && (
                    <div className="flex justify-between">
                      <span>Greens in Regulation</span>
                      <span className="font-semibold">{detailedStats.greensInRegulation}%</span>
                    </div>
                  )}
                  {detailedStats?.fairwaysHit && (
                    <div className="flex justify-between">
                      <span>Fairways Hit</span>
                      <span className="font-semibold">{detailedStats.fairwaysHit}%</span>
                    </div>
                  )}
                  {detailedStats?.puttsPerRound && (
                    <div className="flex justify-between">
                      <span>Putts per Round</span>
                      <span className="font-semibold">{detailedStats.puttsPerRound}</span>
                    </div>
                  )}
                  {detailedStats?.birdiePercentage && (
                    <div className="flex justify-between">
                      <span>Birdie Percentage</span>
                      <span className="font-semibold">{detailedStats.birdiePercentage}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Points</span>
                    <span className="font-semibold">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Achievements Unlocked</span>
                    <span className="font-semibold">{totalAchievements}/{achievements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-semibold">{achievementProgress.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Holes in One</span>
                    <span className="font-semibold">{playerStats?.holesInOne || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eagles</span>
                    <span className="font-semibold">{playerStats?.eaglesCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Birdies</span>
                    <span className="font-semibold">{playerStats?.birdiesCount || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}