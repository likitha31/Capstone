
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, Plus } from 'lucide-react';
import { useRecipeSuggestions } from '@/hooks/useRecipeSuggestions';
import { Recipe, MealType } from '@/types';
import RecipeCard from './RecipeCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RecipeSearch = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<MealType | undefined>(undefined);
  const { getSuggestedRecipes, loading } = useRecipeSuggestions();
  const { toast } = useToast();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleAddIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim().toLowerCase())) {
      setIngredients([...ingredients, inputValue.trim().toLowerCase()]);
      setInputValue('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleSearch = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "No ingredients",
        description: "Please add at least one ingredient to search for recipes",
        variant: "destructive"
      });
      return;
    }

    try {
      // Pass the selected meal type to get better recommendations
      const results = await getSuggestedRecipes(ingredients, selectedMealType);
      setRecipes(results);
      
      if (results.length === 0) {
        toast({
          title: "No recipes found",
          description: "Try adding different ingredients or removing some constraints",
        });
      } else {
        toast({
          title: "Smart recommendations ready",
          description: `Found ${results.length} recipes optimized for your ${userProfile?.diet_goal || 'dietary'} goals`,
        });
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      toast({
        title: "Error",
        description: "Failed to search for recipes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getHealthyRecipeMessage = () => {
    if (!userProfile) return '';
    
    const dietGoal = userProfile.dietGoal || userProfile.diet_goal;
    
    if (dietGoal === 'lose') {
      return 'Looking for low-calorie, nutrient-dense recipes to support your weight loss goal.';
    } else if (dietGoal === 'gain') {
      return 'Finding protein-rich, calorie-dense recipes to support your weight gain goal.';
    } else {
      return 'Searching for balanced, nutritious recipes to maintain your healthy lifestyle.';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="secondary" className="text-sm py-1.5">
                  {ingredient}
                  <button 
                    onClick={() => handleRemoveIngredient(ingredient)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  placeholder="Enter an ingredient..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                {inputValue && (
                  <button
                    onClick={handleAddIngredient}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch} disabled={loading || ingredients.length === 0}>
                {loading ? 'Searching...' : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="w-full md:w-48">
                <Select 
                  value={selectedMealType} 
                  onValueChange={(value) => setSelectedMealType(value as MealType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Meal type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {userProfile && (
                <p className="text-sm text-gray-500 italic flex-1">
                  {getHealthyRecipeMessage()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeSearch;
