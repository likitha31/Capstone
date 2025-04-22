
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Updated navLinks array to include Restaurant Finder
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Profile", href: "/profile" },
    { name: "Recipes", href: "/recipes" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Restaurants", href: "/restaurants" },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out."
        });
        // Force navigation to auth page after sign out
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="w-full bg-white border-b py-4">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-nutri-green to-nutri-blue-light flex items-center justify-center">
            <span className="text-white font-bold text-sm">NV</span>
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-nutri-green to-nutri-blue">
            Nutri-Vision
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-gray-600 hover:text-nutri-green transition-colors"
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <Button 
              className="bg-nutri-green hover:bg-nutri-green/90 text-white"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          ) : (
            <Button 
              className="bg-nutri-green hover:bg-nutri-green/90 text-white"
              onClick={() => {}}
              asChild
            >
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-gray-600 hover:text-nutri-green transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <Button 
                  className="bg-nutri-green hover:bg-nutri-green/90 text-white mt-4"
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                >
                  Sign Out
                </Button>
              ) : (
                <Link 
                  to="/auth" 
                  className="bg-nutri-green hover:bg-nutri-green/90 text-white py-2 px-4 rounded mt-4 inline-block text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
