import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { SavedRecipe, MealType } from "@/types";
import { MealPlan } from "@/types/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MealPlannerDay from "./MealPlannerDay";

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

const EnhancedMealPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [view, setView] = useState<'carousel' | 'grid'>('carousel');

  const daysOfWeek: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const loadSavedRecipes = () => {
      const saved = localStorage.getItem("savedRecipes");
      if (saved) {
        setSavedRecipes(JSON.parse(saved));
      }
    };

    loadSavedRecipes();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "savedRecipes") {
        console.log("Storage change detected for savedRecipes");
        loadSavedRecipes();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    loadMealPlans();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user]);

  const loadMealPlans = async () => {
    setIsLoading(true);
    try {
      console.log("Loading meal plans, user:", user?.id);
      if (user) {
        const { data, error } = await supabase
          .from("meal_plans")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        console.log("Loaded meal plans from Supabase:", data);

        const typedMealPlans: MealPlan[] = data.map((item) => {
          const matchingRecipe = savedRecipes.find(
            (recipe) => recipe.id === item.recipe_id
          );

          return {
            id: item.id,
            userId: item.user_id,
            day: item.day as DayOfWeek,
            mealType: item.meal_type as MealType,
            recipeId: item.recipe_id,
            recipeTitle: item.recipe_title,
            recipeImage: item.recipe_image,
            createdAt: item.created_at,
            nutritionInfo: matchingRecipe?.nutrition || {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            },
          };
        });

        setMealPlans(typedMealPlans);
      } else {
        const saved = localStorage.getItem("mealPlans");
        if (saved) {
          const localPlans = JSON.parse(saved);
          console.log("Loaded meal plans from localStorage:", localPlans);
          setMealPlans(localPlans);
        }
      }
    } catch (error) {
      console.error("Error loading meal plans:", error);
      toast({
        title: "Error",
        description: "Could not load your meal plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveMealPlans = async (updatedPlans: MealPlan[]) => {
    if (user) {
    } else {
      localStorage.setItem("mealPlans", JSON.stringify(updatedPlans));
    }

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "mealPlans",
        newValue: JSON.stringify(updatedPlans),
      })
    );
  };

  const handleOpenAddMealDialog = (day: DayOfWeek, mealType: MealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setIsAddDialogOpen(true);
  };

  const getFilteredRecipes = () => {
    if (selectedMealTypeFilter === "all") {
      return savedRecipes;
    }
    return savedRecipes.filter(
      (recipe) => recipe.mealType === selectedMealTypeFilter
    );
  };

  const handleAddMeal = async (recipe: SavedRecipe) => {
    try {
      let newMealPlanId = `${Date.now()}`;

      const existingMeal = mealPlans.find(
        (meal) => meal.day === selectedDay && meal.mealType === selectedMealType
      );

      if (existingMeal && user) {
        const { error: deleteError } = await supabase
          .from("meal_plans")
          .delete()
          .eq("id", existingMeal.id);

        if (deleteError) {
          console.error("Error deleting existing meal:", deleteError);
        }
      }

      const newMealPlan: MealPlan = {
        id: newMealPlanId,
        userId: user?.id || "local",
        day: selectedDay,
        mealType: selectedMealType,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeImage: recipe.image,
        createdAt: new Date().toISOString(),
        nutritionInfo: recipe.nutrition || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      };

      if (user) {
        const { data, error } = await supabase
          .from("meal_plans")
          .insert({
            user_id: user.id,
            day: selectedDay,
            meal_type: selectedMealType,
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            recipe_image: recipe.image,
          })
          .select();

        if (error) {
          throw error;
        }

        if (data && data[0]) {
          newMealPlan.id = data[0].id;
          console.log("Saved new meal plan to Supabase:", data[0]);
        }
      }

      const updatedMealPlans = [...mealPlans];
      
      const existingIndex = updatedMealPlans.findIndex(
        (meal) => meal.day === selectedDay && meal.mealType === selectedMealType
      );
      
      if (existingIndex >= 0) {
        updatedMealPlans.splice(existingIndex, 1);
      }
      
      updatedMealPlans.push(newMealPlan);
      setMealPlans(updatedMealPlans);
      
      if (!user) {
        saveMealPlans(updatedMealPlans);
      }

      setIsAddDialogOpen(false);
      toast({
        title: "Meal Added",
        description: `${recipe.title} added to ${selectedDay}'s ${selectedMealType}`,
      });
    } catch (error) {
      console.error("Error adding meal:", error);
      toast({
        title: "Error",
        description: "Could not add meal to your plan",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    try {
      if (user) {
        console.log("Removing meal from Supabase, ID:", mealPlanId);
        const { error } = await supabase
          .from("meal_plans")
          .delete()
          .eq("id", mealPlanId);

        if (error) {
          throw error;
        }
      }

      const updatedMealPlans = mealPlans.filter((meal) => meal.id !== mealPlanId);
      setMealPlans(updatedMealPlans);
      
      if (!user) {
        saveMealPlans(updatedMealPlans);
      }

      toast({
        title: "Meal Removed",
        description: "Meal removed from your plan",
      });
    } catch (error) {
      console.error("Error removing meal:", error);
      toast({
        title: "Error",
        description: "Could not remove meal from your plan",
        variant: "destructive",
      });
    }
  };
  
  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = daysOfWeek.indexOf(activeDay);
    if (direction === 'prev') {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : daysOfWeek.length - 1;
      setActiveDay(daysOfWeek[newIndex]);
    } else {
      const newIndex = currentIndex < daysOfWeek.length - 1 ? currentIndex + 1 : 0;
      setActiveDay(daysOfWeek[newIndex]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Meal Planner</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className={view === 'carousel' ? 'bg-primary/10' : ''}
            onClick={() => setView('carousel')}
          >
            Carousel View
          </Button>
          <Button
            variant="outline"
            className={view === 'grid' ? 'bg-primary/10' : ''}
            onClick={() => setView('grid')}
          >
            Grid View
          </Button>
        </div>
      </div>
      
      {view === 'carousel' ? (
        <Card className="premium-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => navigateDay('prev')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold">{activeDay}</h3>
              <Button variant="ghost" onClick={() => navigateDay('next')}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <MealPlannerDay
                key={activeDay}
                day={activeDay}
                mealPlans={mealPlans}
                savedRecipes={savedRecipes}
                onAddMeal={handleOpenAddMealDialog}
                onRemoveMeal={handleRemoveMeal}
                isActive={true}
              />
            </div>
            
            <div className="flex justify-center mt-4">
              {daysOfWeek.map((day) => (
                <Button
                  key={day}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full min-w-[30px] h-8 p-0 mx-1 ${
                    activeDay === day ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={() => setActiveDay(day)}
                >
                  {day.substring(0, 1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="premium-card">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {daysOfWeek.map((day) => (
                <MealPlannerDay
                  key={day}
                  day={day}
                  mealPlans={mealPlans}
                  savedRecipes={savedRecipes}
                  onAddMeal={handleOpenAddMealDialog}
                  onRemoveMeal={handleRemoveMeal}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Add meal to {selectedDay}'s {selectedMealType}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mb-4">
            <Tabs 
              defaultValue="all" 
              value={selectedMealTypeFilter} 
              onValueChange={setSelectedMealTypeFilter}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                <TabsTrigger value="lunch">Lunch</TabsTrigger>
                <TabsTrigger value="dinner">Dinner</TabsTrigger>
                <TabsTrigger value="snack">Snack</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="overflow-y-auto flex-1">
            {getFilteredRecipes().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                {getFilteredRecipes().map((recipe) => (
                  <Card key={recipe.id} className="premium-card overflow-hidden">
                    <div className="flex h-24">
                      <div className="w-24 h-24 overflow-hidden">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-3 flex flex-col">
                        <h4 className="text-sm font-medium line-clamp-1">{recipe.title}</h4>
                        <div className="text-xs text-muted-foreground mt-auto">
                          {recipe.nutrition?.calories 
                            ? `${Math.round(recipe.nutrition.calories)} calories` 
                            : "Calories: N/A"}
                        </div>
                        <Button
                          onClick={() => handleAddMeal(recipe)}
                          size="sm"
                          className="mt-auto self-start text-xs premium-button"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No saved recipes found. Save recipes first to add them to your meal plan.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMealPlanner;
