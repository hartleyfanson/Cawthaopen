import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoImage from "@assets/IMG_4006_1756925482771.png";

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
              <a 
                className={`transition-colors ${
                  isActive("/") && location === "/"
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </a>
            </Link>
            <Link href="/tournaments/history">
              <a 
                className={`transition-colors ${
                  isActive("/tournaments/history")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-tournaments"
              >
                Tournament History
              </a>
            </Link>
            <Link href="/tournaments/create">
              <a 
                className={`transition-colors ${
                  isActive("/tournaments/create")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-create"
              >
                Create Tournament
              </a>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <img
                  src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-profile-avatar"
                />
                <span className="text-primary-foreground text-sm hidden sm:block">
                  {(user as any)?.firstName || 'User'} {(user as any)?.lastName || ''}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              className="hidden md:block border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
              data-testid="button-logout"
            >
              Logout
            </Button>
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
              <Link href="/">
                <a 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/") && location === "/"
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
              </Link>
              <Link href="/tournaments/history">
                <a 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/tournaments/history")
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tournament History
                </a>
              </Link>
              <Link href="/tournaments/create">
                <a 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/tournaments/create")
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Tournament
                </a>
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
