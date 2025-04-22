
import { Allergy, MealType } from './index';

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  dietGoal?: 'lose' | 'maintain' | 'gain';
  dietaryPreference?: 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';
  allergies?: Allergy[]; // Added allergies field
  createdAt?: string;
};

export type UserAllergy = {
  id: string;
  userId: string;
  allergyType: Allergy;
  createdAt?: string;
};

export type MealPlan = {
  id: string;
  userId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  mealType: MealType;
  recipeId: number;
  recipeTitle: string;
  recipeImage: string;
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt?: string;
};

export type NutritionLog = {
  id: string;
  userId: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt?: string;
};
