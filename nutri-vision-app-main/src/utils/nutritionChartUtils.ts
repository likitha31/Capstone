
// Helper functions for nutrition chart visualization

/**
 * Formats nutrition data for visual charts
 * @param nutrition The nutrition data to format
 * @returns Formatted data for charts
 */
export const formatNutritionForCharts = (
  nutrition: { 
    calories?: number, 
    protein?: number, 
    carbs?: number, 
    fat?: number 
  } | undefined
) => {
  if (!nutrition) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }
  
  return {
    calories: Math.round(nutrition.calories || 0),
    protein: Math.round(nutrition.protein || 0),
    carbs: Math.round(nutrition.carbs || 0),
    fat: Math.round(nutrition.fat || 0)
  };
};

/**
 * Creates weekly data structure for nutrition charts
 * @param mealPlans The meal plans to calculate from
 * @param savedRecipes Saved recipes for nutrition info
 * @param fullDayNames Use full day names or abbreviations
 * @returns Formatted weekly data array for charts
 */
export const createWeeklyNutritionData = (
  mealPlans: any[],
  savedRecipes: any[] = [],
  fullDayNames = false
) => {
  console.log("Creating weekly nutrition data from:", mealPlans.length, "meal plans and", savedRecipes.length, "saved recipes");

  const days = fullDayNames 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
  const fullDaysMap = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
  };
  
  return days.map((day, index) => {
    const fullDay = fullDayNames ? day : fullDaysMap[day as keyof typeof fullDaysMap];
    const dayMeals = mealPlans.filter(meal => meal.day === fullDay);
    
    // Calculate nutrition totals for the day
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    
    if (dayMeals.length > 0) {
      dayMeals.forEach(meal => {
        // First check if the meal plan has nutrition info
        if (meal.nutritionInfo) {
          calories += meal.nutritionInfo.calories || 0;
          protein += meal.nutritionInfo.protein || 0;
          carbs += meal.nutritionInfo.carbs || 0;
          fat += meal.nutritionInfo.fat || 0;
        } else {
          // If not, find matching saved recipe to get nutrition data
          const matchingSavedRecipe = savedRecipes.find(recipe => recipe.id === meal.recipeId);
          
          if (matchingSavedRecipe?.nutrition) {
            calories += matchingSavedRecipe.nutrition.calories || 0;
            protein += matchingSavedRecipe.nutrition.protein || 0;
            carbs += matchingSavedRecipe.nutrition.carbs || 0;
            fat += matchingSavedRecipe.nutrition.fat || 0;
          }
        }
      });

      console.log(`${fullDay}: Calculated from meal plans - calories: ${calories}, protein: ${protein}, carbs: ${carbs}, fat: ${fat}`);

      return {
        name: day,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat)
      };
    }
    
    // Use fallback data if no meals for the day
    return {
      name: day,
      calories: index === 0 ? 1950 : 
               index === 1 ? 1860 : 
               index === 2 ? 2100 : 
               index === 3 ? 1750 : 
               index === 4 ? 2050 : 
               index === 5 ? 2200 : 1850,
      protein: index === 0 ? 90 : 
              index === 1 ? 95 : 
              index === 2 ? 100 : 
              index === 3 ? 85 : 
              index === 4 ? 98 : 
              index === 5 ? 105 : 85,
      carbs: index === 0 ? 220 : 
            index === 1 ? 200 : 
            index === 2 ? 240 : 
            index === 3 ? 190 : 
            index === 4 ? 230 : 
            index === 5 ? 250 : 210,
      fat: index === 0 ? 60 : 
          index === 1 ? 55 : 
          index === 2 ? 70 : 
          index === 3 ? 58 : 
          index === 4 ? 65 : 
          index === 5 ? 72 : 65
    };
  });
};
