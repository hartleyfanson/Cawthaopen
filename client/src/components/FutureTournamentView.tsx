import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Users, MapPin, Calendar, Star } from "lucide-react";

interface FutureTournamentViewProps {
  tournament: any;
  tournamentId: string;
  course: any;
}

export function FutureTournamentView({ tournament, tournamentId, course }: FutureTournamentViewProps) {
  // Fetch course holes
  const { data: holes } = useQuery({
    queryKey: ["/api/courses", course?.id, "holes"],
    enabled: !!course?.id,
  });

  // Fetch registered players
  const { data: players } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "players"],
    enabled: !!tournamentId,
  });

  // Calculate course statistics
  const allHoles = Array.isArray(holes) ? holes : [];
  const frontNine = allHoles.slice(0, 9);
  const backNine = allHoles.slice(9, 18);
  
  const frontNinePar = frontNine.reduce((sum, hole) => sum + hole.par, 0);
  const backNinePar = backNine.reduce((sum, hole) => sum + hole.par, 0);
  const totalPar = frontNinePar + backNinePar;
  
  const frontNineYardage = frontNine.reduce((sum, hole) => sum + hole.yardageWhite, 0);
  const backNineYardage = backNine.reduce((sum, hole) => sum + hole.yardageWhite, 0);
  const totalYardage = frontNineYardage + backNineYardage;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Tournament Info Header */}
      <Card className="bg-primary border-secondary">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-semibold text-accent">Tournament Date</h3>
                <p className="text-secondary">
                  {tournament?.startDate ? formatDate(tournament.startDate) : 'TBD'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-semibold text-accent">Course</h3>
                <p className="text-secondary">{course?.name || 'TBD'}</p>
                <p className="text-sm text-muted-foreground">{course?.location || ''}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-semibold text-accent">Registered Players</h3>
                <p className="text-secondary">{Array.isArray(players) ? players.length : 0} Players</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Scorecard */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-accent" />
              <span>Course Scorecard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allHoles.length > 0 ? (
              <div className="space-y-6">
                {/* Front Nine */}
                <div>
                  <h3 className="font-semibold text-accent mb-3">Front Nine</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Hole</th>
                          <th className="text-center py-2 font-medium">Par</th>
                          <th className="text-center py-2 font-medium">Yards</th>
                          <th className="text-center py-2 font-medium">Handicap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {frontNine.map((hole: any) => (
                          <tr key={hole.id} className="border-b border-border/50">
                            <td className="py-2 font-medium">{hole.holeNumber}</td>
                            <td className="text-center py-2">{hole.par}</td>
                            <td className="text-center py-2">{hole.yardageWhite}</td>
                            <td className="text-center py-2">{hole.handicap}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-accent font-semibold">
                          <td className="py-2">OUT</td>
                          <td className="text-center py-2">{frontNinePar}</td>
                          <td className="text-center py-2">{frontNineYardage}</td>
                          <td className="text-center py-2">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Back Nine */}
                <div>
                  <h3 className="font-semibold text-accent mb-3">Back Nine</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Hole</th>
                          <th className="text-center py-2 font-medium">Par</th>
                          <th className="text-center py-2 font-medium">Yards</th>
                          <th className="text-center py-2 font-medium">Handicap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backNine.map((hole: any) => (
                          <tr key={hole.id} className="border-b border-border/50">
                            <td className="py-2 font-medium">{hole.holeNumber}</td>
                            <td className="text-center py-2">{hole.par}</td>
                            <td className="text-center py-2">{hole.yardageWhite}</td>
                            <td className="text-center py-2">{hole.handicap}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-accent font-semibold">
                          <td className="py-2">IN</td>
                          <td className="text-center py-2">{backNinePar}</td>
                          <td className="text-center py-2">{backNineYardage}</td>
                          <td className="text-center py-2">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Course Totals */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <h4 className="font-semibold text-accent">Total Par</h4>
                      <p className="text-2xl font-bold text-foreground">{totalPar}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-accent">Total Yardage</h4>
                      <p className="text-2xl font-bold text-foreground">{totalYardage.toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-accent">Tees</h4>
                      <p className="text-2xl font-bold text-foreground">White</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Course information will be available soon.</p>
            )}
          </CardContent>
        </Card>

        {/* Registered Players */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-accent" />
              <span>Registered Players ({Array.isArray(players) ? players.length : 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(players) && players.length > 0 ? (
              <div className="space-y-3">
                {players.map((player: any, index: number) => (
                  <div 
                    key={player.id} 
                    className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-accent font-semibold">
                          {player.firstName?.[0]}{player.lastName?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {player.firstName} {player.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(player.joinedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Players Registered Yet</h3>
                <p className="text-muted-foreground">
                  Be the first to join this tournament!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}