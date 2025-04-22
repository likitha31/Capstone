
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useLocation, useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/auth';
  const isProfileSetupPage = location.pathname === '/profile-setup';

  const checkProfileComplete = async (userId: string) => {
    try {
      console.log("Checking profile completion for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, age, gender, weight, height, diet_goal, dietary_preference')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        return false;
      }

      console.log("Profile data:", data);
      
      // Check if all required fields are filled
      const isComplete = Boolean(
        data && 
        data.name && 
        data.age && 
        data.gender && 
        data.weight && 
        data.height && 
        data.diet_goal && 
        data.dietary_preference
      );
      
      console.log("Profile complete?", isComplete);
      return isComplete;
    } catch (err) {
      console.error("Error in profile check:", err);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // First set up the auth listener to avoid race conditions
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? "session exists" : "no session");
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("User signed in or token refreshed, current path:", location.pathname);
          
          if (session?.user) {
            // Don't redirect to profile-setup if user has a complete profile
            // or if they're already on the setup page
            setTimeout(async () => {
              if (!mounted) return;
              
              try {
                const isComplete = await checkProfileComplete(session.user.id);
                
                if (!isComplete && !isProfileSetupPage) {
                  console.log("Profile incomplete, redirecting to profile setup");
                  navigate('/profile-setup', { replace: true });
                } else if (isComplete && isAuthPage) {
                  console.log("Profile complete, redirecting from auth to recipes");
                  navigate('/recipes', { replace: true });
                }
              } catch (error) {
                console.error("Error during post-login profile check:", error);
              }
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          // Make sure we navigate to auth page on sign out, unless we're already there
          if (!isAuthPage) {
            navigate('/auth', { replace: true });
          }
        }
      }
    );

    // Then check for current session
    const checkUser = async () => {
      try {
        console.log("Checking current session...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session check:", session ? "exists" : "none");
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user || null);

        // Only check profile completion after we have session data
        if (session?.user) {
          // Check profile completion in a setTimeout to avoid deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const isComplete = await checkProfileComplete(session.user.id);
              
              if (!isComplete && !isProfileSetupPage && !isAuthPage) {
                console.log("Profile incomplete, redirecting to profile setup");
                navigate('/profile-setup', { replace: true });
              } else if (isComplete && isProfileSetupPage) {
                console.log("Profile complete, redirecting from setup to recipes");
                navigate('/recipes', { replace: true });
              }
            } catch (error) {
              console.error("Error during initial profile check:", error);
            }
            
            if (mounted) setLoading(false);
          }, 0);
        } else {
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    return () => {
      mounted = false;
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname, isAuthPage, isProfileSetupPage]);

  const signUp = async (email: string, password: string) => {
    console.log("Sign up initiated for:", email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log("Sign up result:", data ? "success" : "failed", error ? error.message : "no error");
      return { data, error };
    } catch (error: any) {
      console.error("Unexpected error during signup:", error);
      return { data: null, error: new Error(error?.message || 'An unexpected error occurred during signup') };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("Sign in initiated for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Sign in result:", data ? "success" : "failed", error ? error.message : "no error");
      return { data, error };
    } catch (error: any) {
      console.error("Unexpected error during signin:", error);
      return { data: null, error: new Error(error?.message || 'An unexpected error occurred during sign in') };
    }
  };

  const signOut = async () => {
    console.log("Sign out initiated");
    try {
      // Clear user and session state before the actual sign out
      // to prevent redirect loops
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error);
      }
      return { error };
    } catch (error: any) {
      console.error("Unexpected error during signout:", error);
      return { error: new Error(error?.message || 'An unexpected error occurred during sign out') };
    }
  };

  return { user, session, loading, signUp, signIn, signOut };
}
