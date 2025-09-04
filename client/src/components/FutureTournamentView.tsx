import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Users, MapPin, Calendar, Star } from "lucide-react";

interface FutureTournamentViewProps {
  tournament: any;
  tournamentId: string;
  course: any;
  selectedRound?: 'all' | number;
  tournamentRounds?: any[];
}

export function FutureTournamentView({ tournament, tournamentId, course, selectedRound = 'all', tournamentRounds }: FutureTournamentViewProps) {
  // Fetch course holes
  const { data: holes } = useQuery({
    queryKey: ["/api/courses", course?.id, "holes"],
    enabled: !!course?.id,
  });

  // Fetch tournament tee selections
  const { data: teeSelections } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "tee-selections"],
    enabled: !!tournamentId,
  });

  // Fetch registered players
  const { data: players } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "players"],
    enabled: !!tournamentId,
  });

  // Helper function to get yardage based on tee selection
  const getHoleYardage = (hole: any) => {
    const teeSelection = Array.isArray(teeSelections) 
      ? teeSelections.find((ts: any) => ts.holeId === hole.id)
      : null;
    
    const teeColor = teeSelection?.teeColor || 'white';
    
    switch (teeColor) {
      case 'gold': return hole.yardageGold || hole.yardageWhite;
      case 'blue': return hole.yardageBlue || hole.yardageWhite;
      case 'red': return hole.yardageRed || hole.yardageWhite;
      case 'white':
      default: return hole.yardageWhite;
    }
  };

  // Helper function to get tee color for a hole
  const getHoleTeeColor = (hole: any) => {
    const teeSelection = Array.isArray(teeSelections) 
      ? teeSelections.find((ts: any) => ts.holeId === hole.id)
      : null;
    return teeSelection?.teeColor || 'white';
  };

  // Calculate course statistics
  const allHoles = Array.isArray(holes) ? holes : [];
  const frontNine = allHoles.slice(0, 9);
  const backNine = allHoles.slice(9, 18);
  
  const frontNinePar = frontNine.reduce((sum, hole) => sum + hole.par, 0);
  const backNinePar = backNine.reduce((sum, hole) => sum + hole.par, 0);
  const totalPar = frontNinePar + backNinePar;
  
  const frontNineYardage = frontNine.reduce((sum, hole) => sum + getHoleYardage(hole), 0);
  const backNineYardage = backNine.reduce((sum, hole) => sum + getHoleYardage(hole), 0);
  const totalYardage = frontNineYardage + backNineYardage;

  // Get unique tee colors being used
  const usedTeeColors = Array.isArray(teeSelections) 
    ? Array.from(new Set(teeSelections.map((ts: any) => ts.teeColor)))
    : ['white'];
  
  // Format tee colors for display
  const formatTeeColors = (colors: string[]) => {
    if (colors.length === 1) {
      return `${colors[0].charAt(0).toUpperCase() + colors[0].slice(1)} Tees`;
    }
    return `Mixed Tees (${colors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')})`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Dynamic date and course logic based on selected round
  const getDisplayInfo = () => {
    if (selectedRound === 'all' && tournamentRounds && Array.isArray(tournamentRounds) && tournamentRounds.length > 1) {
      // Show date range for all rounds
      const dates = tournamentRounds.map(r => r.roundDate).filter(Boolean);
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : null;
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null;
      
      const dateRangeText = startDate && endDate 
        ? startDate.toDateString() === endDate.toDateString()
          ? formatDate(startDate.toISOString())
          : `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : tournament?.startDate ? formatDate(tournament.startDate) : 'TBD';
      
      // Show all courses
      const allCourses = tournamentRounds
        .map(r => r.courseId || tournament?.courseId)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique course IDs
      
      return {
        dateText: dateRangeText,
        showAllCourses: true,
        courseIds: allCourses
      };
    } else if (selectedRound !== 'all' && tournamentRounds && Array.isArray(tournamentRounds)) {
      // Show specific round info
      const roundData = tournamentRounds.find((r: any) => r.roundNumber === selectedRound);
      const roundDate = roundData?.roundDate ? formatDate(roundData.roundDate) : 'Date TBD';
      
      return {
        dateText: `Round ${selectedRound} • ${roundDate}`,
        showAllCourses: false,
        courseIds: [roundData?.courseId || tournament?.courseId].filter(Boolean)
      };
    }
    
    // Default single round display
    return {
      dateText: tournament?.startDate ? formatDate(tournament.startDate) : 'TBD',
      showAllCourses: false,
      courseIds: [tournament?.courseId].filter(Boolean)
    };
  };

  const displayInfo = getDisplayInfo();

  // Fetch all courses if needed for multi-round display
  const { data: allCoursesData } = useQuery({
    queryKey: ["/api/courses/multiple", displayInfo.courseIds],
    queryFn: async () => {
      if (!displayInfo.courseIds.length) return [];
      return Promise.all(
        displayInfo.courseIds.map(async (courseId) => {
          const response = await fetch(`/api/courses/${courseId}`);
          return response.ok ? response.json() : null;
        })
      );
    },
    enabled: displayInfo.showAllCourses && displayInfo.courseIds.length > 0,
  });

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
                  {displayInfo.dateText}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-semibold text-accent">Course</h3>
                {displayInfo.showAllCourses && allCoursesData ? (
                  <div className="space-y-1">
                    {allCoursesData.filter(Boolean).map((courseData: any, index: number) => (
                      <div key={courseData.id}>
                        <p className="text-secondary">{courseData.name}</p>
                        <p className="text-sm text-muted-foreground">{courseData.location}</p>
                        {index < allCoursesData.filter(Boolean).length - 1 && (
                          <hr className="my-1 border-muted-foreground/20" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="text-secondary">{course?.name || 'TBD'}</p>
                    <p className="text-sm text-muted-foreground">{course?.location || ''}</p>
                  </div>
                )}
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-accent" />
                <span>Course Scorecard</span>
              </div>
              {usedTeeColors.length > 0 && (
                <Badge variant="outline" className="text-accent border-accent">
                  {formatTeeColors(usedTeeColors)}
                </Badge>
              )}
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
                            <td className="text-center py-2">{getHoleYardage(hole)}</td>
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
                            <td className="text-center py-2">{getHoleYardage(hole)}</td>
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