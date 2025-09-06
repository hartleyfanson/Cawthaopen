import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Users, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GolfCourse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  website?: string;
  holes?: number;
  latitude?: number;
  longitude?: number;
}

interface CourseHole {
  holeNumber: number;
  par: number;
  yardageWhite?: number;
  yardageBlue?: number;
  yardageRed?: number;
  yardageGold?: number;
  handicap?: number;
}

interface CourseSearchProps {
  onCourseSelect: (course: GolfCourse, holes: CourseHole[]) => void;
  isLoading?: boolean;
}

export function CourseSearch({ onCourseSelect, isLoading = false }: CourseSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const { toast } = useToast();

  // Search for golf courses
  const { data: searchResults = [], isLoading: isSearching, refetch: searchCourses } = useQuery<GolfCourse[]>({
    queryKey: ["/api/courses/search", searchTerm],
    enabled: false, // Manual trigger
  });

  // Get course details with holes data
  const { data: courseDetails, isLoading: isLoadingDetails, refetch: getCourseDetails } = useQuery<CourseHole[]>({
    queryKey: ["/api/courses/details", selectedCourse?.id],
    enabled: false, // Manual trigger
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a course name or location to search.",
        variant: "destructive",
      });
      return;
    }
    searchCourses();
  };

  const handleCourseSelect = async (course: GolfCourse) => {
    setSelectedCourse(course);
    const result = await getCourseDetails();
    if (result.data) {
      // Immediately call the callback when course details are loaded
      onCourseSelect(course, result.data);
      toast({
        title: "Course Selected",
        description: `${course.name} has been selected with ${result.data.length} holes.`,
      });
      // Clear search results and selected course to hide preview
      setSearchTerm("");
      setSelectedCourse(null);
    }
  };

  const handleImportCourse = () => {
    if (selectedCourse && courseDetails) {
      onCourseSelect(selectedCourse, courseDetails);
      toast({
        title: "Course Imported",
        description: `${selectedCourse.name} has been imported with ${courseDetails.length} holes.`,
      });
      setSelectedCourse(null);
      setSearchTerm("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Golf Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter course name or location (e.g., 'Pebble Beach' or 'Augusta, GA')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
              data-testid="input-course-search"
            />
            <Button 
              type="button"
              onClick={handleSearch} 
              disabled={isSearching || !searchTerm.trim()}
              data-testid="button-search-courses"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Search from over 30,000 golf courses worldwide. Enter a course name or location to get started.
          </p>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {searchResults.map((course) => (
                  <div key={course.id} className="p-4 border rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold text-lg">{course.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{course.address}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {course.city}, {course.state} {course.country}
                        </div>
                        <div className="flex gap-2">
                          {course.holes && (
                            <Badge variant="secondary">{course.holes} holes</Badge>
                          )}
                          {course.phone && (
                            <Badge variant="outline">{course.phone}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleCourseSelect(course)}
                        disabled={isLoadingDetails && selectedCourse?.id === course.id}
                        data-testid={`button-select-course-${course.id}`}
                      >
                        {isLoadingDetails && selectedCourse?.id === course.id ? "Loading..." : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Course Details Preview */}
      {selectedCourse && courseDetails && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Course Preview: {selectedCourse.name}</span>
              <Button type="button" onClick={handleImportCourse} className="ml-4" data-testid="button-import-course">
                <Download className="h-4 w-4 mr-2" />
                Import Course
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Location:</span>
                <p className="text-muted-foreground">{selectedCourse.city}, {selectedCourse.state}</p>
              </div>
              <div>
                <span className="font-medium">Holes:</span>
                <p className="text-muted-foreground">{courseDetails.length}</p>
              </div>
              <div>
                <span className="font-medium">Total Par:</span>
                <p className="text-muted-foreground">
                  {courseDetails.reduce((sum, hole) => sum + hole.par, 0)}
                </p>
              </div>
              {selectedCourse.website && (
                <div>
                  <span className="font-medium">Website:</span>
                  <a 
                    href={selectedCourse.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    Visit Site
                  </a>
                </div>
              )}
            </div>

            <Separator />

            {/* Holes Preview */}
            <div>
              <h4 className="font-medium mb-3">Hole Information</h4>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {courseDetails.map((hole) => (
                    <div key={hole.holeNumber} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-12">#{hole.holeNumber}</span>
                        <Badge variant="outline">Par {hole.par}</Badge>
                      </div>
                      <div className="flex gap-4 text-sm">
                        {hole.yardageRed && (
                          <span className="text-red-600">Red: {hole.yardageRed}y</span>
                        )}
                        {hole.yardageWhite && (
                          <span className="text-gray-600">White: {hole.yardageWhite}y</span>
                        )}
                        {hole.yardageBlue && (
                          <span className="text-blue-600">Blue: {hole.yardageBlue}y</span>
                        )}
                        {hole.yardageGold && (
                          <span className="text-yellow-600">Gold: {hole.yardageGold}y</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">
                This course data will be imported and saved to your tournament. All 18 holes with par and yardage information will be available for scoring.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchTerm && searchResults.length === 0 && !isSearching && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              Try searching with a different course name or location.
            </p>
            <p className="text-sm text-muted-foreground">
              Tips: Use full course names like "Augusta National" or locations like "Scottsdale, AZ"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}