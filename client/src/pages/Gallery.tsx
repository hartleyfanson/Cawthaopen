import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UploadResult } from "@uppy/core";
import { useEffect } from "react";

export default function Gallery() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");

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

  const { data: tournament } = useQuery({
    queryKey: ["/api/tournaments", id],
    enabled: !!user && !!id,
  });

  const { data: photos, isLoading: loadingPhotos } = useQuery({
    queryKey: ["/api/tournaments", id, "gallery"],
    enabled: !!user && !!id,
  });

  const createPhotoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/gallery", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", id, "gallery"] });
      setCaption("");
      toast({
        title: "Photo Uploaded",
        description: "Your photo has been added to the gallery",
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
        description: "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      createPhotoMutation.mutate({
        tournamentId: id,
        imageUrl: uploadedFile.uploadURL,
        caption: caption || null,
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
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href={`/tournaments/${id}/leaderboard`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-back-to-tournament"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Tournament</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-accent mb-2">
              Tournament Gallery
            </h2>
            <p className="text-xl text-muted-foreground">
              {tournament?.name ? `Memories from ${tournament.name}` : "Memories from The Cawthra Open"}
            </p>
          </div>
          
          {/* Upload Section */}
          <div className="max-w-md mx-auto mb-8">
            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption (optional)"
                    className="bg-muted border-border"
                    data-testid="input-photo-caption"
                  />
                  
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full bg-secondary text-secondary-foreground hover:bg-accent font-semibold"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Camera className="h-5 w-5" />
                      <span>Upload Photo</span>
                    </div>
                  </ObjectUploader>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingPhotos ? (
            <div className="text-center text-muted-foreground">Loading photos...</div>
          ) : photos?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo: any) => (
                <div 
                  key={photo.id}
                  className="relative group cursor-pointer"
                  data-testid={`img-gallery-${photo.id}`}
                >
                  <img 
                    src={photo.imageUrl}
                    alt={photo.caption || "Tournament photo"}
                    className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-xl font-serif font-bold text-accent mb-4">
                  No Photos Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share a memorable moment from this tournament.
                </p>
                <div className="max-w-xs mx-auto">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full bg-secondary text-secondary-foreground hover:bg-accent font-semibold"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Camera className="h-5 w-5" />
                      <span>Upload First Photo</span>
                    </div>
                  </ObjectUploader>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
