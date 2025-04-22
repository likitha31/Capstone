import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Clock, Users, Heart, Bookmark, Camera, Mic } from "lucide-react";
import { Recipe, Ingredient, MealType, SavedRecipe, GroceryItem, UserProfile, DietaryPreference, Allergy } from "@/types";
import { useToast } from "@/hooks/use-toast";
import GroceryList from "@/components/GroceryList";
import { searchRecipesByIngredients } from "@/services/recipeService";
import { RecipeDialog } from '@/components/ui/recipe-dialog';
import { getRecipeInformation } from '@/services/recipeService';
import { VoiceSearch } from '@/components/VoiceSearch';

const defaultGroceryItems: GroceryItem[] = [
  { id: "g1", name: "Chicken", selected: false, category: "Protein" },
  { id: "g2", name: "Rice", selected: false, category: "Carbs" },
  { id: "g3", name: "Spinach", selected: false, category: "Vegetables" },
  { id: "g4", name: "Eggs", selected: false, category: "Protein" },
  { id: "g5", name: "Milk", selected: false, category: "Dairy" },
  { id: "g6", name: "Tomatoes", selected: false, category: "Vegetables" },
  { id: "g7", name: "Onions", selected: false, category: "Vegetables" },
  { id: "g8", name: "Olive Oil", selected: false, category: "Oil" },
];

const Recipes = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem("groceryItems");
    return saved ? JSON.parse(saved) : defaultGroceryItems;
  });
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(() => {
    const saved = localStorage.getItem("savedRecipes");
    return saved ? JSON.parse(saved) : [];
  });
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedRecipeToSave, setSelectedRecipeToSave] = useState<Recipe | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("dinner");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("groceryItems", JSON.stringify(groceryItems));
  }, [groceryItems]);

  useEffect(() => {
    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'savedRecipes',
      newValue: JSON.stringify(savedRecipes)
    }));
  }, [savedRecipes]);

  const handleSearch = async () => {
    setIsSearching(true);
    
    const selectedItems = groceryItems
      .filter(item => item.selected)
      .map(item => item.name);
      
    const allIngredients = [...selectedItems];
    
    if (ingredients.trim()) {
      allIngredients.push(...ingredients.split(',').map(i => i.trim()));
    }

    console.log('Searching with ingredients:', allIngredients);

    if (allIngredients.length === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please select some ingredients or enter them manually.",
      });
      setIsSearching(false);
      return;
    }
    
    try {
      const userProfileJson = localStorage.getItem("userProfile");
      let userProfileData = userProfileJson ? JSON.parse(userProfileJson) : null;
      
      let userProfile: UserProfile | null = null;
      
      if (userProfileData) {
        userProfile = {
          name: userProfileData.name || "",
          age: userProfileData.age || 0,
          weight: userProfileData.weight || 0,
          height: userProfileData.height || 0,
          gender: userProfileData.gender || "other",
          dietGoal: userProfileData.dietGoal || "maintain",
          dietaryPreference: userProfileData.dietaryPreference || "none",
          allergies: userProfileData.allergies || [],
          preferredCuisines: userProfileData.preferredCuisines
        };
      }
      
      console.log('User Profile:', userProfile);
      
      const recipes = await searchRecipesByIngredients(
        allIngredients,
        userProfile
      );
      
      console.log('Recipes found:', recipes);
      
      if (recipes.length === 0) {
        toast({
          title: "No recipes found",
          description: "Try different ingredients or fewer restrictions.",
        });
      }
      
      setSearchResults(recipes);
    } catch (error) {
      console.error("Error searching for recipes:", error);
      toast({
        title: "Error",
        description: "Failed to search recipes. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFromGroceryList = (selectedIngredients: string[]) => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please select some ingredients first.",
      });
      return;
    }
    
    setShowGroceryList(false);
    
    setIngredients(selectedIngredients.join(", "));
    
    setIsSearching(true);
    
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIngredients(e.target.value);
  };

  const handleSortChange = (value: string) => {
    let sortedResults = [...searchResults];
    
    switch (value) {
      case "time":
        sortedResults.sort((a, b) => a.readyInMinutes - b.readyInMinutes);
        break;
      case "popularity":
        sortedResults.sort((a, b) => b.likes - a.likes);
        break;
      case "calories-asc":
        sortedResults.sort((a, b) => 
          (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0)
        );
        break;
      case "calories-desc":
        sortedResults.sort((a, b) => 
          (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0)
        );
        break;
      default:
        break;
    }
    
    setSortBy(value);
    setSearchResults(sortedResults);
  };

  const handleImageUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Image upload functionality will be available in a future update.",
    });
  };

  const handleVoiceInput = (transcript: string) => {
    setIngredients(transcript);
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    if (savedRecipes.some(saved => saved.id === recipe.id)) {
      toast({
        title: "Already Saved",
        description: "This recipe is already in your saved recipes.",
      });
      return;
    }
    
    setSelectedRecipeToSave(recipe);
    setSaveDialogOpen(true);
  };

  const confirmSaveRecipe = async () => {
    if (!selectedRecipeToSave) return;

    let detailedRecipe = selectedRecipeToSave;
    
    try {
      console.log("Fetching detailed recipe information for ID:", selectedRecipeToSave.id);
      const fetched = await getRecipeInformation(selectedRecipeToSave.id);
      
      if (fetched) {
        console.log("Detailed recipe fetched:", fetched);
        detailedRecipe = {
          ...selectedRecipeToSave,
          nutrition: fetched.nutrition,
          instructions: fetched.instructions || selectedRecipeToSave.instructions
        };
        
        console.log("Updated recipe with nutrition:", detailedRecipe.nutrition);
      } else {
        console.warn("Could not fetch detailed recipe information");
      }
    } catch (err) {
      console.warn("Error fetching detailed recipe info:", err);
    }

    const newSavedRecipe: SavedRecipe = {
      ...detailedRecipe,
      mealType: selectedMealType,
      savedAt: new Date().toISOString()
    };
    
    console.log("Saving recipe with nutrition data:", newSavedRecipe.nutrition);
    
    setSavedRecipes(prev => [...prev, newSavedRecipe]);
    setSaveDialogOpen(false);
    setSelectedRecipeToSave(null);

    toast({
      title: "Recipe Saved",
      description: `${newSavedRecipe.title} has been saved to your ${selectedMealType} recipes.`,
    });
  };

  const handleGroceryItemsChange = (newItems: GroceryItem[]) => {
    setGroceryItems(newItems);
  };

  const handleViewRecipe = async (recipe: Recipe) => {
    try {
      const detailedRecipe = await getRecipeInformation(recipe.id);
      console.log("Detailed recipe for viewing:", detailedRecipe);
      setSelectedRecipe(detailedRecipe);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      toast({
        title: "Error",
        description: "Could not load recipe details",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="container">
          <div className="max-w-4xl mx-auto mb-10">
            <h1 className="text-3xl font-bold mb-6">Find Recipes With Your Ingredients</h1>
            <p className="text-gray-600 mb-8">
              Enter ingredients you have on hand, and we'll find recipes that match your dietary preferences and goals.
            </p>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Enter ingredients separated by commas (e.g. chicken, spinach, rice)"
                    value={ingredients}
                    onChange={handleInputChange}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowGroceryList(true)}
                    className="whitespace-nowrap"
                  >
                    My Ingredients
                  </Button>
                  <VoiceSearch onResult={handleVoiceInput} />
                  <Button
                    onClick={handleSearch}
                    className="whitespace-nowrap bg-nutri-green hover:bg-nutri-green/90"
                    disabled={isSearching || (!ingredients.trim() && !groceryItems.some(item => item.selected))}
                  >
                    {isSearching ? "Searching..." : "Find Recipes"}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 mb-4">
                  <p className="text-gray-600 mb-2 sm:mb-0">
                    {searchResults.length} recipes found
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Recommended</SelectItem>
                        <SelectItem value="time">Preparation Time</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                        <SelectItem value="calories-asc">Calories (Low to High)</SelectItem>
                        <SelectItem value="calories-desc">Calories (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {searchResults.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => handleSaveRecipe(recipe)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{recipe.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {recipe.readyInMinutes} min
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {recipe.servings} servings
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {recipe.likes}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">
                        {typeof recipe.nutrition?.calories === "number" && recipe.nutrition.calories > 0
                          ? `${Math.round(recipe.nutrition.calories)} calories`
                          : "--"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {recipe.usedIngredientCount} of {recipe.usedIngredientCount + recipe.missedIngredientCount} ingredients
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-nutri-green hover:bg-nutri-green/90" onClick={() => handleViewRecipe(recipe)}>
                      View Recipe
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {ingredients && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-12">
              <p className="text-gray-600">No recipes found with those ingredients. Try adding more ingredients or fewer restrictions.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={showGroceryList} onOpenChange={setShowGroceryList}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Ingredients</DialogTitle>
            <DialogDescription>
              Select ingredients you have on hand to find matching recipes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto py-4">
            <GroceryList 
              initialItems={groceryItems}
              onItemsChange={handleGroceryItemsChange}
              onSearch={handleSearchFromGroceryList}
            />
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowGroceryList(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Recipe</DialogTitle>
            <DialogDescription>
              Choose which meal type this recipe belongs to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmSaveRecipe}
              className="bg-nutri-green hover:bg-nutri-green/90"
            >
              Save Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecipeDialog 
        recipe={selectedRecipe}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Recipes;
