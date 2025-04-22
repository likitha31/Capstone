import { Recipe, RecipeSearchParams, UserProfile } from "@/types";

// In a production environment, this should be stored in a secure server-side environment
// For this demo, we're placing it in the client code for simplicity
const SPOONACULAR_API_KEY = "60c2cbbc7bd7472aa482bb83d0e13abc"; 
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

// Mock recipes to show when API limits are reached
const MOCK_RECIPES: Recipe[] = [
  {
    id: 782585,
    title: "Cannellini Bean and Asparagus Salad with Mushrooms",
    image: "https://spoonacular.com/recipeImages/782585-312x231.jpg",
    readyInMinutes: 45,
    servings: 6,
    missedIngredientCount: 3,
    usedIngredientCount: 2,
    likes: 94,
    nutrition: {
      calories: 290,
      protein: 18,
      fat: 14,
      carbs: 25
    },
    instructions: [
      { number: 1, step: "Rinse and drain the cannellini beans." },
      { number: 2, step: "Steam the asparagus until just tender." },
      { number: 3, step: "Sauté the mushrooms in olive oil until golden." },
      { number: 4, step: "Mix beans, asparagus, and mushrooms with a vinaigrette made of lemon juice, olive oil, salt and pepper." }
    ]
  },
  {
    id: 716426,
    title: "Cauliflower, Brown Rice, and Vegetable Fried Rice",
    image: "https://spoonacular.com/recipeImages/716426-312x231.jpg",
    readyInMinutes: 30,
    servings: 4,
    missedIngredientCount: 2,
    usedIngredientCount: 3,
    likes: 209,
    nutrition: {
      calories: 330,
      protein: 12,
      fat: 18,
      carbs: 34
    },
    instructions: [
      { number: 1, step: "Remove the cauliflower's tough stem and reserve for another use." },
      { number: 2, step: "Using a food processor, pulse cauliflower until it resembles rice." },
      { number: 3, step: "In a large skillet over medium heat, heat oil." },
      { number: 4, step: "Add garlic and onion and sauté until soft, about 4 minutes." }
    ]
  },
  {
    id: 715497,
    title: "Berry Banana Breakfast Smoothie",
    image: "https://spoonacular.com/recipeImages/715497-312x231.jpg",
    readyInMinutes: 5,
    servings: 1,
    missedIngredientCount: 1,
    usedIngredientCount: 3,
    likes: 689,
    nutrition: {
      calories: 210,
      protein: 6,
      fat: 4,
      carbs: 42
    },
    instructions: [
      { number: 1, step: "In a blender, combine all ingredients and blend until smooth." },
      { number: 2, step: "Serve immediately and enjoy!" }
    ]
  }
];

export async function searchRecipesByIngredients(
  ingredients: string[],
  userProfile?: UserProfile | null,
  maxCalories?: number
): Promise<Recipe[]> {
  try {
    if (!ingredients.length) return [];
    
    // Prepare ingredients string
    const ingredientsParam = ingredients.join(",");
    
    // Build query parameters considering user preferences
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      ingredients: ingredientsParam,
      number: "10",
      ranking: "2",
      ignorePantry: "true",
    });
    
    // Add dietary preferences if user profile exists
    if (userProfile) {
      // Map dietary preferences to API parameters
      if (userProfile.dietaryPreference === 'vegetarian') {
        params.append("diet", "vegetarian");
      } else if (userProfile.dietaryPreference === 'vegan') {
        params.append("diet", "vegan");
      } else if (userProfile.dietaryPreference === 'keto') {
        params.append("diet", "ketogenic");
      } else if (userProfile.dietaryPreference === 'paleo') {
        params.append("diet", "paleo");
      }
      
      // Add intolerances based on user allergies
      if (userProfile.allergies && userProfile.allergies.length > 0) {
        params.append("intolerances", userProfile.allergies.join(","));
      }
      
      // Adjust maxCalories based on diet goal
      if (userProfile.dietGoal === 'lose') {
        params.append("maxCalories", "500"); // Lower calorie limit for weight loss
      } else if (userProfile.dietGoal === 'maintain') {
        params.append("maxCalories", "800");
      }
      // For 'gain' goal, we don't set a calorie limit
    }
    
    // Add explicit maxCalories if provided
    if (maxCalories) {
      params.append("maxCalories", maxCalories.toString());
    }
    
    console.log('Searching for recipes with params:', Object.fromEntries(params));
    
    let recipesData;
    
    try {
      // Make API request
      const response = await fetch(`${SPOONACULAR_BASE_URL}/recipes/findByIngredients?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Check specifically for rate limit errors
        if (response.status === 402) {
          console.warn("API daily limit reached. Using fallback mock data.");
          // Return mock data instead when API limit is reached
          return MOCK_RECIPES.map(recipe => ({
            ...recipe,
            // Add a note that this is mock data
            title: `${recipe.title} (Demo Recipe)`
          }));
        }
        
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      recipesData = await response.json();
      console.log('Found recipes:', recipesData.length);
      
      if (recipesData.length === 0) {
        return [];
      }
    } catch (error) {
      console.error("Error in API request:", error);
      
      // If there was an API error, return mock data
      console.warn("Returning mock data due to API error");
      return MOCK_RECIPES.map(recipe => ({
        ...recipe,
        title: `${recipe.title} (Demo Recipe)`
      }));
    }
    
    // Get full recipe information with nutrition data for each recipe found
    const recipePromises = recipesData.map(async (item) => {
      try {
        // Use includeNutrition=true to always get nutrition data
        const params = new URLSearchParams({
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: "true"
        });
        
        console.log(`Fetching detailed info for recipe ${item.id}`);
        const detailResponse = await fetch(`${SPOONACULAR_BASE_URL}/recipes/${item.id}/information?${params.toString()}`);
        
        if (!detailResponse.ok) {
          if (detailResponse.status === 402) {
            throw new Error("API daily limit reached for detailed recipe info.");
          }
          throw new Error(`API responded with status: ${detailResponse.status}`);
        }
        
        const detailData = await detailResponse.json();
        
        // Extract nutrition data
        let nutritionData = {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0
        };
        
        if (detailData.nutrition && detailData.nutrition.nutrients) {
          const nutrients = detailData.nutrition.nutrients;
          const calories = nutrients.find((n: any) => n.name === "Calories");
          const protein = nutrients.find((n: any) => n.name === "Protein");
          const fat = nutrients.find((n: any) => n.name === "Fat");
          const carbs = nutrients.find((n: any) => n.name === "Carbohydrates");
          
          nutritionData = {
            calories: calories ? parseFloat(calories.amount) : 0,
            protein: protein ? parseFloat(protein.amount) : 0,
            fat: fat ? parseFloat(fat.amount) : 0,
            carbs: carbs ? parseFloat(carbs.amount) : 0
          };
          
          console.log(`Extracted nutrition data for ${detailData.title}:`, nutritionData);
        } else {
          console.warn(`No nutrition data found for recipe ${item.id}`);
        }
        
        return {
          id: item.id,
          title: item.title,
          image: item.image,
          readyInMinutes: detailData.readyInMinutes || 30,
          servings: detailData.servings || 4,
          missedIngredientCount: item.missedIngredientCount,
          usedIngredientCount: item.usedIngredientCount,
          likes: detailData.aggregateLikes || 0,
          nutrition: nutritionData,
          instructions: detailData.analyzedInstructions && detailData.analyzedInstructions[0]?.steps 
            ? detailData.analyzedInstructions[0].steps.map((step: any) => ({
                number: step.number,
                step: step.step
              })) 
            : []
        };
      } catch (error) {
        console.error(`Error fetching details for recipe ${item.id}:`, error);
        // Return basic recipe info if detailed info fetch fails
        return {
          id: item.id,
          title: item.title,
          image: item.image,
          readyInMinutes: 30,
          servings: 4,
          missedIngredientCount: item.missedIngredientCount,
          usedIngredientCount: item.usedIngredientCount,
          likes: item.likes || 0,
          nutrition: {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0
          },
          instructions: []
        };
      }
    });
    
    // Wait for all detailed recipe info requests to complete
    const recipes = await Promise.all(recipePromises);
    
    // Log how many recipes have nutrition data
    const recipesWithNutrition = recipes.filter(r => r.nutrition?.calories > 0);
    console.log(`Retrieved ${recipesWithNutrition.length}/${recipes.length} recipes with nutrition data`);
    
    return recipes;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    
    // Return mock data for any error
    return MOCK_RECIPES.map(recipe => ({
      ...recipe,
      title: `${recipe.title} (Demo Recipe)`
    }));
  }
}

export async function getRecipeInformation(recipeId: number): Promise<Recipe | null> {
  try {
    // For demo recipes, return the mock data
    const mockRecipe = MOCK_RECIPES.find(recipe => recipe.id === recipeId);
    if (mockRecipe) {
      return mockRecipe;
    }
    
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      includeNutrition: "true"
    });
    
    console.log(`Fetching detailed info for recipe ${recipeId}`);
    
    try {
      const response = await fetch(`${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information?${params.toString()}`);
      
      if (!response.ok) {
        // Check specifically for rate limit errors
        if (response.status === 402) {
          console.warn("API daily limit reached for recipe information. Using fallback data.");
          // Return first mock recipe when API limit is reached
          return MOCK_RECIPES[0];
        }
        
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received info for recipe ${recipeId}:`, data.title);
      
      // Extract nutrition data
      let nutritionData = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      };
      
      if (data.nutrition && data.nutrition.nutrients) {
        const nutrients = data.nutrition.nutrients;
        const calories = nutrients.find((n: any) => n.name === "Calories");
        const protein = nutrients.find((n: any) => n.name === "Protein");
        const fat = nutrients.find((n: any) => n.name === "Fat");
        const carbs = nutrients.find((n: any) => n.name === "Carbohydrates");
        
        nutritionData = {
          calories: calories ? parseFloat(calories.amount) : 0,
          protein: protein ? parseFloat(protein.amount) : 0,
          fat: fat ? parseFloat(fat.amount) : 0,
          carbs: carbs ? parseFloat(carbs.amount) : 0
        };
        
        console.log(`Extracted nutrition data for ${data.title}:`, nutritionData);
      } else {
        console.warn(`No nutrition data found for recipe ${recipeId}`);
      }
      
      return {
        id: data.id,
        title: data.title,
        image: data.image,
        readyInMinutes: data.readyInMinutes || 30,
        servings: data.servings || 4,
        missedIngredientCount: 0,
        usedIngredientCount: 0,
        likes: data.aggregateLikes || 0,
        nutrition: nutritionData,
        instructions: data.analyzedInstructions && data.analyzedInstructions[0]?.steps 
          ? data.analyzedInstructions[0].steps.map((step: any) => ({
              number: step.number,
              step: step.step
            })) 
          : []
      };
    } catch (error) {
      console.error("Error in API request for recipe information:", error);
      // Return a mock recipe for any API error
      return MOCK_RECIPES[0];
    }
  } catch (error) {
    console.error("Error fetching recipe information:", error);
    return null;
  }
}
