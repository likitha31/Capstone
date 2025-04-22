
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Recipe } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Users, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecipeDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDialog({ recipe, open, onOpenChange }: RecipeDialogProps) {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl font-bold">{recipe.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {recipe.readyInMinutes} min
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {recipe.servings} servings
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {recipe.likes}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-6 pt-2 overflow-auto max-h-full">
          <div className="space-y-6 pb-4">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img 
                src={recipe.image} 
                alt={recipe.title} 
                className="w-full h-full object-cover"
              />
            </div>

            {recipe.instructions && recipe.instructions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Instructions</h3>
                <ol className="space-y-3">
                  {recipe.instructions.map((instruction) => (
                    <li key={instruction.number} className="flex gap-3">
                      <span className="font-medium text-nutri-green">
                        {instruction.number}.
                      </span>
                      <span>{instruction.step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No instructions available for this recipe.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
