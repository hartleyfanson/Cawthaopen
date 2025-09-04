import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import TournamentLeaderboard from "@/pages/TournamentLeaderboard";
import LiveScoring from "@/pages/LiveScoring";
import TournamentHistory from "@/pages/TournamentHistory";
import Gallery from "@/pages/Gallery";
import CreateTournament from "@/pages/CreateTournament";
import Profile from "@/pages/Profile";
import PlayerProfile from "@/pages/PlayerProfile";
import Statistics from "@/pages/Statistics";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/tournaments/:id/leaderboard" component={TournamentLeaderboard} />
          <Route path="/tournaments/:id/scoring" component={LiveScoring} />
          <Route path="/tournaments" component={TournamentHistory} />
          <Route path="/tournaments/history" component={TournamentHistory} />
          <Route path="/tournaments/:id/gallery" component={Gallery} />
          <Route path="/tournaments/create" component={CreateTournament} />
          <Route path="/profile" component={Profile} />
          <Route path="/players/:playerId" component={PlayerProfile} />
          <Route path="/achievements" component={PlayerProfile} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/admin" component={Admin} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
