import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { SavedRecipe } from "@/types";
import { MealType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowRight, Trash2 } from "lucide-react";
import type { MealPlan } from "@/types/supabase";

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type DayOfWeek = typeof DAYS_OF_WEEK[number];

const MealPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
    return DAYS_OF_WEEK.includes(today) ? today : 'Monday';
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSavedRecipes = () => {
      const saved = localStorage.getItem("savedRecipes");
      if (saved) {
        setSavedRecipes(JSON.parse(saved));
      }
    };
    
    fetchSavedRecipes();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "savedRecipes") {
        fetchSavedRecipes();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMealPlans();
    }
  }, [user]);

  const fetchMealPlans = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const typedMealPlans: MealPlan[] = data.map(item => {
          const savedRecipe = savedRecipes.find(recipe => recipe.id === item.recipe_id);
          
          return {
            id: item.id,
            userId: item.user_id,
            day: item.day as any,
            mealType: item.meal_type as any,
            recipeId: item.recipe_id,
            recipeTitle: item.recipe_title,
            recipeImage: item.recipe_image,
            nutritionInfo: savedRecipe?.nutrition,
            createdAt: item.created_at
          };
        });
        
        setMealPlans(typedMealPlans);
      }
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      toast({
        title: "Error",
        description: "Could not fetch your meal plans",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && mealPlans.length > 0 && savedRecipes.length > 0) {
      const updatedMealPlans = mealPlans.map(meal => {
        const savedRecipe = savedRecipes.find(recipe => recipe.id === meal.recipeId);
        return {
          ...meal,
          nutritionInfo: savedRecipe?.nutrition
        };
      });
      
      setMealPlans(updatedMealPlans);
    }
  }, [savedRecipes, user, mealPlans.length]);

  const handleAddMeal = async (recipe: SavedRecipe, day: DayOfWeek, mealType: MealType) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add meals to your plan",
        variant: "destructive"
      });
      return;
    }

    const existingMeal = mealPlans.find(
      meal => meal.day === day && meal.mealType === mealType
    );

    try {
      if (existingMeal) {
        const { error } = await supabase
          .from('meal_plans')
          .update({
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            recipe_image: recipe.image,
          })
          .eq('id', existingMeal.id);
          
        if (error) throw error;

        setMealPlans(mealPlans.map(meal => 
          meal.id === existingMeal.id 
            ? { 
                ...meal, 
                recipeId: recipe.id, 
                recipeTitle: recipe.title, 
                recipeImage: recipe.image,
                nutritionInfo: recipe.nutrition
              } 
            : meal
        ));
      } 
      else {
        const { data, error } = await supabase
          .from('meal_plans')
          .insert({
            user_id: user.id,
            day: day,
            meal_type: mealType,
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            recipe_image: recipe.image,
          })
          .select();
          
        if (error) throw error;
        
        if (data?.[0]) {
          const newMealPlan: MealPlan = {
            id: data[0].id,
            userId: user.id,
            day: day as any,
            mealType: mealType,
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            recipeImage: recipe.image,
            nutritionInfo: recipe.nutrition,
            createdAt: data[0].created_at
          };
          
          setMealPlans([...mealPlans, newMealPlan]);
        }
      }
      
      toast({
        title: "Success",
        description: `${recipe.title} added to your ${day} ${mealType} plan`,
      });
      
      fetchMealPlans();
    } catch (error) {
      console.error("Error saving meal plan:", error);
      toast({
        title: "Error",
        description: "Could not save your meal plan",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealId);
        
      if (error) throw error;
      
      setMealPlans(mealPlans.filter(meal => meal.id !== mealId));
      
      toast({
        title: "Success",
        description: "Meal removed from your plan",
      });
    } catch (error) {
      console.error("Error removing meal plan:", error);
      toast({
        title: "Error",
        description: "Could not remove meal from your plan",
        variant: "destructive"
      });
    }
  };

  const dayMeals = mealPlans.filter(meal => meal.day === activeDay);
  
  const breakfast = dayMeals.find(meal => meal.mealType === 'breakfast');
  const lunch = dayMeals.find(meal => meal.mealType === 'lunch');  
  const dinner = dayMeals.find(meal => meal.mealType === 'dinner');
  const snack = dayMeals.find(meal => meal.mealType === 'snack');

  const calculateDailyNutrition = () => {
    return dayMeals.reduce((totals, meal) => {
      const nutrition = meal.nutritionInfo || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      
      return {
        calories: totals.calories + (nutrition.calories || 0),
        protein: totals.protein + (nutrition.protein || 0),
        carbs: totals.carbs + (nutrition.carbs || 0),
        fat: totals.fat + (nutrition.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };
  
  const dailyNutrition = calculateDailyNutrition();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Weekly Meal Planner</h2>
        
        <div className="bg-gray-100 p-2 rounded-lg flex flex-col md:flex-row items-center gap-2 md:gap-6">
          <div className="text-sm text-gray-500">Daily Totals:</div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Calories</span>
              <Badge variant="outline" className="bg-nutri-green-light/20">
                {Math.round(dailyNutrition.calories)}
              </Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Protein</span>
              <Badge variant="outline" className="bg-nutri-green/20">
                {Math.round(dailyNutrition.protein)}g
              </Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Carbs</span>
              <Badge variant="outline" className="bg-nutri-blue-light/20">
                {Math.round(dailyNutrition.carbs)}g
              </Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Fat</span>
              <Badge variant="outline" className="bg-amber-200/40">
                {Math.round(dailyNutrition.fat)}g
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue={activeDay} value={activeDay} onValueChange={(value) => setActiveDay(value as DayOfWeek)}>
        <TabsList className="mb-6 flex overflow-auto pb-px">
          {DAYS_OF_WEEK.map((day) => (
            <TabsTrigger key={day} value={day}>
              <span className="md:block hidden">{day}</span>
              <span className="block md:hidden">{day.substring(0, 3)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS_OF_WEEK.map((day) => (
          <TabsContent key={day} value={day}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden border-t-4 border-t-amber-300">
                <CardHeader className="bg-amber-50/50">
                  <CardTitle className="flex justify-between items-center">
                    <span>Breakfast</span>
                    {breakfast?.nutritionInfo && (
                      <span className="text-sm font-normal text-gray-500">
                        {Math.round(breakfast.nutritionInfo.calories)} cal
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {breakfast ? (
                    <div className="flex flex-col">
                      <div className="flex items-start space-x-4 mb-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={breakfast.recipeImage} 
                            alt={breakfast.recipeTitle} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-1">{breakfast.recipeTitle}</h4>
                          {breakfast.nutritionInfo && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Protein:</span>
                                <span className="font-medium">{Math.round(breakfast.nutritionInfo.protein)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Carbs:</span>
                                <span className="font-medium">{Math.round(breakfast.nutritionInfo.carbs)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Fat:</span>
                                <span className="font-medium">{Math.round(breakfast.nutritionInfo.fat)}g</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleRemoveMeal(breakfast.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => {
                      const recipe = savedRecipes.find(r => r.id === parseInt(value));
                      if (recipe) {
                        handleAddMeal(recipe, day, 'breakfast');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add breakfast" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedRecipes
                          .filter(recipe => recipe.mealType === 'breakfast')
                          .map(recipe => (
                            <SelectItem key={recipe.id} value={recipe.id.toString()}>
                              {recipe.title}
                            </SelectItem>
                          ))}
                        {savedRecipes.filter(recipe => recipe.mealType === 'breakfast').length === 0 && (
                          <SelectItem value="no-breakfast-recipes" disabled>
                            No breakfast recipes saved
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-t-4 border-t-blue-300">
                <CardHeader className="bg-blue-50/50">
                  <CardTitle className="flex justify-between items-center">
                    <span>Lunch</span>
                    {lunch?.nutritionInfo && (
                      <span className="text-sm font-normal text-gray-500">
                        {Math.round(lunch.nutritionInfo.calories)} cal
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {lunch ? (
                    <div className="flex flex-col">
                      <div className="flex items-start space-x-4 mb-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={lunch.recipeImage} 
                            alt={lunch.recipeTitle} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-1">{lunch.recipeTitle}</h4>
                          {lunch.nutritionInfo && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Protein:</span>
                                <span className="font-medium">{Math.round(lunch.nutritionInfo.protein)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Carbs:</span>
                                <span className="font-medium">{Math.round(lunch.nutritionInfo.carbs)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Fat:</span>
                                <span className="font-medium">{Math.round(lunch.nutritionInfo.fat)}g</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleRemoveMeal(lunch.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => {
                      const recipe = savedRecipes.find(r => r.id === parseInt(value));
                      if (recipe) {
                        handleAddMeal(recipe, day, 'lunch');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add lunch" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedRecipes
                          .filter(recipe => recipe.mealType === 'lunch')
                          .map(recipe => (
                            <SelectItem key={recipe.id} value={recipe.id.toString()}>
                              {recipe.title}
                            </SelectItem>
                          ))}
                        {savedRecipes.filter(recipe => recipe.mealType === 'lunch').length === 0 && (
                          <SelectItem value="no-lunch-recipes" disabled>
                            No lunch recipes saved
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-t-4 border-t-purple-300">
                <CardHeader className="bg-purple-50/50">
                  <CardTitle className="flex justify-between items-center">
                    <span>Dinner</span>
                    {dinner?.nutritionInfo && (
                      <span className="text-sm font-normal text-gray-500">
                        {Math.round(dinner.nutritionInfo.calories)} cal
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {dinner ? (
                    <div className="flex flex-col">
                      <div className="flex items-start space-x-4 mb-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={dinner.recipeImage} 
                            alt={dinner.recipeTitle} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-1">{dinner.recipeTitle}</h4>
                          {dinner.nutritionInfo && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Protein:</span>
                                <span className="font-medium">{Math.round(dinner.nutritionInfo.protein)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Carbs:</span>
                                <span className="font-medium">{Math.round(dinner.nutritionInfo.carbs)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Fat:</span>
                                <span className="font-medium">{Math.round(dinner.nutritionInfo.fat)}g</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleRemoveMeal(dinner.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => {
                      const recipe = savedRecipes.find(r => r.id === parseInt(value));
                      if (recipe) {
                        handleAddMeal(recipe, day, 'dinner');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add dinner" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedRecipes
                          .filter(recipe => recipe.mealType === 'dinner')
                          .map(recipe => (
                            <SelectItem key={recipe.id} value={recipe.id.toString()}>
                              {recipe.title}
                            </SelectItem>
                          ))}
                        {savedRecipes.filter(recipe => recipe.mealType === 'dinner').length === 0 && (
                          <SelectItem value="no-dinner-recipes" disabled>
                            No dinner recipes saved
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-t-4 border-t-green-300">
                <CardHeader className="bg-green-50/50">
                  <CardTitle className="flex justify-between items-center">
                    <span>Snack</span>
                    {snack?.nutritionInfo && (
                      <span className="text-sm font-normal text-gray-500">
                        {Math.round(snack.nutritionInfo.calories)} cal
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {snack ? (
                    <div className="flex flex-col">
                      <div className="flex items-start space-x-4 mb-3">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={snack.recipeImage} 
                            alt={snack.recipeTitle} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-1">{snack.recipeTitle}</h4>
                          {snack.nutritionInfo && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Protein:</span>
                                <span className="font-medium">{Math.round(snack.nutritionInfo.protein)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Carbs:</span>
                                <span className="font-medium">{Math.round(snack.nutritionInfo.carbs)}g</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="w-12">Fat:</span>
                                <span className="font-medium">{Math.round(snack.nutritionInfo.fat)}g</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleRemoveMeal(snack.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => {
                      const recipe = savedRecipes.find(r => r.id === parseInt(value));
                      if (recipe) {
                        handleAddMeal(recipe, day, 'snack');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add snack" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedRecipes
                          .filter(recipe => recipe.mealType === 'snack')
                          .map(recipe => (
                            <SelectItem key={recipe.id} value={recipe.id.toString()}>
                              {recipe.title}
                            </SelectItem>
                          ))}
                        {savedRecipes.filter(recipe => recipe.mealType === 'snack').length === 0 && (
                          <SelectItem value="no-snack-recipes" disabled>
                            No snack recipes saved
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MealPlanner;
