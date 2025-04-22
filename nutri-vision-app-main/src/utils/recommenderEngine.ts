
import { Recipe, UserProfile, MealType } from "@/types";

// Scoring weights for different factors
const WEIGHTS = {
  DIET_GOAL_MATCH: 3.0,  // Highest weight for matching diet goal
  NUTRITION_MATCH: 2.5,  // High weight for nutrition match
  CUISINE_MATCH: 2.0,    // Medium-high weight for cuisine preference
  INGREDIENT_MATCH: 1.5, // Medium weight for ingredient match
  DEFAULT_SCORE: 1.0,    // Base score
};

// Nutrition targets based on diet goals (simplified version)
const NUTRITION_TARGETS = {
  lose: {
    caloriesMax: 500,
    proteinRatio: 0.35, // Higher protein for satiety while losing weight
    carbsRatio: 0.35,   // Moderate carbs
    fatRatio: 0.3,      // Moderate fat
  },
  maintain: {
    caloriesMax: 700,
    proteinRatio: 0.3,  // Balanced macros for maintenance
    carbsRatio: 0.4,
    fatRatio: 0.3,
  },
  gain: {
    caloriesMax: 1000,  // No real upper limit, but prefer higher calories
    proteinRatio: 0.4,  // Higher protein for muscle building
    carbsRatio: 0.4,    // Higher carbs for energy surplus
    fatRatio: 0.2,      // Lower fat ratio
  }
};

// Target calories by meal type (percentage of daily intake)
const MEAL_TYPE_CALORIE_DISTRIBUTION = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10
};

/**
 * Calculate a nutrition score based on how well the recipe matches the user's diet goal
 */
export function calculateNutritionScore(recipe: Recipe, userProfile?: UserProfile | null, mealType?: MealType): number {
  // Base score
  let score = WEIGHTS.DEFAULT_SCORE;
  
  // Without nutrition info or user profile, we can't calculate a meaningful score
  if (!recipe.nutrition || !userProfile?.dietGoal) {
    return score;
  }

  const targets = NUTRITION_TARGETS[userProfile.dietGoal];
  const nutrition = recipe.nutrition;
  
  // Get target calories for this meal type if specified
  const targetCalories = mealType 
    ? targets.caloriesMax * MEAL_TYPE_CALORIE_DISTRIBUTION[mealType]
    : targets.caloriesMax;
  
  // Calculate calorie fit score
  // For weight loss: lower calories are better
  // For weight gain: higher calories (up to a point) are better
  // For maintenance: closer to target is better
  let calorieScore = 1.0;
  if (userProfile.dietGoal === 'lose') {
    // For weight loss, lower calories (but not too low) are better
    calorieScore = nutrition.calories <= targetCalories 
      ? WEIGHTS.DIET_GOAL_MATCH 
      : WEIGHTS.DIET_GOAL_MATCH * (targetCalories / nutrition.calories);
  } else if (userProfile.dietGoal === 'gain') {
    // For weight gain, higher calories (within a reasonable range) are better
    const minCalories = targetCalories * 0.8;
    calorieScore = nutrition.calories >= minCalories 
      ? WEIGHTS.DIET_GOAL_MATCH 
      : WEIGHTS.DIET_GOAL_MATCH * (nutrition.calories / minCalories);
  } else {
    // For maintenance, closer to target is better
    const deviation = Math.abs(nutrition.calories - targetCalories) / targetCalories;
    calorieScore = WEIGHTS.DIET_GOAL_MATCH * (1 - Math.min(deviation, 1));
  }
  
  // Calculate macronutrient balance score
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
  let macroScore = 1.0;
  
  if (totalMacros > 0) {
    const actualProteinRatio = nutrition.protein / totalMacros;
    const actualCarbsRatio = nutrition.carbs / totalMacros;
    const actualFatRatio = nutrition.fat / totalMacros;
    
    // How close are the macros to the target ratios? (lower is better)
    const proteinDiff = Math.abs(actualProteinRatio - targets.proteinRatio);
    const carbsDiff = Math.abs(actualCarbsRatio - targets.carbsRatio);
    const fatDiff = Math.abs(actualFatRatio - targets.fatRatio);
    
    // Average difference, inverted so that closer match = higher score
    const avgDiff = (proteinDiff + carbsDiff + fatDiff) / 3;
    macroScore = WEIGHTS.NUTRITION_MATCH * (1 - avgDiff);
  }
  
  // Calculate activity level adjustment
  let activityMultiplier = 1.0;
  if (userProfile.activityLevel) {
    switch (userProfile.activityLevel) {
      case 'sedentary':
        activityMultiplier = 0.9;
        break;
      case 'light':
        activityMultiplier = 1.0;
        break;
      case 'moderate':
        activityMultiplier = 1.1;
        break;
      case 'active':
        activityMultiplier = 1.2;
        break;
      case 'very_active':
        activityMultiplier = 1.3;
        break;
    }
  }
  
  // Combine scores
  score = (calorieScore + macroScore) * activityMultiplier;
  
  return score;
}

/**
 * Calculate a cuisine preference score
 */
export function calculateCuisineScore(recipe: Recipe, userProfile?: UserProfile | null): number {
  // Without preferred cuisines, we can't calculate a meaningful score
  if (!userProfile?.preferredCuisines || userProfile.preferredCuisines.length === 0) {
    return WEIGHTS.DEFAULT_SCORE;
  }
  
  const title = recipe.title.toLowerCase();
  
  // Check if recipe title contains any preferred cuisine
  const matchedCuisine = userProfile.preferredCuisines.some(
    cuisine => title.includes(cuisine.toLowerCase())
  );
  
  return matchedCuisine ? WEIGHTS.CUISINE_MATCH : WEIGHTS.DEFAULT_SCORE;
}

/**
 * Calculate how well a recipe matches the ingredients provided by the user
 */
export function calculateIngredientMatchScore(recipe: Recipe, providedIngredients: string[]): number {
  if (!providedIngredients.length) {
    return WEIGHTS.DEFAULT_SCORE;
  }
  
  // Simple heuristic: more ingredients used = higher score
  const usedRatio = recipe.usedIngredientCount / providedIngredients.length;
  return WEIGHTS.INGREDIENT_MATCH * (0.5 + usedRatio * 0.5); // At least 0.5 score, up to full weight
}

/**
 * Calculate the combined recommendation score for a recipe
 */
export function calculateRecommendationScore(
  recipe: Recipe, 
  userProfile: UserProfile | null,
  providedIngredients: string[],
  mealType?: MealType
): number {
  const nutritionScore = calculateNutritionScore(recipe, userProfile, mealType);
  const cuisineScore = calculateCuisineScore(recipe, userProfile);
  const ingredientScore = calculateIngredientMatchScore(recipe, providedIngredients);
  
  // Diet goal should provide a multiplier effect on the final score
  const dietGoalMultiplier = userProfile?.dietGoal ? 1.2 : 1.0;
  
  // Combine all scores with their weights
  return (nutritionScore + cuisineScore + ingredientScore) * dietGoalMultiplier;
}

/**
 * Rank recipes based on multiple factors and the user's profile
 */
export function rankRecipesByRelevance(
  recipes: Recipe[],
  userProfile: UserProfile | null,
  ingredients: string[],
  mealType?: MealType
): Recipe[] {
  // Filter recipes that contain allergens if user has allergies
  let filteredRecipes = recipes;
  if (userProfile?.allergies && userProfile.allergies.length > 0) {
    // This is a simple filter - in a real ML system we would have ingredient data
    // For now, we'll do a basic check on the title
    filteredRecipes = recipes.filter(recipe => {
      const title = recipe.title.toLowerCase();
      return !userProfile.allergies.some(allergy => 
        title.includes(allergy.toLowerCase().replace('_', ' '))
      );
    });
  }
  
  // Calculate score for each recipe
  const scoredRecipes = filteredRecipes.map(recipe => ({
    recipe,
    score: calculateRecommendationScore(recipe, userProfile, ingredients, mealType)
  }));
  
  // Sort by score (highest first)
  scoredRecipes.sort((a, b) => b.score - a.score);
  
  // Return just the recipes in the new order
  return scoredRecipes.map(item => item.recipe);
}
