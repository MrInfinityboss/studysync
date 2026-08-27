import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import MySessions from "./pages/MySessions";
import Profile from "./pages/Profile";
import SessionDetail from "./pages/SessionDetail";
import SessionForm from "./pages/SessionForm";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/welcome" component={Landing} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/discover" component={Discover} />
    <Route path="/sessions/new" component={SessionForm} />
    <Route path="/sessions/:id/edit" component={SessionForm} />
    <Route path="/sessions/:id" component={SessionDetail} />
    <Route path="/my-sessions" component={MySessions} />
    <Route path="/profile" component={Profile} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="top-right" richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
