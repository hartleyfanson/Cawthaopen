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
            <Link href="/statistics">
              <span 
                className={`transition-colors cursor-pointer ${
                  isActive("/statistics")
                    ? "text-secondary" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
                data-testid="nav-statistics"
              >
                Statistics
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/api/logout"}
                className="text-primary-foreground hover:bg-primary/20"
                data-testid="button-logout"
              >
                Logout
              </Button>
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
              <Link href="/statistics" onClick={() => setIsMobileMenuOpen(false)}>
                <span 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer ${
                    isActive("/statistics")
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-primary/50"
                  }`}
                >
                  Statistics
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
