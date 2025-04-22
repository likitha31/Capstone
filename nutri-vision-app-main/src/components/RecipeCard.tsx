
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipe.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Ready in:</span> {recipe.readyInMinutes} min
            </div>
            <div>
              <span className="font-medium">Servings:</span> {recipe.servings}
            </div>
          </div>

          {recipe.nutrition && (
            <div>
              <h4 className="text-sm font-medium mb-1">Nutrition:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>Calories: {recipe.nutrition.calories}</div>
                <div>Protein: {recipe.nutrition.protein}g</div>
                <div>Carbs: {recipe.nutrition.carbs}g</div>
                <div>Fat: {recipe.nutrition.fat}g</div>
              </div>
            </div>
          )}

          {recipe.instructions && (
            <div>
              <h4 className="text-sm font-medium mb-1">Instructions:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {recipe.instructions.map((instruction) => (
                  <li key={instruction.number}>{instruction.step}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="text-green-600">Used ingredients: {recipe.usedIngredientCount}</div>
            <div className="text-amber-600">Missing ingredients: {recipe.missedIngredientCount}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
