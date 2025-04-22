
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (user) {
      navigate("/recipes", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    setError("");
    console.log(`Attempting to ${isSignUp ? 'sign up' : 'sign in'} with email: ${email}`);

    try {
      const result = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      console.log("Auth result:", result);
      
      if (result.error) {
        console.error("Auth error:", result.error);
        
        // Special handling for "user already exists" error
        if (isSignUp && result.error.message === "User already registered") {
          setError("This email is already registered. Try logging in instead.");
          setIsSignUp(false); // Switch to login mode
        } else {
          // Handle other errors
          setError(result.error.message);
        }
        
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive"
        });
        setIsLoading(false);
      } else {
        toast({
          title: isSignUp ? "Account Created" : "Logged In",
          description: isSignUp 
            ? "Your account has been created successfully" 
            : "Welcome back!"
        });
        console.log("Authentication successful, waiting for redirection");
        
        // Don't rely solely on auth listener - actively navigate
        navigate("/recipes", { replace: true });
        
        // Add safety timeout
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isSignUp ? "Create an Account" : "Login"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Email</label>
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Password</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full"
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isSignUp && "Password must be at least 6 characters"}
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-nutri-green hover:bg-nutri-green/90"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : (isSignUp ? "Sign Up" : "Login")}
            </Button>
            
            {isLoading && (
              <div className="text-center text-sm text-gray-500 mt-2">
                Please wait, this may take a moment...
              </div>
            )}
            
            <div className="text-center mt-4">
              <Button 
                variant="link" 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                disabled={isLoading}
                className="text-nutri-green"
              >
                {isSignUp 
                  ? "Already have an account? Login" 
                  : "Don't have an account? Sign Up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
