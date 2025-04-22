
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-gradient-to-r from-nutri-green-light to-nutri-blue-light rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">404</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          We couldn't find the page you were looking for. Let's get you back to discovering healthy recipes.
        </p>
        <Button asChild className="bg-nutri-green hover:bg-nutri-green/90">
          <Link to="/">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
