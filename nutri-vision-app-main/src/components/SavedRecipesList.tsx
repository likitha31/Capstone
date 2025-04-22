
import React from "react";
import { SavedRecipe, MealType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedRecipesListProps {
  recipes: SavedRecipe[];
  onDelete: (id: number) => void;
}

const SavedRecipesList: React.FC<SavedRecipesListProps> = ({ recipes, onDelete }) => {
  const { toast } = useToast();
  
  const getMealTypeColor = (mealType: MealType) => {
    switch (mealType) {
      case "breakfast":
        return "bg-amber-500";
      case "lunch":
        return "bg-nutri-blue";
      case "dinner":
        return "bg-nutri-green";
      case "snack":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDelete = (recipe: SavedRecipe) => {
    onDelete(recipe.id);
    toast({
      title: "Recipe Removed",
      description: `${recipe.title} has been removed from your saved recipes.`,
    });
  };

  const recipesByMealType: Record<MealType, SavedRecipe[]> = {
    breakfast: recipes.filter(r => r.mealType === "breakfast"),
    lunch: recipes.filter(r => r.mealType === "lunch"),
    dinner: recipes.filter(r => r.mealType === "dinner"),
    snack: recipes.filter(r => r.mealType === "snack"),
  };

  return (
    <div className="space-y-6">
      {(Object.keys(recipesByMealType) as MealType[]).map((mealType) => (
        recipesByMealType[mealType].length > 0 && (
          <div key={mealType} className="space-y-3">
            <h3 className="text-xl font-semibold capitalize">{mealType}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipesByMealType[mealType].map((recipe) => (
                <Card key={`${recipe.id}-${recipe.mealType}`} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge 
                      className={`absolute top-2 right-2 ${getMealTypeColor(recipe.mealType)}`}
                    >
                      {recipe.mealType}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2">{recipe.title}</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {recipe.readyInMinutes} min
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {recipe.servings} servings
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">
                        {recipe.nutrition?.calories || "N/A"} calories
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(recipe)}
                        className="text-red-500 hover:text-red-700 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      ))}
      
      {recipes.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No saved recipes yet. Go to the Recipes page to find and save recipes.</p>
        </div>
      )}
    </div>
  );
};

export default SavedRecipesList;
