import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";

interface UserStatsProps {
  userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "stats"],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card className="bg-muted card-shadow">
        <CardContent className="p-6">
          <div className="text-muted-foreground">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }

  const formatPercentage = (numerator: number, denominator: number) => {
    if (!denominator) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
  };

  const formatAverage = (value: number) => {
    if (!value) return '0.0';
    return Number(value).toFixed(1);
  };

  return (
    <Card className="bg-muted card-shadow">
      <CardHeader>
        <CardTitle className="text-2xl font-serif font-bold text-accent flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Your Stats
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Fairways Hit
            </span>
            <span 
              className="text-accent font-semibold" 
              data-testid="stat-fairways-hit"
            >
              {formatPercentage((stats as any)?.totalFairwaysHit || 0, (stats as any)?.totalFairwayAttempts || 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Greens in Regulation</span>
            <span 
              className="text-accent font-semibold" 
              data-testid="stat-gir"
            >
              {formatPercentage((stats as any)?.totalGIR || 0, (stats as any)?.totalGIRAttempts || 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Average Putts</span>
            <span 
              className="text-accent font-semibold" 
              data-testid="stat-avg-putts"
            >
              {formatAverage((stats as any)?.averagePutts || 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rounds Played</span>
            <span 
              className="text-accent font-semibold" 
              data-testid="stat-rounds"
            >
              {(stats as any)?.totalRounds || 0}
            </span>
          </div>
        </div>
        
        <Link href="/achievements?tab=stats">
          <Button 
            className="w-full mt-6 bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            data-testid="button-view-full-stats"
          >
            View Full Statistics
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
