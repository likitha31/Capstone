
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { Allergy } from "@/types";
import { AlertCircle, User, Settings, ChefHat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { HealthGoalsCard } from "@/components/profile/HealthGoalsCard";
import { AllergiesCard } from "@/components/profile/AllergiesCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Profile validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
});

const Profile = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    weight: '',
    height: '',
    age: '',
    dietGoal: '',
    avatar: '',
    bio: '',
    preferredCuisines: [],
    activityLevel: ''
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileProgress, setProfileProgress] = useState(0);

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found in profile page, redirecting to auth");
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Calculate profile completion percentage
  useEffect(() => {
    if (!profileLoaded) return;
    
    let filledFields = 0;
    let totalFields = 8; // Total number of important profile fields
    
    if (profile.name) filledFields++;
    if (profile.email) filledFields++;
    if (profile.weight) filledFields++;
    if (profile.height) filledFields++;
    if (profile.age) filledFields++;
    if (profile.dietGoal) filledFields++;
    if (profile.bio) filledFields++;
    if (profile.activityLevel) filledFields++;
    
    const progress = Math.round((filledFields / totalFields) * 100);
    setProfileProgress(progress);
  }, [profile, profileLoaded]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || profileLoaded) return;

      try {
        console.log("Fetching profile for user:", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Could not fetch profile: " + error.message,
            variant: "destructive"
          });
        } else if (data) {
          setProfile({
            name: data.name || '',
            email: data.email || user.email || '',
            weight: data.weight ? String(data.weight) : '',
            height: data.height ? String(data.height) : '',
            age: data.age ? String(data.age) : '',
            dietGoal: data.diet_goal || '',
            avatar: data.avatar || '',
            bio: data.bio || '',
            preferredCuisines: data.preferred_cuisines || [],
            activityLevel: data.activity_level || ''
          });
          
          const { data: allergiesData, error: allergiesError } = await supabase
            .from('allergies')
            .select('allergy_type')
            .eq('user_id', user.id);
            
          if (!allergiesError && allergiesData) {
            const userAllergies = allergiesData.map(item => item.allergy_type as Allergy);
            setAllergies(userAllergies);
          }
          
          setProfileLoaded(true);
        } else {
          setProfile({
            name: '',
            email: user.email || '',
            weight: '',
            height: '',
            age: '',
            dietGoal: '',
            avatar: '',
            bio: '',
            preferredCuisines: [],
            activityLevel: ''
          });
          await createProfile();
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Exception fetching profile:", err);
      }
    };

    fetchProfile();
  }, [user, profileLoaded, toast]);

  const createProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: '',
        });

      if (error) {
        console.error("Error creating profile:", error);
        toast({
          title: "Error",
          description: "Could not create profile: " + error.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Exception creating profile:", err);
    }
  };

  const updateProfile = async () => {
    // Validate profile
    try {
      profileSchema.parse(profile);
      setErrors({});
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMap = validationError.flatten().fieldErrors;
        setErrors({
          name: errorMap.name?.[0],
          email: errorMap.email?.[0]
        });
        setIsSubmitting(false);
        return;
      }
    }

    if (!user) return;
    
    setIsSubmitting(true);
    setServerError(null);
    
    console.log("Updating profile for user:", user.id);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          email: profile.email || user.email,
          weight: profile.weight ? parseFloat(profile.weight) : null,
          height: profile.height ? parseFloat(profile.height) : null,
          age: profile.age ? parseInt(profile.age) : null,
          diet_goal: profile.dietGoal,
          avatar: profile.avatar,
          bio: profile.bio,
          preferred_cuisines: profile.preferredCuisines,
          activity_level: profile.activityLevel
        });

      setIsSubmitting(false);

      if (error) {
        console.error("Error updating profile:", error);
        if (error.message.includes("row-level security")) {
          setServerError("Permission denied: Please ensure you're logged in and have the correct permissions.");
        } else {
          setServerError(error.message);
        }
        
        toast({
          title: "Error",
          description: "Could not update profile: " + error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated"
        });
      }
    } catch (err) {
      console.error("Exception updating profile:", err);
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    // Check if profile exists first, then either create or update
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking profile:", error);
        setServerError(error.message);
        return;
      }
      
      if (data) {
        updateProfile();
      } else {
        createProfile();
      }
    } catch (err) {
      console.error("Exception checking profile:", err);
    }
  };

  const getActivityLevelLabel = (level: string) => {
    switch (level) {
      case 'sedentary': return 'Sedentary (little or no exercise)';
      case 'light': return 'Light (exercise 1-3 times/week)';
      case 'moderate': return 'Moderate (exercise 3-5 times/week)';
      case 'active': return 'Active (daily exercise or intense exercise 3-4 times/week)';
      case 'very_active': return 'Very Active (intense exercise 6-7 times/week)';
      default: return 'Not specified';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded w-[200px]"></div>
              <div className="h-40 bg-gray-200 rounded w-[600px] max-w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-[150px]"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={profile.name || "User"} />
              ) : (
                <AvatarFallback className="bg-nutri-green text-white text-2xl">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : <User />}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{profile.name || "Welcome!"}</h1>
            <p className="text-gray-600 mb-4 max-w-2xl">
              {profile.bio || "Complete your profile to get personalized recipe recommendations."}
            </p>
            
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm font-medium">{profileProgress}%</span>
              </div>
              <Progress value={profileProgress} className="h-2" />
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Profile Info</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span>Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="allergies" className="flex items-center gap-1">
                <ChefHat className="h-4 w-4" />
                <span>Allergies</span>
              </TabsTrigger>
            </TabsList>
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSubmitting}
              className="bg-nutri-green hover:bg-nutri-green/90"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {serverError && (
            <div className="flex p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              {serverError}
            </div>
          )}

          <TabsContent value="profile" className="space-y-6">
            <PersonalInfoCard
              name={profile.name}
              email={profile.email}
              onNameChange={(value) => setProfile({ ...profile, name: value })}
              nameError={errors.name}
            />
            <HealthGoalsCard
              weight={profile.weight}
              height={profile.height}
              age={profile.age}
              dietGoal={profile.dietGoal}
              onWeightChange={(value) => setProfile({ ...profile, weight: value })}
              onHeightChange={(value) => setProfile({ ...profile, height: value })}
              onAgeChange={(value) => setProfile({ ...profile, age: value })}
              onDietGoalChange={(value) => setProfile({ ...profile, dietGoal: value })}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>About You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                  <textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us a bit about yourself..."
                    className="min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="activityLevel" className="text-sm font-medium">Activity Level</label>
                  <select
                    id="activityLevel"
                    value={profile.activityLevel}
                    onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select your activity level</option>
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="light">Light (exercise 1-3 times/week)</option>
                    <option value="moderate">Moderate (exercise 3-5 times/week)</option>
                    <option value="active">Active (daily exercise or intense exercise 3-4 times/week)</option>
                    <option value="very_active">Very Active (intense exercise 6-7 times/week)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Culinary Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Preferred Cuisines</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Indian', 'French', 'Middle Eastern', 'Greek'].map(cuisine => (
                      <div key={cuisine} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`cuisine-${cuisine}`}
                          checked={profile.preferredCuisines.includes(cuisine)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfile({
                                ...profile,
                                preferredCuisines: [...profile.preferredCuisines, cuisine]
                              });
                            } else {
                              setProfile({
                                ...profile,
                                preferredCuisines: profile.preferredCuisines.filter(c => c !== cuisine)
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`cuisine-${cuisine}`} className="text-sm">{cuisine}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Meal Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">These preferences will help us suggest recipes that match your taste and dietary needs.</p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Meal Size</h3>
                    <div className="space-y-2">
                      {['Small portions', 'Medium portions', 'Large portions'].map(size => (
                        <div key={size} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`size-${size}`}
                            name="mealSize"
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`size-${size}`} className="text-sm">{size}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Cooking Experience</h3>
                    <div className="space-y-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                        <div key={level} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`cooking-${level}`}
                            name="cookingLevel"
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`cooking-${level}`} className="text-sm">{level}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergies">
            <AllergiesCard allergies={allergies} setAllergies={setAllergies} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
