import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertTournamentSchema, type Tournament } from "@shared/schema";
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

const createTournamentSchema = insertTournamentSchema
  .extend({
    // numeric inputs arrive as strings; coerce them
    maxPlayers: z.coerce.number().int().min(1).max(100),
    numberOfRounds: z.coerce.number().int().min(1).max(4),

    // datetime-local gives strings; normalize to Date
    startDate: z.preprocess(
      (v) => (v instanceof Date ? v : new Date(String(v))),
      z.date(),
    ),
    endDate: z.preprocess(
      (v) => (v instanceof Date ? v : new Date(String(v))),
      z.date(),
    ),

    // courseId must be a positive integer
    courseId: z.number().int().positive("Please select a course"),

    handicapAllowance: z.coerce.string(),
    headerImageUrl: z.string().optional(), // optional = image not required
  })
  .omit({ createdBy: true }); // omit createdBy as it will be set server-side

export default function CreateTournament() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [teeSelectionMode, setTeeSelectionMode] = useState<"same" | "mixed">(
    "same",
  );
  const [singleTeeColor, setSingleTeeColor] = useState("white");
  const [holeTeeMappings, setHoleTeeMappings] = useState(
    Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      teeColor: "white",
    })),
  );
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [roundDates, setRoundDates] = useState<Date[]>([new Date()]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Photo upload handlers
  const handlePhotoUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      toast({
        title: "Error",
        description: "Failed to prepare photo upload",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePhotoComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
  ) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;

        if (uploadURL) {
          // Set ACL policy for the uploaded image
          const aclResponse = await apiRequest(
            "PUT",
            "/api/tournament-photos",
            {
              imageUrl: uploadURL,
            },
          );
          const aclData = await aclResponse.json();

          // Use the object path from ACL response
          const objectPath = aclData.objectPath;
          setUploadedImageUrl(objectPath);
          form.setValue("headerImageUrl", objectPath);

          toast({
            title: "Photo Uploaded",
            description: "Tournament photo has been uploaded successfully",
          });
        }
      }
    } catch (error) {
      console.error("Error processing photo upload:", error);
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
      courseId: "" as unknown as number,
      startDate: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
      endDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // +3 hours
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

  // FIX: only depend on numberOfRounds; keep any previously chosen dates
  useEffect(() => {
    if (!numberOfRounds) return;
    setRoundDates((prev) =>
      Array.from(
        { length: numberOfRounds },
        (_, i) => prev[i] ?? new Date(Date.now() + i * 86400000),
      ),
    );
  }, [numberOfRounds]);

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

  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tournaments", data);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Tournament>;
    },
    onSuccess: (tournament: Tournament) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/tournaments/status/upcoming"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/tournaments/status/active"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Tournament Created",
        description:
          "Your tournament has been created successfully. Redirecting to tournament page...",
      });
      setLocation(`/tournaments/${tournament.id}`);
    },
    onError: (error: any) => {
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
      form.setError("startDate", {
        message: "Start date must be in the future",
      });
      return;
    }
    if (data.endDate <= data.startDate) {
      form.setError("endDate", {
        message: "End date must be after start date",
      });
      return;
    }

    // Validate course selection (must be a positive number)
    if (!data.courseId || data.courseId <= 0) {
      form.setError("courseId", { message: "Please select a course" });
      return;
    }

    try {
      const courseId = Number(data.courseId);

      // Prepare tee mappings based on selection mode
      const teeSelections =
        teeSelectionMode === "same"
          ? holeTeeMappings.map((hole) => ({
              holeNumber: hole.holeNumber,
              teeColor: singleTeeColor,
            }))
          : holeTeeMappings;

      // Create the tournament data
      const tournamentData = {
        name: data.name,
        description: data.description,
        courseId,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        status: data.status,
        maxPlayers: data.maxPlayers,
        numberOfRounds: data.numberOfRounds,
        scoringFormat: data.scoringFormat,
        handicapAllowance: data.handicapAllowance,
        headerImageUrl: uploadedImageUrl || data.headerImageUrl || "",
        teeSelections,
        roundDates: (numberOfRounds > 1 ? roundDates : [data.startDate]).map(
          (d) => d.toISOString(),
        ),
      };

      console.log("Submitting tournament data:", tournamentData);

      // Create the tournament
      createTournamentMutation.mutate(tournamentData);
    } catch (error) {
      console.error("Error in submission process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
              <CardTitle className="text-2xl font-serif text-accent">
                Tournament Details
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.error("Form validation errors:", errors);
                    toast({
                      title: "Check form fields",
                      description: "Some fields need your attention.",
                      variant: "destructive",
                    });
                  })}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Tournament Name
                        </FormLabel>
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
                        <FormLabel className="text-foreground">
                          Description
                        </FormLabel>
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
                        <FormLabel className="text-foreground">
                          Golf Course
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {selectedCourse ? (
                              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-green-800 dark:text-green-200">
                                      {selectedCourse.name}
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-300">
                                      {selectedCourse.city},{" "}
                                      {selectedCourse.state}{" "}
                                      {selectedCourse.country}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      {selectedCourse.holes?.length ||
                                        selectedCourse.holes ||
                                        18}{" "}
                                      holes • Par{" "}
                                      {selectedCourse.holes?.reduce?.(
                                        (sum: number, hole: any) =>
                                          sum + hole.par,
                                        0,
                                      ) || "TBD"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">
                                        ✓
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Search for a golf course below
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Course Search Section */}
                  <div className="space-y-4">
                    <CourseSearch
                      onCourseSelect={(course, holes) => {
                        const courseIdNumber = Number(course.id);
                        form.setValue("courseId", courseIdNumber, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        // Clear any existing errors
                        form.clearErrors("courseId");
                        setSelectedCourse({ ...course, holes });
                        toast({
                          title: "Course selected",
                          description: `${course.name} set for this tournament.`,
                        });
                      }}
                    />
                  </div>

                  {/* Tournament Photo Upload */}
                  <FormField
                    control={form.control}
                    name="headerImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Tournament Photo
                        </FormLabel>
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
                              onError={(error) => {
                                toast({
                                  title: "Upload Error",
                                  description: String(error),
                                  variant: "destructive",
                                });
                              }}
                              buttonClassName="w-full bg-secondary text-secondary-foreground hover:bg-accent"
                              directFileInput={true}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadedImageUrl
                                ? "Change Tournament Photo"
                                : "Upload Tournament Photo"}
                            </ObjectUploader>
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
                          <FormLabel className="text-foreground">
                            Start Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="bg-background border-border"
                              data-testid="input-start-date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().slice(0, 16)
                                  : (field.value ?? "")
                              }
                              onChange={(e) =>
                                field.onChange(new Date(e.target.value))
                              }
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
                          <FormLabel className="text-foreground">
                            End Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="bg-background border-border"
                              data-testid="input-end-date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().slice(0, 16)
                                  : (field.value ?? "")
                              }
                              onChange={(e) =>
                                field.onChange(new Date(e.target.value))
                              }
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
                          <FormLabel className="text-foreground">
                            Maximum Players
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              className="bg-background border-border"
                              data-testid="input-max-players"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
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
                          <FormLabel className="text-foreground">
                            Number of Rounds
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="4"
                              className="bg-background border-border"
                              data-testid="input-number-of-rounds"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
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
                      <h3 className="text-lg font-semibold text-foreground">
                        Round Dates
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Set the date for each round of the tournament
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: numberOfRounds }, (_, i) => (
                          <div key={i}>
                            <label className="text-sm font-medium text-foreground">
                              Round {i + 1} Date
                            </label>
                            <Input
                              type="datetime-local"
                              value={
                                roundDates[i]?.toISOString().slice(0, 16) || ""
                              }
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
                    <h3 className="text-lg font-semibold text-foreground">
                      Tee Selection
                    </h3>

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
                        <label htmlFor="same-tee" className="text-foreground">
                          All holes use the same tee
                        </label>
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
                        <label htmlFor="mixed-tee" className="text-foreground">
                          Mix and match tees per hole
                        </label>
                      </div>
                    </div>

                    {teeSelectionMode === "same" && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Select Tee Color
                        </label>
                        <Select
                          value={singleTeeColor}
                          onValueChange={setSingleTeeColor}
                        >
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
                        <h4 className="text-sm font-medium text-foreground mb-3">
                          Tee Selection per Hole
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
                          {holeTeeMappings.map((hole, index) => (
                            <div key={index} className="space-y-1">
                              <label className="text-xs font-medium text-foreground">
                                Hole {hole.holeNumber}
                              </label>
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
                        <FormLabel className="text-foreground">
                          Tournament Format
                        </FormLabel>
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
                              <SelectItem value="stroke_play">
                                Stroke Play
                              </SelectItem>
                              <SelectItem value="stableford">
                                Stableford Points
                              </SelectItem>
                              <SelectItem value="handicap">
                                Handicap Net Scoring
                              </SelectItem>
                              <SelectItem value="callaway">
                                Callaway System
                              </SelectItem>
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
                          <FormLabel className="text-foreground">
                            Handicap Allowance
                          </FormLabel>
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
                                <SelectItem value="1.00">
                                  100% (Full Handicap)
                                </SelectItem>
                                <SelectItem value="0.90">
                                  90% Handicap
                                </SelectItem>
                                <SelectItem value="0.80">
                                  80% Handicap
                                </SelectItem>
                                <SelectItem value="0.75">
                                  75% Handicap
                                </SelectItem>
                                <SelectItem value="0.70">
                                  70% Handicap
                                </SelectItem>
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
                      disabled={createTournamentMutation.isPending}
                      className="flex-1 bg-secondary text-secondary-foreground hover:bg-accent"
                      data-testid="button-create-tournament"
                    >
                      {createTournamentMutation.isPending
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
