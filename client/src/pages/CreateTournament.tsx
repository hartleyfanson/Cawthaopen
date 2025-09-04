import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTournamentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { z } from "zod";
import { CourseSearch } from "@/components/CourseSearch";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { Upload, Image } from "lucide-react";

const createTournamentSchema = insertTournamentSchema.extend({
  maxPlayers: z.number().min(1).max(100),
  numberOfRounds: z.number().min(1).max(4),
  headerImageUrl: z.string().optional(),
});

export default function CreateTournament() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isCreatingManualCourse, setIsCreatingManualCourse] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [importedCourse, setImportedCourse] = useState<any>(null);
  const [teeSelectionMode, setTeeSelectionMode] = useState<"same" | "mixed">("same");
  const [singleTeeColor, setSingleTeeColor] = useState("white");
  const [holeTeeMappings, setHoleTeeMappings] = useState(
    Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, teeColor: "white" }))
  );
  const [manualCourseData, setManualCourseData] = useState({
    name: "",
    location: "",
    description: "",
    holes: Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      par: 4,
      yardageWhite: 350,
      yardageBlue: 370,
      yardageRed: 300,
      yardageGold: 390,
      handicap: i + 1
    }))
  });
  const [roundDates, setRoundDates] = useState<Date[]>([new Date()]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Photo upload handlers
  const handlePhotoUpload = async () => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      toast({
        title: "Error",
        description: "Failed to prepare photo upload",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePhotoComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        
        // Set ACL policy for the uploaded image
        await apiRequest('PUT', '/api/tournament-photos', {
          imageUrl: uploadURL
        });
        
        setUploadedImageUrl(uploadURL);
        form.setValue('headerImageUrl', uploadURL);
        
        toast({
          title: "Photo Uploaded",
          description: "Tournament photo has been uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Error processing photo upload:', error);
      toast({
        title: "Error",
        description: "Failed to process photo upload",
        variant: "destructive",
      });
    }
  };

  const form = useForm({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      courseId: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "upcoming",
      maxPlayers: 32,
      scoringFormat: "stroke_play",
      handicapAllowance: "1.00",
      numberOfRounds: 1,
      headerImageUrl: "",
    },
  });

  // Watch numberOfRounds to update round dates
  const numberOfRounds = form.watch("numberOfRounds");
  // Watch scoringFormat to conditionally show handicap allowance
  const scoringFormat = form.watch("scoringFormat");
  
  useEffect(() => {
    if (numberOfRounds) {
      const newDates = Array.from({ length: numberOfRounds }, (_, i) => {
        // If we have a date for this index, keep it, otherwise create a new one
        return roundDates[i] || new Date(Date.now() + (i * 24 * 60 * 60 * 1000)); // Each round a day apart by default
      });
      setRoundDates(newDates);
    }
  }, [numberOfRounds, roundDates]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      console.log("Creating course with data:", courseData);
      return await apiRequest("POST", "/api/courses", courseData);
    },
    onError: (error) => {
      console.error("Course creation error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to create course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tournaments", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/status/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/status/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully",
      });
      // Redirect to dashboard
      setLocation(`/`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to create tournament: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    // Validate dates are in the future
    const now = new Date();
    if (data.startDate <= now) {
      form.setError("startDate", { message: "Start date must be in the future" });
      return;
    }
    if (data.endDate <= data.startDate) {
      form.setError("endDate", { message: "End date must be after start date" });
      return;
    }
    
    try {
      let courseId = data.courseId;
      
      // If creating a manual course, create it first
      if (isCreatingManualCourse && data.courseId === "add-manually") {
        if (!manualCourseData.name || !manualCourseData.location) {
          toast({
            title: "Error",
            description: "Please fill in course name and location",
            variant: "destructive",
          });
          return;
        }
        
        const courseResult = await createCourseMutation.mutateAsync({
          name: manualCourseData.name,
          location: manualCourseData.location,
          description: manualCourseData.description,
          holes: manualCourseData.holes,
        });
        
        courseId = (courseResult as any).id;
        console.log("Course created with ID:", courseId);
      }
      
      // Prepare tee mappings based on selection mode
      const teeSelections = teeSelectionMode === "same" 
        ? holeTeeMappings.map(hole => ({ holeNumber: hole.holeNumber, teeColor: singleTeeColor }))
        : holeTeeMappings;

      // Create the tournament with the course ID, tee selections, round dates, and image
      createTournamentMutation.mutate({
        ...data,
        courseId,
        teeSelections,
        roundDates: numberOfRounds > 1 ? roundDates : [data.startDate],
        headerImageUrl: uploadedImageUrl || data.headerImageUrl,
      });
    } catch (error) {
      console.error("Error in submission process:", error);
    }
  };

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
      
      {/* Header */}
      <section className="py-12 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-accent text-center">
            Create Tournament
          </h2>
          <p className="text-xl text-muted-foreground text-center mt-2">
            Set up a new golf tournament for The Cawthra Open
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-muted card-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-accent">Tournament Details</CardTitle>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Tournament Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Spring Championship 2024"
                            className="bg-background border-border"
                            data-testid="input-tournament-name"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your tournament..."
                            className="bg-background border-border"
                            rows={3}
                            data-testid="textarea-tournament-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Golf Course</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "add-manually") {
                            setIsCreatingManualCourse(true);
                            setShowCourseSearch(false);
                            setImportedCourse(null);
                          } else if (value === "search-courses") {
                            setShowCourseSearch(true);
                            setIsCreatingManualCourse(false);
                          } else {
                            setIsCreatingManualCourse(false);
                            setShowCourseSearch(false);
                            setImportedCourse(null);
                          }
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-background border-border"
                              data-testid="select-course"
                            >
                              <SelectValue placeholder="Select a golf course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="search-courses">🔍 Search Golf Courses</SelectItem>
                            <SelectItem value="add-manually">+ Add Manually</SelectItem>
                            {loadingCourses ? (
                              <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                            ) : Array.isArray(courses) && courses.length ? (
                              courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} - {course.location}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Course Search Section */}
                  {showCourseSearch && (
                    <div className="space-y-4">
                      <CourseSearch 
                        onCourseSelect={(course, holes) => {
                          // Set the imported course data
                          setImportedCourse({ course, holes });
                          
                          // Update the manual course data with imported information
                          setManualCourseData({
                            name: course.name,
                            location: `${course.city}, ${course.state}`,
                            description: `Imported from external course database. ${course.address || ''}`,
                            holes: holes.map(hole => ({
                              holeNumber: hole.holeNumber,
                              par: hole.par,
                              yardageWhite: hole.yardageWhite || 350,
                              yardageBlue: hole.yardageBlue || 370,
                              yardageRed: hole.yardageRed || 300,
                              yardageGold: hole.yardageGold || 390,
                              handicap: hole.handicap || hole.holeNumber
                            }))
                          });
                          
                          // Switch to manual course creation mode with pre-filled data
                          setIsCreatingManualCourse(true);
                          setShowCourseSearch(false);
                          form.setValue('courseId', 'add-manually');
                        }}
                      />
                    </div>
                  )}

                  {/* Imported Course Preview */}
                  {importedCourse && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="font-semibold text-green-800">Course Imported Successfully</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        <strong>{importedCourse.course.name}</strong> has been imported with {importedCourse.holes.length} holes. 
                        You can review and modify the course details below before creating your tournament.
                      </p>
                    </div>
                  )}

                  {isCreatingManualCourse && (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
                      <h3 className="text-lg font-semibold text-foreground">Create New Course</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Course Name</label>
                          <Input
                            value={manualCourseData.name}
                            onChange={(e) => setManualCourseData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter course name"
                            className="bg-background border-border"
                            data-testid="input-course-name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Location</label>
                          <Input
                            value={manualCourseData.location}
                            onChange={(e) => setManualCourseData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Enter location"
                            className="bg-background border-border"
                            data-testid="input-course-location"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <Textarea
                          value={manualCourseData.description}
                          onChange={(e) => setManualCourseData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Course description"
                          className="bg-background border-border"
                          rows={2}
                          data-testid="textarea-course-description"
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-foreground">Course Layout</h4>
                        <div className="grid gap-2 max-h-96 overflow-y-auto">
                          {manualCourseData.holes.map((hole, index) => (
                            <div key={index} className="grid grid-cols-6 gap-2 items-center p-2 border border-border rounded bg-background">
                              <span className="text-sm font-medium text-foreground">Hole {hole.holeNumber}</span>
                              <div>
                                <label className="text-xs text-muted-foreground">Par</label>
                                <Input
                                  type="number"
                                  min="3"
                                  max="5"
                                  value={hole.par}
                                  onChange={(e) => {
                                    const newHoles = [...manualCourseData.holes];
                                    newHoles[index].par = parseInt(e.target.value) || 3;
                                    setManualCourseData(prev => ({ ...prev, holes: newHoles }));
                                  }}
                                  className="h-8 text-xs"
                                  data-testid={`input-hole-${index + 1}-par`}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">White</label>
                                <Input
                                  type="number"
                                  value={hole.yardageWhite}
                                  onChange={(e) => {
                                    const newHoles = [...manualCourseData.holes];
                                    newHoles[index].yardageWhite = parseInt(e.target.value) || 0;
                                    setManualCourseData(prev => ({ ...prev, holes: newHoles }));
                                  }}
                                  className="h-8 text-xs"
                                  data-testid={`input-hole-${index + 1}-white`}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Blue</label>
                                <Input
                                  type="number"
                                  value={hole.yardageBlue}
                                  onChange={(e) => {
                                    const newHoles = [...manualCourseData.holes];
                                    newHoles[index].yardageBlue = parseInt(e.target.value) || 0;
                                    setManualCourseData(prev => ({ ...prev, holes: newHoles }));
                                  }}
                                  className="h-8 text-xs"
                                  data-testid={`input-hole-${index + 1}-blue`}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Red</label>
                                <Input
                                  type="number"
                                  value={hole.yardageRed}
                                  onChange={(e) => {
                                    const newHoles = [...manualCourseData.holes];
                                    newHoles[index].yardageRed = parseInt(e.target.value) || 0;
                                    setManualCourseData(prev => ({ ...prev, holes: newHoles }));
                                  }}
                                  className="h-8 text-xs"
                                  data-testid={`input-hole-${index + 1}-red`}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Gold</label>
                                <Input
                                  type="number"
                                  value={hole.yardageGold}
                                  onChange={(e) => {
                                    const newHoles = [...manualCourseData.holes];
                                    newHoles[index].yardageGold = parseInt(e.target.value) || 0;
                                    setManualCourseData(prev => ({ ...prev, holes: newHoles }));
                                  }}
                                  className="h-8 text-xs"
                                  data-testid={`input-hole-${index + 1}-gold`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tournament Photo Upload */}
                  <FormField
                    control={form.control}
                    name="headerImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Tournament Photo</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {uploadedImageUrl && (
                              <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                                <img 
                                  src={uploadedImageUrl} 
                                  alt="Tournament photo preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                  <Image className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10485760} // 10MB
                              onGetUploadParameters={handlePhotoUpload}
                              onComplete={handlePhotoComplete}
                              buttonClassName="w-full bg-secondary text-secondary-foreground hover:bg-accent"
                              directFileInput={true}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadedImageUrl ? 'Change Tournament Photo' : 'Upload Tournament Photo'}
                            </ObjectUploader>
                            {!uploadedImageUrl && (
                              <p className="text-sm text-muted-foreground">
                                Add a photo to make your tournament more appealing. This will be displayed in the tournament history.
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Start Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              className="bg-background border-border"
                              data-testid="input-start-date"
                              {...field}
                              value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              className="bg-background border-border"
                              data-testid="input-end-date"
                              {...field}
                              value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxPlayers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Maximum Players</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              max="100"
                              className="bg-background border-border"
                              data-testid="input-max-players"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfRounds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Number of Rounds</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              max="4"
                              className="bg-background border-border"
                              data-testid="input-number-of-rounds"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Round Dates Section */}
                  {numberOfRounds > 1 && (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
                      <h3 className="text-lg font-semibold text-foreground">Round Dates</h3>
                      <p className="text-sm text-muted-foreground">Set the date for each round of the tournament</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: numberOfRounds }, (_, i) => (
                          <div key={i}>
                            <label className="text-sm font-medium text-foreground">Round {i + 1} Date</label>
                            <Input
                              type="datetime-local"
                              value={roundDates[i]?.toISOString().slice(0, 16) || ''}
                              onChange={(e) => {
                                const newDates = [...roundDates];
                                newDates[i] = new Date(e.target.value);
                                setRoundDates(newDates);
                              }}
                              className="bg-background border-border"
                              data-testid={`input-round-${i + 1}-date`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
                    <h3 className="text-lg font-semibold text-foreground">Tee Selection</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="same-tee"
                          name="tee-selection"
                          checked={teeSelectionMode === "same"}
                          onChange={() => setTeeSelectionMode("same")}
                          className="text-accent"
                          data-testid="radio-same-tee"
                        />
                        <label htmlFor="same-tee" className="text-foreground">All holes use the same tee</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="mixed-tee"
                          name="tee-selection"
                          checked={teeSelectionMode === "mixed"}
                          onChange={() => setTeeSelectionMode("mixed")}
                          className="text-accent"
                          data-testid="radio-mixed-tee"
                        />
                        <label htmlFor="mixed-tee" className="text-foreground">Mix and match tees per hole</label>
                      </div>
                    </div>

                    {teeSelectionMode === "same" && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-foreground mb-2 block">Select Tee Color</label>
                        <Select value={singleTeeColor} onValueChange={setSingleTeeColor}>
                          <SelectTrigger 
                            className="bg-background border-border"
                            data-testid="select-single-tee-color"
                          >
                            <SelectValue placeholder="Select tee color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="white">White Tees</SelectItem>
                            <SelectItem value="blue">Blue Tees</SelectItem>
                            <SelectItem value="red">Red Tees</SelectItem>
                            <SelectItem value="gold">Gold Tees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {teeSelectionMode === "mixed" && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-foreground mb-3">Tee Selection per Hole</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
                          {holeTeeMappings.map((hole, index) => (
                            <div key={index} className="space-y-1">
                              <label className="text-xs font-medium text-foreground">Hole {hole.holeNumber}</label>
                              <Select 
                                value={hole.teeColor} 
                                onValueChange={(color) => {
                                  const newMappings = [...holeTeeMappings];
                                  newMappings[index].teeColor = color;
                                  setHoleTeeMappings(newMappings);
                                }}
                              >
                                <SelectTrigger 
                                  className="bg-background border-border h-8 text-xs"
                                  data-testid={`select-hole-${index + 1}-tee`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="white">White</SelectItem>
                                  <SelectItem value="blue">Blue</SelectItem>
                                  <SelectItem value="red">Red</SelectItem>
                                  <SelectItem value="gold">Gold</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="scoringFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Tournament Format</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            data-testid="select-scoring-format"
                          >
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select scoring format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stroke_play">Stroke Play</SelectItem>
                              <SelectItem value="stableford">Stableford Points</SelectItem>
                              <SelectItem value="handicap">Handicap Net Scoring</SelectItem>
                              <SelectItem value="callaway">Callaway System</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Only show handicap allowance when handicap scoring is selected */}
                  {scoringFormat === "handicap" && (
                    <FormField
                      control={form.control}
                      name="handicapAllowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Handicap Allowance</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                              data-testid="select-handicap-allowance"
                            >
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Select handicap allowance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1.00">100% (Full Handicap)</SelectItem>
                                <SelectItem value="0.90">90% Handicap</SelectItem>
                                <SelectItem value="0.80">80% Handicap</SelectItem>
                                <SelectItem value="0.75">75% Handicap</SelectItem>
                                <SelectItem value="0.70">70% Handicap</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                      className="flex-1"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTournamentMutation.isPending || createCourseMutation.isPending}
                      className="flex-1 bg-secondary text-secondary-foreground hover:bg-accent"
                      data-testid="button-create-tournament"
                    >
                      {createCourseMutation.isPending 
                        ? "Creating Course..." 
                        : createTournamentMutation.isPending 
                        ? "Creating Tournament..." 
                        : "Create Tournament"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
