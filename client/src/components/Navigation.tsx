import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from "@assets/IMG_4006_1756925482771.png";

export function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link href="/create-tournament">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive("/create-tournament")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-create-tournament"
              >
                Create Tournament
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                    data-testid="avatar-dropdown"
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
                  <Link href="/profile/edit">
                    <DropdownMenuItem data-testid="menu-edit-profile">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                  </Link>
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
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <div className="flex flex-col space-y-4">
              <Link href="/">
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/") && location === "/"
                      ? "text-secondary bg-accent" 
                      : "text-primary-foreground hover:text-secondary hover:bg-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-dashboard"
                >
                  Dashboard
                </span>
              </Link>
              <Link href="/tournaments/history">
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/tournaments/history")
                      ? "text-secondary bg-accent" 
                      : "text-primary-foreground hover:text-secondary hover:bg-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-tournaments"
                >
                  Tournaments
                </span>
              </Link>
              <Link href="/achievements">
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/achievements")
                      ? "text-secondary bg-accent" 
                      : "text-primary-foreground hover:text-secondary hover:bg-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-achievements"
                >
                  Achievements
                </span>
              </Link>
              <Link href="/create-tournament">
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/create-tournament")
                      ? "text-secondary bg-accent" 
                      : "text-primary-foreground hover:text-secondary hover:bg-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-create-tournament"
                >
                  Create Tournament
                </span>
              </Link>
              
              {user && (
                <>
                  <div className="border-t border-border my-4"></div>
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl} alt="Profile" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {getInitials((user as any)?.firstName, (user as any)?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-primary-foreground">
                          {(user as any)?.firstName && (user as any)?.lastName 
                            ? `${(user as any)?.firstName} ${(user as any)?.lastName}`
                            : (user as any)?.email?.split('@')[0] || 'User'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(user as any)?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link href="/profile/edit">
                    <span 
                      className="block px-3 py-2 rounded-md text-base font-medium text-primary-foreground hover:text-secondary hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid="mobile-nav-edit-profile"
                    >
                      <Settings className="inline mr-2 h-4 w-4" />
                      Edit Profile
                    </span>
                  </Link>
                  <button 
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-foreground hover:text-secondary hover:bg-accent transition-colors"
                    onClick={() => window.location.href = "/api/logout"}
                    data-testid="mobile-nav-logout"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}