
export type DietGoal = 'lose' | 'maintain' | 'gain';

export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';

export type Allergy = 'dairy' | 'egg' | 'gluten' | 'grain' | 'peanut' | 'seafood' | 'sesame' | 'shellfish' | 'soy' | 'sulfite' | 'tree_nut' | 'wheat';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  dietGoal: DietGoal;
  dietaryPreference: DietaryPreference;
  allergies: Allergy[];
  bio?: string;
  avatar?: string;
  preferredCuisines?: string[];
  activityLevel?: ActivityLevel;
}

export interface Ingredient {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
}

export interface NutrientInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface RecipeInstruction {
  number: number;
  step: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  nutrition?: NutrientInfo;
  missedIngredientCount: number;
  usedIngredientCount: number;
  likes: number;
  instructions?: RecipeInstruction[];
}

export interface SavedRecipe extends Recipe {
  mealType: MealType;
  savedAt: string; // ISO date string
}

export interface GroceryItem {
  id: string;
  name: string;
  selected: boolean;
  category?: string;
}

// New interfaces for API integration
export interface RecipeSearchParams {
  ingredients: string[];
  diet?: string;
  intolerances?: string[];
  maxCalories?: number;
  number?: number;
}

// Re-exporting types from supabase.ts with correct TypeScript syntax
export type { MealPlan, UserAllergy, NutritionLog, UserProfile as SupabaseUserProfile } from './supabase';
