
import { useState } from 'react';
import { Recipe, UserProfile, DietaryPreference, Allergy, MealType } from '@/types';
import { searchRecipesByIngredients } from '@/services/recipeService';
import { rankRecipesByRelevance } from '@/utils/recommenderEngine';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function useRecipeSuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getSuggestedRecipes = async (ingredients: string[], mealType?: MealType) => {
    setLoading(true);
    setError(null);
    console.log(`Getting suggestions for meal type: ${mealType || 'any'}`);

    try {
      // Fetch user profile for personalized suggestions
      let userProfile: UserProfile | null = null;
      
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!profileError && profileData) {
          // Map Supabase profile data to UserProfile type
          userProfile = {
            name: profileData.name || "",
            age: profileData.age || 0,
            weight: profileData.weight || 0,
            height: profileData.height || 0,
            gender: (profileData.gender as "male" | "female" | "other") || "other",
            dietGoal: (profileData.diet_goal as "lose" | "maintain" | "gain") || "maintain",
            dietaryPreference: (profileData.dietary_preference as DietaryPreference) || "none",
            allergies: [] as Allergy[],
            preferredCuisines: profileData.preferred_cuisines,
            activityLevel: profileData.activity_level as any
          };
          
          // Fetch allergies separately
          const { data: allergyData } = await supabase
            .from('allergies')
            .select('allergy_type')
            .eq('user_id', user.id);
            
          if (allergyData) {
            userProfile.allergies = allergyData.map(a => a.allergy_type) as Allergy[];
          }
        }
      }

      // Get recipes considering user preferences
      const recipes = await searchRecipesByIngredients(ingredients, userProfile);
      
      // Rank recipes using our recommendation engine
      const rankedRecipes = rankRecipesByRelevance(recipes, userProfile, ingredients, mealType);
      console.log(`Ranked ${rankedRecipes.length} recipes for ${mealType || 'any'} meal type`);
      
      return rankedRecipes;
    } catch (err) {
      setError('Failed to fetch recipe suggestions');
      console.error('Recipe suggestion error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    getSuggestedRecipes,
    loading,
    error
  };
}
