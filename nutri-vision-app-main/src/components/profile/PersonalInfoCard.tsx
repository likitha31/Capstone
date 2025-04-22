
import { User2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PersonalInfoCardProps {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  nameError?: string;
}

export const PersonalInfoCard = ({
  name,
  email,
  onNameChange,
  nameError,
}: PersonalInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User2 className="h-5 w-5 text-nutri-green" />
          <span>Personal Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <User2 className="h-4 w-4 text-gray-500" />
            <span>Name</span>
          </label>
          <Input 
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name"
          />
          {nameError && (
            <p className="text-red-500 text-sm mt-1">{nameError}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>Email</span>
          </label>
          <Input 
            value={email}
            disabled
            className="bg-gray-50"
          />
        </div>
      </CardContent>
    </Card>
  );
};
