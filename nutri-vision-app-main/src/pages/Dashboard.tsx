import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SavedRecipesList from "@/components/SavedRecipesList";
import EnhancedMealPlanner from "@/components/EnhancedMealPlanner";
import { SavedRecipe } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MealPlan } from "@/types/supabase";
import { createWeeklyNutritionData } from "@/utils/nutritionChartUtils";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("daily");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSavedRecipes = () => {
    console.log("Fetching saved recipes");
    const saved = localStorage.getItem("savedRecipes");
    if (saved) {
      const parsedRecipes = JSON.parse(saved);
      console.log("Parsed saved recipes:", parsedRecipes);
      setSavedRecipes(parsedRecipes);
    }
  };

  useEffect(() => {
    fetchSavedRecipes();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "savedRecipes") {
        console.log("Storage event triggered for savedRecipes");
        fetchSavedRecipes();
      } else if (e.key === "mealPlans" && !user) {
        console.log("Storage event triggered for mealPlans");
        const saved = localStorage.getItem("mealPlans");
        if (saved) {
          setMealPlans(JSON.parse(saved));
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchMealPlans();
  }, [user]);

  useEffect(() => {
    if (mealPlans.length > 0 && savedRecipes.length > 0) {
      updateMealPlansWithNutrition();
    }
  }, [savedRecipes, mealPlans.length]);

  const fetchMealPlans = async () => {
    setIsLoading(true);
    try {
      if (user) {
        console.log("Fetching meal plans for user:", user.id);
        const { data, error } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          throw error;
        }
        
        console.log("Fetched meal plans from Supabase:", data);
        
        const typedMealPlans: MealPlan[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          day: item.day as any,
          mealType: item.meal_type as any,
          recipeId: item.recipe_id,
          recipeTitle: item.recipe_title,
          recipeImage: item.recipe_image,
          createdAt: item.created_at,
          nutritionInfo: {
            calories: 0,
            protein: 0, 
            carbs: 0,
            fat: 0
          }
        }));
        
        setMealPlans(typedMealPlans);
        
        if (savedRecipes.length > 0) {
          setTimeout(() => updateMealPlansWithNutrition(), 0);
        }
      } else {
        const saved = localStorage.getItem("mealPlans");
        if (saved) {
          const localPlans = JSON.parse(saved);
          console.log("Fetched meal plans from localStorage:", localPlans);
          setMealPlans(localPlans);
        }
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

  const updateMealPlansWithNutrition = () => {
    console.log("Updating meal plans with nutrition info from saved recipes");
    
    const updatedMealPlans = mealPlans.map(meal => {
      const savedRecipe = savedRecipes.find(recipe => recipe.id === meal.recipeId);
      
      if (savedRecipe && savedRecipe.nutrition) {
        console.log(`Recipe ${meal.recipeTitle} nutrition:`, savedRecipe.nutrition);
      }
      
      return {
        ...meal,
        nutritionInfo: savedRecipe?.nutrition || meal.nutritionInfo
      };
    });
    
    setMealPlans(updatedMealPlans);
  };

  const handleDeleteRecipe = (recipeId: number) => {
    const updatedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
    setSavedRecipes(updatedRecipes);
    localStorage.setItem("savedRecipes", JSON.stringify(updatedRecipes));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'savedRecipes',
      newValue: JSON.stringify(updatedRecipes)
    }));
  };

  const calculateTodayCalories = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayMeals = mealPlans.filter(meal => meal.day === today);
    console.log(`Found ${todayMeals.length} meals for today (${today})`);
    
    const todayCalories = todayMeals.reduce((total, meal) => {
      if (meal.nutritionInfo?.calories) {
        console.log(`Recipe ${meal.recipeTitle} has ${meal.nutritionInfo.calories} calories`);
        return total + (meal.nutritionInfo.calories);
      }
      return total;
    }, 0);
    
    console.log(`Today's calories from meal plans: ${todayCalories}`);
    return todayCalories;
  };

  const calculateSavedRecipesCalories = () => {
    console.log("Calculating saved recipes calories from:", savedRecipes);
    const totalCal = savedRecipes.reduce((total, recipe) => {
      if (recipe.nutrition?.calories) {
        console.log(`Recipe ${recipe.title} has ${recipe.nutrition.calories} calories`);
        return total + (recipe.nutrition.calories);
      }
      return total;
    }, 0);
    
    console.log(`Total calories from saved recipes: ${totalCal}`);
    return totalCal;
  };

  const todayCalories = calculateTodayCalories();
  const savedRecipesCalories = calculateSavedRecipesCalories();
  const totalCalories = todayCalories || savedRecipesCalories || 1850;

  const calculateMacros = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayMeals = mealPlans.filter(meal => meal.day === today);
    console.log(`Calculating macros for ${todayMeals.length} today's meals`);
    
    if (todayMeals.length > 0) {
      const macros = todayMeals.reduce(
        (totals, meal) => {
          if (meal.nutritionInfo) {
            return {
              protein: totals.protein + (meal.nutritionInfo.protein || 0),
              carbs: totals.carbs + (meal.nutritionInfo.carbs || 0),
              fat: totals.fat + (meal.nutritionInfo.fat || 0)
            };
          }
          return totals;
        }, 
        { protein: 0, carbs: 0, fat: 0 }
      );
      
      console.log("Calculated macros from today's meal plans:", macros);
      
      if (macros.protein > 0 || macros.carbs > 0 || macros.fat > 0) {
        return macros;
      }
    }
    
    if (savedRecipes.length > 0) {
      console.log("Calculating macros from all saved recipes:", savedRecipes.length);
      const savedMacros = savedRecipes.reduce(
        (totals, recipe) => {
          if (recipe.nutrition) {
            return {
              protein: totals.protein + (recipe.nutrition.protein || 0),
              carbs: totals.carbs + (recipe.nutrition.carbs || 0),
              fat: totals.fat + (recipe.nutrition.fat || 0)
            };
          }
          return totals;
        },
        { protein: 0, carbs: 0, fat: 0 }
      );
      
      console.log("Calculated macros from saved recipes:", savedMacros);
      
      if (savedMacros.protein > 0 || savedMacros.carbs > 0 || savedMacros.fat > 0) {
        return savedMacros;
      }
    }
    
    return { protein: 85, carbs: 210, fat: 65 };
  };

  const macros = calculateMacros();
  console.log("Final calculated macros:", macros);

  const dailyNutrition = {
    calories: totalCalories,
    goal: 2000,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  };

  const macroData = [
    { name: "Protein", value: dailyNutrition.protein, color: "#22c55e" },
    { name: "Carbs", value: dailyNutrition.carbs, color: "#3b82f6" },
    { name: "Fat", value: dailyNutrition.fat, color: "#f59e0b" },
  ];

  const calculateMealBreakdown = () => {
    const mealTotals: Record<string, number> = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snacks: 0,
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayMeals = mealPlans.filter(meal => meal.day === today);
    
    if (todayMeals.length > 0) {
      todayMeals.forEach(meal => {
        const calories = meal.nutritionInfo?.calories || 0;
        switch (meal.mealType) {
          case "breakfast":
            mealTotals.Breakfast += calories;
            break;
          case "lunch":
            mealTotals.Lunch += calories;
            break;
          case "dinner":
            mealTotals.Dinner += calories;
            break;
          case "snack":
            mealTotals.Snacks += calories;
            break;
        }
      });
    } 
    else if (savedRecipes.length > 0) {
      savedRecipes.forEach(recipe => {
        if (!recipe.nutrition?.calories) return;
        
        const calories = recipe.nutrition.calories;
        switch (recipe.mealType) {
          case "breakfast":
            mealTotals.Breakfast += calories;
            break;
          case "lunch":
            mealTotals.Lunch += calories;
            break;
          case "dinner":
            mealTotals.Dinner += calories;
            break;
          case "snack":
            mealTotals.Snacks += calories;
            break;
        }
      });
    }

    return Object.entries(mealTotals).map(([name, calories]) => ({
      name,
      calories: Math.round(calories),
    }));
  };

  const mealBreakdown = calculateMealBreakdown();
  
  const weeklyData = createWeeklyNutritionData(mealPlans, savedRecipes);

  const nutrientIntake = [
    { nutrient: "Vitamin A", percent: 85 },
    { nutrient: "Vitamin C", percent: 110 },
    { nutrient: "Calcium", percent: 75 },
    { nutrient: "Iron", percent: 60 },
    { nutrient: "Fiber", percent: 90 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow py-10 bg-gray-50">
        <div className="container">
          <h1 className="text-3xl font-bold mb-2">Nutrition Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Track your nutrition progress and meet your health goals
          </p>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="planner">Planner</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="stat-card">
                  <div className="stat-title">
                    Calories
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="stat-value">
                      {Math.round(dailyNutrition.calories)}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        / {dailyNutrition.goal}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round((dailyNutrition.calories / dailyNutrition.goal) * 100)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-nutri-green rounded-full h-2"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((dailyNutrition.calories / dailyNutrition.goal) * 100)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-title">
                    Protein
                  </div>
                  <div className="stat-value">
                    {Math.round(dailyNutrition.protein)}
                    <span className="text-sm font-normal text-gray-500 ml-1">g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-nutri-green rounded-full h-2"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-title">
                    Carbs
                  </div>
                  <div className="stat-value">
                    {Math.round(dailyNutrition.carbs)}
                    <span className="text-sm font-normal text-gray-500 ml-1">g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-nutri-blue rounded-full h-2"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-title">
                    Fat
                  </div>
                  <div className="stat-value">
                    {Math.round(dailyNutrition.fat)}
                    <span className="text-sm font-normal text-gray-500 ml-1">g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-amber-500 rounded-full h-2"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="chart-container">
                  <CardHeader className="pb-0">
                    <CardTitle className="chart-title">Macronutrient Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${Math.round(percent * 100)}%`
                            }
                          >
                            {macroData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="chart-container">
                  <CardHeader className="pb-0">
                    <CardTitle className="chart-title">Daily Meals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mealBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="calories"
                            fill="#22c55e"
                            name="Calories"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="premium-card">
                <CardHeader className="pb-0">
                  <CardTitle className="chart-title">Nutrient Intake</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {nutrientIntake.map((item) => (
                      <div key={item.nutrient}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.nutrient}</span>
                          <span>{item.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`rounded-full h-2 ${
                              item.percent >= 100
                                ? "bg-nutri-green"
                                : item.percent >= 70
                                ? "bg-nutri-blue"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(item.percent, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6">
              <Card className="chart-container">
                <CardHeader className="pb-0">
                  <CardTitle className="chart-title">Weekly Calorie Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="calories"
                          stroke="#22c55e"
                          activeDot={{ r: 8 }}
                          name="Calories"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="chart-container">
                <CardHeader className="pb-0">
                  <CardTitle className="chart-title">Weekly Macronutrients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="protein" fill="#22c55e" name="Protein (g)" />
                        <Bar dataKey="carbs" fill="#3b82f6" name="Carbs (g)" />
                        <Bar dataKey="fat" fill="#f59e0b" name="Fat (g)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planner" className="space-y-6">
              <EnhancedMealPlanner />
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <Card className="premium-card">
                <CardHeader className="pb-0">
                  <CardTitle className="chart-title">My Saved Recipes</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <SavedRecipesList 
                    recipes={savedRecipes}
                    onDelete={handleDeleteRecipe}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
