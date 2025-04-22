
import { Recipe, DietGoal, DietaryPreference, Allergy } from '@/types';

export const mockRecipes: Recipe[] = [
  {
    id: 652417,
    title: "Spiced Quinoa with Sweet Potatoes",
    image: "https://spoonacular.com/recipeImages/652417-556x370.jpg",
    readyInMinutes: 45,
    servings: 4,
    nutrition: {
      calories: 320,
      protein: 9,
      fat: 6,
      carbs: 58
    },
    missedIngredientCount: 2,
    usedIngredientCount: 3,
    likes: 28
  },
  {
    id: 716429,
    title: "Pasta with Garlic, Tomato, and Spinach",
    image: "https://spoonacular.com/recipeImages/716429-556x370.jpg",
    readyInMinutes: 30,
    servings: 2,
    nutrition: {
      calories: 420,
      protein: 12,
      fat: 18,
      carbs: 51
    },
    missedIngredientCount: 1,
    usedIngredientCount: 4,
    likes: 42
  },
  {
    id: 795751,
    title: "Chicken Stir-Fry with Vegetables",
    image: "https://spoonacular.com/recipeImages/795751-556x370.jpg",
    readyInMinutes: 35,
    servings: 4,
    nutrition: {
      calories: 380,
      protein: 28,
      fat: 12,
      carbs: 34
    },
    missedIngredientCount: 3,
    usedIngredientCount: 2,
    likes: 35
  },
  {
    id: 663559,
    title: "Thai Coconut Curry Salmon",
    image: "https://spoonacular.com/recipeImages/663559-556x370.jpg",
    readyInMinutes: 40,
    servings: 3,
    nutrition: {
      calories: 410,
      protein: 32,
      fat: 24,
      carbs: 14
    },
    missedIngredientCount: 4,
    usedIngredientCount: 2,
    likes: 21
  },
  {
    id: 782600,
    title: "Quinoa Bowl with Roasted Vegetables",
    image: "https://spoonacular.com/recipeImages/782600-556x370.jpg",
    readyInMinutes: 50,
    servings: 3,
    nutrition: {
      calories: 340,
      protein: 10,
      fat: 8,
      carbs: 56
    },
    missedIngredientCount: 2,
    usedIngredientCount: 3,
    likes: 16
  },
  {
    id: 715497,
    title: "Berry Banana Breakfast Smoothie",
    image: "https://spoonacular.com/recipeImages/715497-556x370.jpg",
    readyInMinutes: 5,
    servings: 1,
    nutrition: {
      calories: 240,
      protein: 5,
      fat: 4,
      carbs: 45
    },
    missedIngredientCount: 1,
    usedIngredientCount: 2,
    likes: 38
  }
];

export const dietGoalOptions: { value: DietGoal; label: string }[] = [
  { value: 'lose', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'gain', label: 'Gain Weight' }
];

export const dietaryPreferenceOptions: { value: DietaryPreference; label: string }[] = [
  { value: 'none', label: 'No Special Diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Ketogenic' },
  { value: 'paleo', label: 'Paleo' }
];

export const allergyOptions: { value: Allergy; label: string }[] = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'egg', label: 'Egg' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'grain', label: 'Grain' },
  { value: 'peanut', label: 'Peanut' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'soy', label: 'Soy' },
  { value: 'tree_nut', label: 'Tree Nuts' },
  { value: 'wheat', label: 'Wheat' }
];
