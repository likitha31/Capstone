
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect when loading is complete and there's no user
    if (!loading && !user) {
      console.log("No user found in protected route, redirecting to auth");
      // Store the path they were trying to access
      navigate("/auth", { replace: true, state: { from: location.pathname } });
    }
  }, [user, loading, navigate, location.pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-32 w-full max-w-md mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }
  
  // Only render the protected content if we have a user
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
