import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, TrendingUp, Star, BarChart3, Calendar } from "lucide-react";

export default function Statistics() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: detailedStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/users/${(user as any)?.id}/detailed-stats`],
    enabled: !!user,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-accent">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-accent">
            Golf Statistics
          </h1>
          <p className="text-muted-foreground mt-2">
            Your comprehensive golf performance analytics
          </p>
        </div>

        {statsLoading ? (
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
        )}

        {/* Additional Statistics */}
        {detailedStats && (
          <div className="mt-8">
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
          </div>
        )}
      </div>
    </div>
  );
}