
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Allergy } from "@/types";
import { Loader2 } from "lucide-react";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    dietGoal: '',
    dietaryPreference: '',
    allergies: [] as Allergy[]
  });

  const allergiesList: Allergy[] = [
    'dairy', 'egg', 'gluten', 'grain', 'peanut', 
    'seafood', 'sesame', 'shellfish', 'soy', 
    'sulfite', 'tree_nut', 'wheat'
  ];

  // Check if profile exists and load existing data
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
          
        if (data) {
          // Load existing profile data
          setFormData({
            name: data.name || '',
            age: data.age ? String(data.age) : '',
            gender: data.gender || '',
            weight: data.weight ? String(data.weight) : '',
            height: data.height ? String(data.height) : '',
            dietGoal: data.diet_goal || '',
            dietaryPreference: data.dietary_preference || '',
            allergies: [] as Allergy[]
          });
          
          console.log("Loaded existing profile:", data);
          
          // Load allergies
          const { data: allergyData, error: allergyError } = await supabase
            .from('allergies')
            .select('allergy_type')
            .eq('user_id', user.id);
            
          if (!allergyError && allergyData) {
            const userAllergies = allergyData.map(item => item.allergy_type as Allergy);
            setFormData(prev => ({
              ...prev,
              allergies: userAllergies
            }));
            console.log("Loaded allergies:", userAllergies);
          }
        } else {
          // Create initial profile
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || ''
            });
            
          console.log("Created initial profile");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        toast({
          title: "Error",
          description: "Could not load your profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkProfile();
  }, [user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaveSuccess(false);
    setLoading(true);
    try {
      console.log("Saving profile data for user:", user.id);
      console.log("Form data to save:", formData);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          diet_goal: formData.dietGoal,
          dietary_preference: formData.dietaryPreference,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }
      
      console.log("Profile updated successfully");

      // Handle allergies - first delete existing
      const { error: deleteAllergyError } = await supabase
        .from('allergies')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteAllergyError) {
        console.error("Error deleting old allergies:", deleteAllergyError);
      }

      // Insert new allergies if selected
      if (formData.allergies.length > 0) {
        // Using Promise.all to handle potential errors better
        const allergyInserts = formData.allergies.map(allergy => 
          supabase
            .from('allergies')
            .insert({
              user_id: user.id,
              allergy_type: allergy
            })
        );

        const results = await Promise.all(allergyInserts);
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          console.error("Some allergies could not be saved:", errors);
          // We continue execution even if some allergies failed to save
        } else {
          console.log("Allergies saved:", formData.allergies);
        }
      }

      setSaveSuccess(true);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully set up!"
      });

      // Set redirecting state to prevent useEffect from redirecting back
      setRedirecting(true);
      
      // Add a small delay before navigation to ensure the toast is seen
      setTimeout(() => {
        console.log("Navigating to recipes page");
        navigate('/recipes', { replace: true });
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "There was an error updating your profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Set Up Your Profile</CardTitle>
          <CardDescription>
            Please provide your details to help us personalize your meal plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !redirecting ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Loading your profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <Label>Gender</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    required
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    required
                    step="0.1"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    required
                    step="0.1"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="dietGoal">Diet Goal</Label>
                  <Select
                    value={formData.dietGoal}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dietGoal: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your diet goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose">Lose Weight</SelectItem>
                      <SelectItem value="maintain">Maintain Weight</SelectItem>
                      <SelectItem value="gain">Gain Weight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dietaryPreference">Dietary Preference</Label>
                  <Select
                    value={formData.dietaryPreference}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dietaryPreference: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your dietary preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Allergies</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {allergiesList.map((allergy) => (
                      <div key={allergy} className="flex items-center space-x-2">
                        <Checkbox
                          id={allergy}
                          checked={formData.allergies.includes(allergy)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              allergies: checked
                                ? [...prev.allergies, allergy]
                                : prev.allergies.filter(a => a !== allergy)
                            }));
                          }}
                        />
                        <Label htmlFor={allergy} className="capitalize">
                          {allergy.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || redirecting}
              >
                {loading ? "Saving..." : redirecting ? "Redirecting..." : saveSuccess ? "Saved!" : "Save Profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
