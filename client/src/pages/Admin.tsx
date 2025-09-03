import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { Shield, Edit, Save, Users, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tournamentUpdateSchema = z.object({
  championsMeal: z.string().optional(),
  headerImageUrl: z.string().url().optional().or(z.literal(""))
});

type TournamentUpdateForm = z.infer<typeof tournamentUpdateSchema>;

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");

  const form = useForm<TournamentUpdateForm>({
    resolver: zodResolver(tournamentUpdateSchema),
    defaultValues: {
      championsMeal: "",
      headerImageUrl: ""
    }
  });

  // Check if user is admin
  const isAdmin = (user as any)?.isAdmin;

  const { data: tournaments = [] } = useQuery({
    queryKey: ["/api/tournaments"],
    enabled: !!user && isAdmin,
    retry: false,
  });

  const { data: selectedTournamentData } = useQuery({
    queryKey: ["/api/tournaments", selectedTournament],
    enabled: !!selectedTournament,
    retry: false,
  });

  // Populate form when tournament is selected
  useEffect(() => {
    if (selectedTournamentData) {
      form.reset({
        championsMeal: selectedTournamentData.championsMeal || "",
        headerImageUrl: selectedTournamentData.headerImageUrl || ""
      });
    }
  }, [selectedTournamentData, form]);

  const updateTournamentMutation = useMutation({
    mutationFn: async (data: TournamentUpdateForm) => {
      return apiRequest(`/api/tournaments/${selectedTournament}/admin`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Tournament Updated",
        description: "Tournament details have been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update tournament details. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: TournamentUpdateForm) => {
    if (!selectedTournament) {
      toast({
        title: "No Tournament Selected",
        description: "Please select a tournament to update.",
        variant: "destructive"
      });
      return;
    }
    updateTournamentMutation.mutate(data);
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

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-700">You need administrator privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-accent flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage tournaments, champions dinners, and tournament settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournament Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tournament">Select Tournament</Label>
                <Select 
                  value={selectedTournament} 
                  onValueChange={setSelectedTournament}
                >
                  <SelectTrigger data-testid="select-tournament">
                    <SelectValue placeholder="Choose a tournament..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament: any) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name} ({tournament.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTournamentData && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm text-accent mb-2">Tournament Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedTournamentData.name}</p>
                    <p><span className="font-medium">Status:</span> {selectedTournamentData.status}</p>
                    <p><span className="font-medium">Players:</span> {selectedTournamentData.maxPlayers || 'Unlimited'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tournament Management */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Tournament Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedTournament ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a tournament to manage its details</p>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="championsMeal">Champions Dinner Details</Label>
                    <Textarea
                      id="championsMeal"
                      placeholder="Describe the champions dinner menu, location, and special details..."
                      rows={4}
                      {...form.register("championsMeal")}
                      data-testid="textarea-champions-meal"
                    />
                    {form.formState.errors.championsMeal && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.championsMeal.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headerImageUrl">Tournament Header Image URL</Label>
                    <Input
                      id="headerImageUrl"
                      type="url"
                      placeholder="https://example.com/tournament-header.jpg"
                      {...form.register("headerImageUrl")}
                      data-testid="input-header-image-url"
                    />
                    {form.formState.errors.headerImageUrl && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.headerImageUrl.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="submit"
                      disabled={updateTournamentMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-save-tournament"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateTournamentMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold">Tournaments</h4>
                <p className="text-sm text-muted-foreground">{tournaments.length} total</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold">User Management</h4>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold">System Settings</h4>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Edit className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold">Content Management</h4>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}