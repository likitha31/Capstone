
import { Scale, Ruler, Calendar, Utensils, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DietGoal } from "@/types";

interface HealthGoalsCardProps {
  weight: string;
  height: string;
  age: string;
  dietGoal: string;
  onWeightChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onDietGoalChange: (value: string) => void;
}

export const HealthGoalsCard = ({
  weight,
  height,
  age,
  dietGoal,
  onWeightChange,
  onHeightChange,
  onAgeChange,
  onDietGoalChange,
}: HealthGoalsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-nutri-green" />
          <span>Health & Goals</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Scale className="h-4 w-4 text-gray-500" />
            <span>Weight (kg)</span>
          </label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            placeholder="Enter your weight"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Ruler className="h-4 w-4 text-gray-500" />
            <span>Height (cm)</span>
          </label>
          <Input
            type="number"
            value={height}
            onChange={(e) => onHeightChange(e.target.value)}
            placeholder="Enter your height"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Age</span>
          </label>
          <Input
            type="number"
            value={age}
            onChange={(e) => onAgeChange(e.target.value)}
            placeholder="Enter your age"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Utensils className="h-4 w-4 text-gray-500" />
            <span>Diet Goal</span>
          </label>
          <Select
            value={dietGoal}
            onValueChange={onDietGoalChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your diet goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Lose Weight</SelectItem>
              <SelectItem value="maintain">Maintain Weight</SelectItem>
              <SelectItem value="gain">Gain Weight</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
