
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavedRecipe, MealType } from "@/types";
import { MealPlan } from "@/types/supabase";

interface MealPlannerDayProps {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  mealPlans: MealPlan[];
  savedRecipes: SavedRecipe[];
  onAddMeal: (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday', mealType: MealType) => void;
  onRemoveMeal: (mealPlanId: string) => void;
  onCaloriesUpdated?: (day: string, calories: number, macros: { protein: number, carbs: number, fat: number }) => void;
  isActive?: boolean;
}

const MealPlannerDay = ({
  day,
  mealPlans,
  savedRecipes,
  onAddMeal,
  onRemoveMeal,
  onCaloriesUpdated,
  isActive = false,
}: MealPlannerDayProps) => {
  const dayMeals = mealPlans.filter((meal) => meal.day === day);
  const [totalCalories, setTotalCalories] = useState(0);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  
  // Calculate total calories and macros for the day
  const calculateNutrition = () => {
    let totalCal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    dayMeals.forEach(meal => {
      const matchingSavedRecipe = savedRecipes.find(recipe => recipe.id === meal.recipeId);
      
      // Use the most up-to-date nutrition info
      const calories = matchingSavedRecipe?.nutrition?.calories || 
                      meal.nutritionInfo?.calories || 0;
      const protein = matchingSavedRecipe?.nutrition?.protein || 
                      meal.nutritionInfo?.protein || 0;
      const carbs = matchingSavedRecipe?.nutrition?.carbs || 
                    meal.nutritionInfo?.carbs || 0;
      const fat = matchingSavedRecipe?.nutrition?.fat || 
                  meal.nutritionInfo?.fat || 0;
      
      totalCal += calories;
      totalProtein += protein;
      totalCarbs += carbs;
      totalFat += fat;
    });

    return {
      calories: totalCal,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    };
  };
  
  // Update totals and notify parent component when meals or recipes change
  useEffect(() => {
    const nutrition = calculateNutrition();
    setTotalCalories(nutrition.calories);
    setMacros({
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat
    });
    
    // Notify parent component of updated nutrition values
    if (onCaloriesUpdated) {
      console.log(`Updating ${day} nutrition:`, nutrition);
      onCaloriesUpdated(day, nutrition.calories, {
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat
      });
    }
  }, [dayMeals, savedRecipes, day, onCaloriesUpdated]);
  
  const mealTypesList: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  
  return (
    <Card className={`premium-card transition-all duration-300 ${isActive ? "border-primary border-2" : "border-gray-100/50"}`}>
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex justify-between items-center">
          <span>{day}</span>
          <Badge variant="outline" className="premium-badge">
            {Math.round(totalCalories)} cal
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {mealTypesList.map((mealType) => {
            const meal = dayMeals.find((m) => m.mealType === mealType);
            
            // Find corresponding saved recipe to get most up-to-date nutrition info
            const matchingSavedRecipe = meal ? savedRecipes.find(
              recipe => recipe.id === meal.recipeId
            ) : null;
            
            // Use the nutrition info from saved recipe if available
            const calories = matchingSavedRecipe?.nutrition?.calories || 
                            meal?.nutritionInfo?.calories || 0;
                            
            return (
              <div key={mealType} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{mealType}</span>
                  {!meal && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => onAddMeal(day, mealType)}
                    >
                      Add
                    </Button>
                  )}
                </div>
                {meal ? (
                  <div className="bg-muted/30 rounded-lg p-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium truncate max-w-[150px]" title={meal.recipeTitle}>
                        {meal.recipeTitle}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onRemoveMeal(meal.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {calories > 0 ? `${Math.round(calories)} calories` : "Calories: N/A"}
                    </div>
                  </div>
                ) : (
                  <div className="h-[3.2rem] border border-dashed border-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No meal selected</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MealPlannerDay;
