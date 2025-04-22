
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Allergy } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AllergiesCardProps {
  allergies: Allergy[];
  setAllergies?: (allergies: Allergy[]) => void;
}

export function AllergiesCard({ allergies, setAllergies }: AllergiesCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const allergiesList: Allergy[] = [
    'dairy', 'egg', 'gluten', 'grain', 'peanut', 
    'seafood', 'sesame', 'shellfish', 'soy', 
    'sulfite', 'tree_nut', 'wheat'
  ];

  const handleAllergyChange = async (allergy: Allergy, checked: boolean) => {
    if (!user || !setAllergies) return;
    
    setIsUpdating(true);
    
    try {
      let newAllergies: Allergy[];
      
      if (checked) {
        newAllergies = [...allergies, allergy];
        
        // Save to database
        const { error } = await supabase
          .from('allergies')
          .insert({
            user_id: user.id,
            allergy_type: allergy
          });
          
        if (error) throw error;
      } else {
        newAllergies = allergies.filter(a => a !== allergy);
        
        // Remove from database
        const { error } = await supabase
          .from('allergies')
          .delete()
          .eq('user_id', user.id)
          .eq('allergy_type', allergy);
          
        if (error) throw error;
      }
      
      setAllergies(newAllergies);
      
    } catch (error: any) {
      console.error('Error updating allergy:', error);
      toast({
        title: "Error",
        description: "Could not update allergies: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const formatAllergyLabel = (allergy: string) => {
    // Replace underscores with spaces and capitalize first letter of each word
    return allergy
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food Allergies & Intolerances</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-6">
          Select any allergies or food intolerances you have. This helps us suggest appropriate recipes
          and filter out unsuitable ones for your dietary needs.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allergiesList.map((allergy) => (
            <div key={allergy} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-md transition-colors">
              <Checkbox
                id={allergy}
                checked={allergies.includes(allergy)}
                onCheckedChange={(checked) => {
                  if (setAllergies) {
                    handleAllergyChange(allergy, checked === true);
                  }
                }}
                disabled={isUpdating}
                className="data-[state=checked]:bg-nutri-green data-[state=checked]:border-nutri-green"
              />
              <Label 
                htmlFor={allergy} 
                className="cursor-pointer text-sm font-medium"
              >
                {formatAllergyLabel(allergy)}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
