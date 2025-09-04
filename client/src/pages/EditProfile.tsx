import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function EditProfile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form when user data loads
  React.useEffect(() => {
    if (user) {
      setEditForm({
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        email: (user as any)?.email || ''
      });
    }
  }, [user]);

  // Redirect if not authenticated
  React.useEffect(() => {
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/users/${(user as any)?.id}/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setLocation('/'); // Navigate back to dashboard
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = { ...editForm };
    if (previewImageUrl) {
      (formData as any).profileImageUrl = previewImageUrl;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleProfileImageUpload = async () => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL
      };
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to get upload URL",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleProfileImageComplete = async (result: any) => {
    if (result.successful && result.successful[0]) {
      try {
        const uploadURL = result.successful[0].uploadURL;
        
        // Set ACL policy for the uploaded profile image
        const aclResponse = await apiRequest('PUT', '/api/profile-photos', {
          imageUrl: uploadURL
        });
        const aclData = await aclResponse.json();
        
        // Store the object path for preview (don't save to database yet)
        setPreviewImageUrl(aclData.objectPath);
        
        toast({
          title: "Photo Uploaded",
          description: "Click 'Save Changes' to update your profile.",
        });
      } catch (error) {
        console.error('Error uploading profile image:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload profile image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-foreground mb-4">
              Edit Profile
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Update your personal information and profile photo
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-primary border border-border">
            <CardHeader>
              <CardTitle className="text-primary-foreground text-center">
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={previewImageUrl || (user as any)?.profileImageUrl} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                      {getInitials((user as any)?.firstName, (user as any)?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleProfileImageUpload}
                    onComplete={handleProfileImageComplete}
                    onError={(error) => {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                    buttonClassName="text-sm"
                    directFileInput={true}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </ObjectUploader>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-primary-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-background text-foreground"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-primary-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-background text-foreground"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-background text-foreground"
                    data-testid="input-email"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Link href="/">
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="button-cancel-profile"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-secondary text-secondary-foreground hover:bg-accent"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}