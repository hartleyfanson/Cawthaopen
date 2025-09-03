import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { Camera, Save, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  profileImageUrl: z.string().url().optional().or(z.literal(""))
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      profileImageUrl: ""
    }
  });

  // Populate form with user data when it loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        profileImageUrl: (user as any)?.profileImageUrl || ""
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return await apiRequest("PUT", `/api/users/${(user as any)?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
      // Invalidate user cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL;
      
      try {
        setUploadingImage(true);
        // Update the ACL policy and get the normalized path
        const response = await apiRequest("PUT", "/api/profile-images", {
          profileImageURL: imageURL
        });
        
        // Update the form with the normalized path
        form.setValue("profileImageUrl", response.objectPath);
        
        toast({
          title: "Image Uploaded",
          description: "Your profile image has been uploaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to process the uploaded image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-accent">
            Edit Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Update your personal information and profile settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <img
                  src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                  data-testid="img-profile-large"
                />
                <div className="w-full space-y-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? "Processing..." : "Upload Profile Image"}
                    </div>
                  </ObjectUploader>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Or enter image URL manually:
                  </div>
                  
                  <Input
                    placeholder="https://example.com/your-image.jpg"
                    {...form.register("profileImageUrl")}
                    data-testid="input-profile-image-url"
                  />
                  {form.formState.errors.profileImageUrl && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.profileImageUrl.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      {...form.register("firstName")}
                      data-testid="input-first-name"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      {...form.register("lastName")}
                      data-testid="input-last-name"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-save-profile"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}