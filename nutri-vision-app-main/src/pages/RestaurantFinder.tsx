import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Search, Star, Utensils, AlertCircle, Info } from "lucide-react";
import { SavedRecipe } from "@/types";
import { MealPlan } from "@/types/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  priceLevel: string;
  photoUrl?: string;
  matchingMeals: string[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

const RestaurantFinder = () => {
  const { toast } = useToast();
  const [location, setLocation] = useState<string>("");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [activeTab, setActiveTab] = useState<string>("recipes");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // Load saved recipes
    const saved = localStorage.getItem("savedRecipes");
    if (saved) {
      setSavedRecipes(JSON.parse(saved));
    }
    
    // Load meal plans
    const savedMealPlans = localStorage.getItem("mealPlans");
    if (savedMealPlans) {
      setMealPlans(JSON.parse(savedMealPlans));
    }
  }, []);

  const getUserLocation = useCallback(() => {
    setLocationError(null);
    setIsLocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          setUserLocation(coords);
          
          // Get address from coordinates (reverse geocoding)
          reverseGeocode(coords.lat, coords.lng);
          toast({
            title: "Location Found",
            description: "Successfully retrieved your current location.",
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          
          let errorMessage = "Unable to access your location. ";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location permission was denied. Please check your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable. Please try again or enter your location manually.";
              break;
            case error.TIMEOUT:
              errorMessage += "The request to get your location timed out. Please try again.";
              break;
            default:
              errorMessage += "Please enter your location manually or check your browser permissions.";
          }
          
          setLocationError(errorMessage);
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enter it manually.",
            variant: "destructive"
          });
          setIsLocating(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, // Increased timeout
          maximumAge: 0 
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser. Please enter your location manually.");
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation. Please enter your location manually.",
        variant: "destructive"
      });
      setIsLocating(false);
    }
  }, [toast]);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // In a real app, you would use Google Maps API or similar for this
      // For demo purposes, we'll set the coordinates with city estimation
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      const addressComponents = [];
      
      if (data.address) {
        if (data.address.city) addressComponents.push(data.address.city);
        else if (data.address.town) addressComponents.push(data.address.town);
        else if (data.address.village) addressComponents.push(data.address.village);
        
        if (data.address.state) addressComponents.push(data.address.state);
        if (data.address.postcode) addressComponents.push(data.address.postcode);
      }
      
      const formattedAddress = addressComponents.length > 0 
        ? addressComponents.join(", ") 
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
      setLocation(formattedAddress);
    } catch (error) {
      console.error("Error with reverse geocoding:", error);
      setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleMealSelect = (mealTitle: string) => {
    if (selectedMeals.includes(mealTitle)) {
      setSelectedMeals(selectedMeals.filter(meal => meal !== mealTitle));
    } else {
      setSelectedMeals([...selectedMeals, mealTitle]);
    }
  };

  // Enhanced restaurant generation to match meal types better
  const generateRestaurants = (locationString: string, meals: string[], userCoords?: Coordinates) => {
    // Generate seed based on location string and coordinates if available
    let locationSeed = locationString.length;
    if (userCoords) {
      // Use coordinates for more consistent results for the same location
      locationSeed += Math.floor(userCoords.lat * 10) + Math.floor(userCoords.lng * 10);
    }
    
    // Determine number of restaurants based on meals selected (more meals = more potential matches)
    const numRestaurants = 3 + Math.min(meals.length, 4);
    
    // Create more specific restaurant names based on meal types
    const cuisineTypes = extractCuisineTypes(meals);
    
    // Create more targeted restaurant names based on the selected meals
    const restaurantNames = getRelevantRestaurantNames(cuisineTypes);
    
    const addresses = [
      "Main St", "Oak Ave", "Elm Blvd", "Pine St", "Maple Rd",
      "Cedar Ln", "Walnut Way", "Cherry St", "Birch Dr",
      "Willow Ave", "Spruce St", "Chestnut Blvd", "Aspen Ln",
      "Magnolia Dr", "Poplar Ct"
    ];
    
    const photoUrls = [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    ];
    
    const mockRestaurants: Restaurant[] = [];
    
    // Pseudo-random generation but consistent for the same location
    for (let i = 0; i < numRestaurants; i++) {
      const seed = locationSeed + i;
      
      // Choose restaurant name based on most probable cuisine match
      const nameIndex = i < cuisineTypes.length 
        ? (i % restaurantNames.length) 
        : ((seed * 3) % restaurantNames.length);
      
      const addressIndex = ((seed * 3) % addresses.length);
      const photoIndex = ((seed * 7) % photoUrls.length);
      
      // Generate distance based on index to create variety (closer to beginning = closer distance)
      const baseDistance = (i * 0.5) + ((seed % 10) * 0.1);
      const distance = baseDistance.toFixed(1);
      
      // Make matching more relevant - pick meals that would likely match the restaurant type
      const relevantMeals = findRelevantMeals(meals, restaurantNames[nameIndex]);
      
      // Create a subset of relevant meals for this restaurant
      const numMealsToMatch = Math.min(
        Math.max(1, Math.ceil(relevantMeals.length * (1 - i/numRestaurants))),
        relevantMeals.length
      );
      
      // Create a unique shuffle based on restaurant and location
      const shuffledMeals = [...relevantMeals].sort(() => {
        return 0.5 - Math.random() * (seed / 100);
      });
      
      const matchedMeals = shuffledMeals.slice(0, numMealsToMatch);
      
      // Generate rating with slight variations - better matches get better ratings
      const matchFactor = matchedMeals.length / Math.max(1, meals.length);
      const baseRating = 3.5 + (matchFactor * 1) + ((seed % 15) / 30);
      const rating = Math.min(5, Math.max(3, baseRating));
      
      // Price level varies with rating and distance
      const priceLevel = "$".repeat(1 + (Math.floor(rating) % 3));
      
      mockRestaurants.push({
        id: `r${i+1}-${seed}`,
        name: restaurantNames[nameIndex],
        address: `${(123 + (seed % 877))} ${addresses[addressIndex]}, ${locationString}`,
        distance: `${distance} miles`,
        rating,
        priceLevel,
        photoUrl: photoUrls[photoIndex],
        matchingMeals: matchedMeals,
      });
    }
    
    // Sort by relevance (number of matching meals) and then by distance
    mockRestaurants.sort((a, b) => {
      // First sort by number of matching meals (descending)
      const matchDiff = b.matchingMeals.length - a.matchingMeals.length;
      if (matchDiff !== 0) return matchDiff;
      
      // Then sort by distance (ascending)
      const distA = parseFloat(a.distance.split(' ')[0]);
      const distB = parseFloat(b.distance.split(' ')[0]);
      return distA - distB;
    });

    return mockRestaurants;
  };

  // Helper function to extract cuisine types from meal names
  const extractCuisineTypes = (meals: string[]): string[] => {
    const cuisineKeywords = {
      italian: ["pasta", "pizza", "lasagna", "risotto", "spaghetti", "carbonara", "parmigiana"],
      asian: ["stir fry", "noodle", "tofu", "rice", "soy", "wok", "curry", "thai", "chinese", "japanese", "sushi"],
      mexican: ["taco", "burrito", "quesadilla", "enchilada", "salsa", "guacamole", "fajita"],
      mediterranean: ["hummus", "falafel", "greek", "olive", "pita", "mediterranean", "kebab"],
      american: ["burger", "sandwich", "grill", "bbq", "barbecue", "steak", "fried chicken"],
      healthy: ["bowl", "salad", "wrap", "smoothie", "avocado", "quinoa", "kale", "vegan", "vegetarian"],
      seafood: ["fish", "shrimp", "seafood", "salmon", "tuna", "crab", "lobster"]
    };
    
    const cuisineMatches: Record<string, number> = {
      italian: 0,
      asian: 0,
      mexican: 0,
      mediterranean: 0,
      american: 0,
      healthy: 0,
      seafood: 0
    };
    
    // Count matches for each cuisine type
    meals.forEach(meal => {
      const mealLower = meal.toLowerCase();
      
      Object.entries(cuisineKeywords).forEach(([cuisine, keywords]) => {
        keywords.forEach(keyword => {
          if (mealLower.includes(keyword)) {
            cuisineMatches[cuisine]++;
          }
        });
      });
    });
    
    // Get cuisines with at least one match, sorted by number of matches
    const matchedCuisines = Object.entries(cuisineMatches)
      .filter(([_, count]) => count > 0)
      .sort(([_, countA], [__, countB]) => countB - countA)
      .map(([cuisine]) => cuisine);
    
    // If no specific matches, include some general options
    return matchedCuisines.length > 0 ? matchedCuisines : ["healthy", "american"];
  };

  // Generate restaurant names based on cuisine types
  const getRelevantRestaurantNames = (cuisineTypes: string[]): string[] => {
    const restaurantsByType: Record<string, string[]> = {
      italian: [
        "Bella Pasta", "Roma Trattoria", "Little Italy", "Pasta Paradise",
        "Nonna's Kitchen", "La Piazza", "Mamma Mia", "The Olive Grove"
      ],
      asian: [
        "Golden Dragon", "Wok Star", "Bamboo Garden", "Spice Route",
        "Tokyo Express", "Thai Orchid", "Noodle House", "Fusion Kitchen"
      ],
      mexican: [
        "El Mariachi", "Taco Fiesta", "Casa Mexico", "Cantina", 
        "Jalapeño Kitchen", "Salsa Fresh", "Cinco de Mayo", "Azteca"
      ],
      mediterranean: [
        "Olive & Vine", "Greek Islands", "Falafel House", "Mediterranean Plate",
        "Santorini", "Aegean Grill", "The Hummus Bar", "Levantine Kitchen"
      ],
      american: [
        "Classic Diner", "Grill House", "Main Street Bistro", "American Table",
        "Burger Joint", "Homestyle Kitchen", "Capital Grill", "Smokehouse"
      ],
      healthy: [
        "Green Kitchen", "Fresh Plate", "Nourish", "Clean Eats",
        "Harvest Bowl", "Balanced Bites", "Pure Food", "Vital Greens"
      ],
      seafood: [
        "Ocean Blue", "Captain's Table", "Lighthouse", "The Fish Market",
        "Seaside Grill", "Bay Catch", "Pearl Diver", "Shrimp Shack"
      ]
    };
    
    // Collect restaurant names for matched cuisine types
    const result: string[] = [];
    cuisineTypes.forEach(cuisine => {
      if (restaurantsByType[cuisine]) {
        result.push(...restaurantsByType[cuisine]);
      }
    });
    
    // Add some general/healthy options to ensure enough variety
    if (result.length < 10) {
      result.push(
        "The Local Eatery",
        "Fresh & Wild",
        "Wholesome Table", 
        "Neighborhood Kitchen",
        "Family Dining"
      );
    }
    
    return result;
  };

  // Find which meals match a restaurant by name
  const findRelevantMeals = (meals: string[], restaurantName: string): string[] => {
    // Convert restaurant name to lowercase for comparison
    const restaurantLower = restaurantName.toLowerCase();
    
    // Define keywords associated with restaurant types
    const restaurantKeywords: Record<string, string[]> = {
      italian: ["pasta", "pizza", "italy", "italian", "roma", "bella", "piazza", "nonna", "olive"],
      asian: ["wok", "dragon", "bamboo", "tokyo", "thai", "noodle", "fusion", "spice"],
      mexican: ["taco", "mariachi", "mexico", "cantina", "jalapeño", "salsa", "cinco", "azteca"],
      mediterranean: ["olive", "greek", "falafel", "mediterranean", "santorini", "aegean", "hummus", "levantine"],
      american: ["diner", "grill", "bistro", "american", "burger", "homestyle", "smokehouse"],
      healthy: ["green", "fresh", "nourish", "clean", "harvest", "balanced", "pure", "vital"],
      seafood: ["ocean", "captain", "lighthouse", "fish", "seaside", "bay", "pearl", "shrimp"]
    };
    
    // Determine restaurant type based on name
    let matchedType = "";
    for (const [type, keywords] of Object.entries(restaurantKeywords)) {
      if (keywords.some(keyword => restaurantLower.includes(keyword))) {
        matchedType = type;
        break;
      }
    }
    
    if (!matchedType) {
      // Default to returning a subset of meals if no specific match
      return meals.slice(0, 2);
    }
    
    // Find meals that match the restaurant type
    return meals.filter(meal => {
      const mealLower = meal.toLowerCase();
      
      // Check if meal contains keywords related to the restaurant type
      const relevantKeywords = restaurantKeywords[matchedType];
      for (const keyword of relevantKeywords) {
        if (mealLower.includes(keyword)) {
          return true;
        }
      }
      
      // Additional specialized checks based on cuisine type
      switch (matchedType) {
        case "italian":
          return /pasta|pizza|italian|parm|risotto|lasagna|spagh|garlic bread|bruschetta/i.test(mealLower);
        case "asian":
          return /rice|noodle|stir|fry|wok|sushi|roll|curry|thai|teriyaki|tofu|dumpling/i.test(mealLower);
        case "mexican":
          return /taco|burrito|enchilada|quesadilla|mexican|guac|salsa|tortilla|chile/i.test(mealLower);
        case "healthy":
          return /salad|bowl|greens|fresh|kale|quinoa|avocado|vegan|vegetarian|gluten|plant/i.test(mealLower);
        case "seafood":
          return /fish|shrimp|seafood|salmon|tuna|crab|lobster|scallop|prawn|oyster/i.test(mealLower);
      }
      
      // Include a small percentage of meals that don't strongly match but could be served anywhere
      return Math.random() > 0.9;
    });
  };

  const handleSearch = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enter your location or allow location access",
        variant: "destructive",
      });
      return;
    }

    if (selectedMeals.length === 0) {
      toast({
        title: "No Meals Selected",
        description: "Please select at least one meal to search for",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRestaurants([]);

    try {
      // In a real app, you would call a restaurant API
      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fix the restaurant generation by ensuring we pass valid parameters
      console.log("Generating restaurants with meals:", selectedMeals);
      const mockRestaurants = generateRestaurants(location, selectedMeals, userLocation || undefined);
      console.log("Generated restaurants:", mockRestaurants);

      setRestaurants(mockRestaurants);
      
      if (mockRestaurants.length === 0) {
        toast({
          title: "No Results",
          description: "No restaurants serving your selected meals were found in this area.",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${mockRestaurants.length} restaurants near ${location}.`,
        });
      }
    } catch (error) {
      console.error("Error searching restaurants:", error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for restaurants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half-star" className="relative">
          <Star className="h-4 w-4 text-gray-300" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
        </div>
      );
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-10 bg-gray-50">
        <div className="container">
          <h1 className="text-3xl font-bold mb-2">Restaurant Finder</h1>
          <p className="text-gray-600 mb-6">
            Find restaurants serving meals similar to your saved recipes or meal plan
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <Card className="premium-card">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="location" className="premium-heading block mb-1">Your Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          placeholder="Enter city, zip code, or address"
                          className="pl-9 premium-input"
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            setLocationError(null);
                          }}
                        />
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs flex items-center gap-1"
                          onClick={getUserLocation}
                          disabled={isLocating}
                        >
                          {isLocating ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Locating...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" /> Use my location
                            </>
                          )}
                        </Button>
                        
                        {locationError && (
                          <span className="text-xs text-red-500 ml-2 flex-1">{locationError}</span>
                        )}
                      </div>

                      {userLocation && (
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <Info className="h-3 w-3 mr-1" />
                          <span>Using coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="premium-heading mb-2">Select Meals to Find</h3>
                      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="recipes">Saved Recipes</TabsTrigger>
                          <TabsTrigger value="mealplan">My Meal Plan</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="recipes" className="pt-3">
                          {savedRecipes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No saved recipes found</p>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {savedRecipes.map((recipe) => (
                                <div 
                                  key={recipe.id}
                                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                                    selectedMeals.includes(recipe.title) ? "bg-primary/10 border border-primary/40" : "border border-transparent"
                                  }`}
                                  onClick={() => handleMealSelect(recipe.title)}
                                >
                                  <div className="h-10 w-10 rounded overflow-hidden mr-2">
                                    <img 
                                      src={recipe.image} 
                                      alt={recipe.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="text-sm font-medium truncate">{recipe.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {recipe.nutrition?.calories 
                                        ? `${Math.round(recipe.nutrition.calories)} calories` 
                                        : "Calories: N/A"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="mealplan" className="pt-3">
                          {mealPlans.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No meal plan created yet</p>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {mealPlans.map((meal) => (
                                <div 
                                  key={meal.id}
                                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                                    selectedMeals.includes(meal.recipeTitle) ? "bg-primary/10 border border-primary/40" : "border border-transparent"
                                  }`}
                                  onClick={() => handleMealSelect(meal.recipeTitle)}
                                >
                                  <div className="h-10 w-10 rounded overflow-hidden mr-2">
                                    <img 
                                      src={meal.recipeImage} 
                                      alt={meal.recipeTitle}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <div className="text-sm font-medium truncate">{meal.recipeTitle}</div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      <span className="capitalize mr-1">{meal.mealType}</span>
                                      <span>·</span>
                                      <span className="ml-1">{meal.day}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                    
                    <Button 
                      onClick={handleSearch} 
                      disabled={isLoading || !location || selectedMeals.length === 0}
                      className="w-full premium-button"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Find Restaurants
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {isLoading ? (
                  <Card className="p-8 flex justify-center items-center">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-lg font-medium">Searching restaurants near {location}...</p>
                      <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
                    </div>
                  </Card>
                ) : restaurants.length > 0 ? (
                  restaurants.map((restaurant) => (
                    <Card key={restaurant.id} className="premium-card overflow-hidden">
                      <div className="md:flex">
                        {restaurant.photoUrl && (
                          <div className="md:w-1/3 h-40 md:h-auto">
                            <img 
                              src={restaurant.photoUrl} 
                              alt={restaurant.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-5 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{restaurant.name}</h3>
                            <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                              {restaurant.distance}
                            </div>
                          </div>
                          
                          <div className="flex items-center mb-3">
                            <div className="flex mr-3">
                              {renderStars(restaurant.rating)}
                            </div>
                            <span className="text-sm">{restaurant.rating.toFixed(1)}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{restaurant.priceLevel}</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            <MapPin className="h-4 w-4 inline-block mr-1" />
                            {restaurant.address}
                          </p>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1 flex items-center">
                              <Utensils className="h-4 w-4 mr-1" />
                              Matching Meals:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.matchingMeals && restaurant.matchingMeals.length > 0 ? (
                                restaurant.matchingMeals.map((meal, index) => (
                                  <span 
                                    key={index}
                                    className="text-xs bg-secondary/70 text-secondary-foreground rounded-full px-2 py-0.5"
                                  >
                                    {meal}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No specific meal matches</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-sm"
                              onClick={() => {
                                // Open in Google Maps
                                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  restaurant.name + ' ' + restaurant.address
                                )}`;
                                window.open(mapUrl, '_blank');
                              }}
                            >
                              Get Directions
                            </Button>
                            <Button 
                              size="sm" 
                              className="text-sm ml-2 premium-button"
                              onClick={() => {
                                toast({
                                  title: "Menu Unavailable",
                                  description: "Restaurant menu is not available in this demo version.",
                                });
                              }}
                            >
                              View Menu
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Card className="p-8">
                      <div className="flex flex-col items-center">
                        {locationError ? (
                          <Alert variant="destructive" className="mb-4 max-w-md">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Location Error</AlertTitle>
                            <AlertDescription>{locationError}</AlertDescription>
                          </Alert>
                        ) : (
                          <Search className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        )}
                        <h3 className="text-lg font-medium mb-2">No restaurants found</h3>
                        <p className="text-gray-500 max-w-md text-center">
                          {locationError 
                            ? "Please enable location services or enter your location manually to search for restaurants."
                            : "Select your location and meals, then click \"Find Restaurants\" to search for restaurants."}
                        </p>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RestaurantFinder;
