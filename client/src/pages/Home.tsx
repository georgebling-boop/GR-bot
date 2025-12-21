import { useAuth } from "@/_core/hooks/useAuth";
import Dashboard from "./Dashboard";

/**
 * Home page - Redirects to the main Dashboard
 */
export default function Home() {
  // The useAuth hook provides authentication state
  const { user, loading, isAuthenticated } = useAuth();

  // Show dashboard regardless of auth state (can be modified later if needed)
  return <Dashboard />;
}
