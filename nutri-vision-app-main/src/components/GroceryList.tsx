
import React, { useState } from "react";
import { GroceryItem } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroceryListProps {
  initialItems: GroceryItem[];
  onItemsChange: (items: GroceryItem[]) => void;
  onSearch?: (selectedIngredients: string[]) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ initialItems, onItemsChange, onSearch }) => {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState("");
  const { toast } = useToast();

  const handleToggleItem = (id: string) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    setItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: GroceryItem = {
      id: `grocery-${Date.now()}`,
      name: newItemName.trim(),
      selected: false
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onItemsChange(updatedItems);
    setNewItemName("");
    
    toast({
      title: "Item Added",
      description: `${newItemName} has been added to your grocery list.`,
    });
  };

  const handleRemoveItem = (id: string) => {
    const itemToRemove = items.find(item => item.id === id);
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    onItemsChange(updatedItems);
    
    if (itemToRemove) {
      toast({
        title: "Item Removed",
        description: `${itemToRemove.name} has been removed from your grocery list.`,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  const handleSearchWithSelectedIngredients = () => {
    if (onSearch) {
      const selectedIngredients = items
        .filter(item => item.selected)
        .map(item => item.name);
      
      onSearch(selectedIngredients);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Grocery List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-6">
          <Input
            placeholder="Add ingredient"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleAddItem} type="button">
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
        
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-gray-500">Your grocery list is empty. Add ingredients to get started.</p>
          )}
          
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={item.id}
                  checked={item.selected}
                  onCheckedChange={() => handleToggleItem(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm ${item.selected ? 'line-through text-gray-400' : ''}`}
                >
                  {item.name}
                </label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(item.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {onSearch && items.some(item => item.selected) && (
          <Button 
            onClick={handleSearchWithSelectedIngredients} 
            className="w-full mt-6 bg-nutri-green hover:bg-nutri-green/90"
          >
            Search Recipes With Selected Ingredients
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroceryList;
