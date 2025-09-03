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

const createTournamentSchema = insertTournamentSchema.extend({
  maxPlayers: z.number().min(1).max(100),
});

export default function CreateTournament() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tournaments", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully",
      });
      // Redirect to tournament page
      response.json().then((tournament) => {
        setLocation(`/tournaments/${tournament.id}/leaderboard`);
      });
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
        description: "Failed to create tournament",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createTournamentMutation.mutate(data);
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-background border-border"
                              data-testid="select-course"
                            >
                              <SelectValue placeholder="Select a golf course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingCourses ? (
                              <SelectItem value="">Loading courses...</SelectItem>
                            ) : courses?.length ? (
                              courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} - {course.location}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="">No courses available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
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
                      {createTournamentMutation.isPending ? "Creating..." : "Create Tournament"}
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
