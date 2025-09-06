import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AchievementBadge } from "@/components/AchievementBadge";
import { VerticalAchievementTree } from "@/components/VerticalAchievementTree";
import { Trophy, Award, Target, TrendingUp, Calendar, BarChart3, Star, ArrowLeft, Users, Info, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Achievement, PlayerAchievement, PlayerStats, User } from "@shared/schema";

interface PlayerAchievementWithDetails extends PlayerAchievement {
  achievement: Achievement;
}

function PlayerProfile() {
  const { playerId } = useParams();
  const searchParams = useSearch();
  const [location] = useLocation();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [categoryIndices, setCategoryIndices] = useState<Record<string, number>>({});
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Determine default tab based on route
  useEffect(() => {
    if (location === "/achievements") {
      setActiveTab("achievements");
    } else if (location === "/statistics") {
      setActiveTab("stats");
    } else {
      const urlParams = new URLSearchParams(searchParams);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['overview', 'achievements', 'stats'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams, location]);

  // Set initial selected player
  useEffect(() => {
    if (playerId) {
      setSelectedPlayerId(playerId);
    } else if ((currentUser as any)?.id) {
      setSelectedPlayerId((currentUser as any).id);
    }
  }, [playerId, currentUser]);

  // Fetch all users for player selector
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch selected player data
  const { data: player, isLoading: playerLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"], // Still get current user for auth context
  });

  // Get the selected player from all users
  const selectedPlayer = allUsers.find(user => user.id === selectedPlayerId) || player;

  // Fetch achievements data
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: playerAchievements = [], isLoading: playerAchievementsLoading } = useQuery<PlayerAchievementWithDetails[]>({
    queryKey: ["/api/players", selectedPlayerId, "achievements"],
    enabled: !!selectedPlayerId,
  });

  // Use same data source as leaderboard (rounds table) for all statistics
  const { data: playerStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/users", selectedPlayerId, "stats"],
    enabled: !!selectedPlayerId,
  });

  const { data: detailedStats, isLoading: detailedStatsLoading } = useQuery<any>({
    queryKey: ["/api/users", selectedPlayerId, "detailed-stats"],
    enabled: !!selectedPlayerId,
  });

  if (playerLoading || achievementsLoading || playerAchievementsLoading || statsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto text-secondary animate-bounce mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Loading player profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPlayer) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">Player not found</p>
          </div>
        </div>
      </div>
    );
  }

  const unlockedAchievements = new Set(playerAchievements.map(pa => pa.achievementId));
  // Get achievement data from playerStats (which has achievement-specific data)
  const totalPoints = 0; // Will be calculated from achievements
  const totalAchievements = playerAchievements?.length || 0;
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button and Player Selector */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          
          {/* Player Selector */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <Select
              value={selectedPlayerId}
              onValueChange={setSelectedPlayerId}
            >
              <SelectTrigger className="w-[200px]" data-testid="select-player">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} data-testid={`select-option-${user.id}`}>
                    {user.firstName} {user.lastName} {user.id === (currentUser as any)?.id ? "(You)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Player Header */}
        <Card className="mb-8 border-green-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-secondary">
                <AvatarImage src={selectedPlayer.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-bold">
                  {getInitials(selectedPlayer.firstName || undefined, selectedPlayer.lastName || undefined)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {selectedPlayer.firstName && selectedPlayer.lastName 
                    ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}`
                    : selectedPlayer.email?.split('@')[0] || 'Player'
                  }
                </h1>
                
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {totalAchievements} Achievements
                  </Badge>
                  {(selectedPlayer as any).handicap && (
                    <Badge variant="outline">
                      Handicap: {(selectedPlayer as any).handicap}
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
                      <p className="text-2xl font-bold">
                        {detailedStats?.averageScore ? parseFloat(detailedStats.averageScore).toFixed(2) : '--'}
                      </p>
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
                  <div className="flex flex-wrap gap-1 xs:gap-2 sm:gap-3 md:gap-4">
                    {playerAchievements.slice(0, 6).map((pa) => (
                      <AchievementBadge
                        key={pa.id}
                        achievement={pa.achievement}
                        isUnlocked={true}
                        unlockedAt={pa.unlockedAt?.toString()}
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

          {/* Achievements Tab - Vertical Skill Tree */}
          <TabsContent value="achievements" className="space-y-6">
            {/* Achievement Overview */}
            <Card className="bg-gradient-to-r from-green-50 to-gold-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-center justify-center">
                  <Trophy className="h-6 w-6 text-gold" />
                  Skill Tree Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-gold">{totalAchievements}</div>
                  <div className="text-sm text-muted-foreground">Skills Unlocked</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-gold-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${achievementProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {achievementProgress.toFixed(1)}% Complete
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vertical Achievement Tree */}
            <VerticalAchievementTree 
              achievements={achievements} 
              unlockedAchievements={unlockedAchievements} 
              playerAchievements={playerAchievements}
            />

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAchievement(null)}>
                <Card className="max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {{
                            'Trophy': '🏆', 'Target': '🎯', 'Zap': '⚡', 'Star': '⭐', 'Crown': '👑', 'Award': '🏅',
                            'Eye': '👁️', 'CheckCircle': '✅', 'Navigation': '🧭', 'TrendingUp': '📈', 'Cog': '⚙️',
                            'CloudRain': '🌧️', 'SmileIcon': '😎'
                          }[selectedAchievement.badgeIcon] || '🏆'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{selectedAchievement.name}</CardTitle>
                          <div className={`text-sm font-medium capitalize ${
                            selectedAchievement.rarity === 'legendary' ? 'text-purple-700' :
                            selectedAchievement.rarity === 'epic' ? 'text-orange-700' :
                            selectedAchievement.rarity === 'rare' ? 'text-blue-700' :
                            'text-gray-700'
                          }`}>
                            {selectedAchievement.rarity} • {selectedAchievement.category}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedAchievement(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                        <p className="text-sm">{selectedAchievement.description}</p>
                      </div>
                      
                      {selectedAchievement.value && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Requirement</h4>
                          <p className="text-sm">Threshold: {selectedAchievement.value}</p>
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-lg border-2 ${
                        unlockedAchievements.has(selectedAchievement.id) 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200' 
                          : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold capitalize ${
                            unlockedAchievements.has(selectedAchievement.id) 
                              ? 'text-emerald-700' 
                              : 'text-slate-600'
                          }`}>
                            Status: {unlockedAchievements.has(selectedAchievement.id) ? 'Complete' : 'In Progress'}
                          </span>
                          <div className={`h-3 w-3 rounded-full ${
                            unlockedAchievements.has(selectedAchievement.id) 
                              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                              : 'bg-gray-400'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
                            {parseFloat(detailedStats.averageScore).toFixed(2)} avg score
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
                          <div className="text-lg font-semibold text-accent" data-testid="summary-average-score">
                            {playerStats?.averageScore ? parseFloat(playerStats.averageScore).toFixed(1) : "--"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Average Score
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-handicap">
                            {playerStats?.handicap !== null ? playerStats.handicap : "--"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Estimated Handicap
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-fairways-hit">
                            {playerStats?.totalFairwaysHit && playerStats?.totalFairwayAttempts ? 
                              Math.round((playerStats.totalFairwaysHit / playerStats.totalFairwayAttempts) * 100) : "--"}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Fairways Hit
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-gir">
                            {playerStats?.totalGIR && playerStats?.totalGIRAttempts ? 
                              Math.round((playerStats.totalGIR / playerStats.totalGIRAttempts) * 100) : "--"}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Greens in Regulation
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-putts">
                            {playerStats?.averagePutts ? parseFloat(playerStats.averagePutts).toFixed(1) : "--"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Average Putts
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-tournaments-won">
                            {playerStats?.wins || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tournaments Won
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-rounds-played">
                            {playerStats?.totalRounds || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rounds Played
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-tournaments-played">
                            {playerStats?.tournamentsPlayed || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tournaments Played
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-best-finish">
                            {playerStats?.bestFinish ? `${playerStats.bestFinish}${
                              playerStats.bestFinish === 1 ? 'st' : 
                              playerStats.bestFinish === 2 ? 'nd' : 
                              playerStats.bestFinish === 3 ? 'rd' : 'th'
                            }` : "--"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Best Tournament Finish
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-accent" data-testid="summary-top10-finishes">
                            {playerStats?.top10Finishes || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Top 10 Finishes
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