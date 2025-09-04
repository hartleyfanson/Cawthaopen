import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, User, BarChart3, Settings } from "lucide-react";
import logoImage from "@assets/IMG_4006_1756925482771.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-primary/20" data-testid="dropdown-profile">
                    <img
                      src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                      data-testid="img-profile-avatar"
                    />
                    <span className="text-primary-foreground text-sm hidden sm:block">
                      {(user as any)?.firstName || 'User'} {(user as any)?.lastName || ''}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <img
                      src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {(user as any)?.firstName || 'User'} {(user as any)?.lastName || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(user as any)?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-edit-profile">
                      <User className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/achievements?tab=stats">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-view-statistics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Statistics & Achievements
                    </DropdownMenuItem>
                  </Link>
                  {(user as any)?.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer" data-testid="menu-admin-panel">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/api/logout"}
                    className="cursor-pointer text-red-600"
                    data-testid="menu-logout"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  window.location.href = "/api/logout";
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary-foreground hover:bg-primary/50 transition-colors"
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
