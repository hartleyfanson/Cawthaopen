import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Settings, LogOut, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/IMG_4006_1756925482771.png";

export function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
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

  // Reset preview when modal closes
  React.useEffect(() => {
    if (!isProfileDialogOpen) {
      setPreviewImageUrl(null);
    }
  }, [isProfileDialogOpen]);

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
      setIsProfileDialogOpen(false);
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

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 bg-primary border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <button className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                <img 
                  src={logoImage} 
                  alt="The Cawthra Open" 
                  className="h-12 w-auto object-contain"
                  data-testid="logo-header"
                />
              </button>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive("/") && location === "/"
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </span>
            </Link>
            <Link href="/tournaments/history">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive("/tournaments/history")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-tournaments"
              >
                Tournaments
              </span>
            </Link>
            <Link href="/tournaments/create">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive("/tournaments/create")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-create"
              >
                Create Tournament
              </span>
            </Link>
            <Link href="/achievements">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive("/achievements")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-achievements"
              >
                Achievements
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                      data-testid="button-profile-dropdown"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={(user as any)?.profileImageUrl} alt="Profile" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {getInitials((user as any)?.firstName, (user as any)?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {(user as any)?.firstName && (user as any)?.lastName 
                            ? `${(user as any)?.firstName} ${(user as any)?.lastName}`
                            : (user as any)?.email?.split('@')[0] || 'User'
                          }
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {(user as any)?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DialogTrigger asChild>
                      <DropdownMenuItem data-testid="menu-edit-profile">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => window.location.href = "/api/logout"}
                      data-testid="menu-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={previewImageUrl || (user as any)?.profileImageUrl} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        data-testid="input-email"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsProfileDialogOpen(false)}
                        data-testid="button-cancel-profile"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-primary-foreground"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/") && location === "/"
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                >
                  Dashboard
                </span>
              </Link>
              <Link href="/tournaments/history" onClick={() => setIsMobileMenuOpen(false)}>
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/tournaments/history")
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                >
                  Tournaments
                </span>
              </Link>
              <Link href="/tournaments/create" onClick={() => setIsMobileMenuOpen(false)}>
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/tournaments/create")
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                >
                  Create Tournament
                </span>
              </Link>
              <Link href="/achievements" onClick={() => setIsMobileMenuOpen(false)}>
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/achievements")
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                >
                  Achievements
                </span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileDialogOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-foreground hover:bg-primary/50 transition-colors"
                data-testid="mobile-edit-profile"
              >
                Edit Profile
              </button>
              <button
                onClick={() => {
                  window.location.href = "/api/logout";
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-foreground hover:bg-primary/50 transition-colors"
                data-testid="mobile-logout"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
