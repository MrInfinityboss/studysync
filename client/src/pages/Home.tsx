import { useAuth } from "@/_core/hooks/useAuth";
import Dashboard from "./Dashboard";
import Landing from "./Landing";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f5faf8]"><div className="study-pulse size-12 rounded-full bg-[#0d7676]" /></div>;
  return isAuthenticated ? <Dashboard /> : <Landing />;
}
