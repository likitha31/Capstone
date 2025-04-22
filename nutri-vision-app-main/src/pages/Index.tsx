
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Apple, UtensilsCrossed, LineChart, Camera, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      title: "Ingredient-Based Recipes",
      description: "Input ingredients you already have and get personalized recipe recommendations.",
      icon: Apple,
    },
    {
      title: "Personalized Nutrition",
      description: "Recommendations tailored to your dietary goals, preferences, and restrictions.",
      icon: UtensilsCrossed,
    },
    {
      title: "Nutrition Tracking",
      description: "Monitor your daily nutrition intake and progress towards your health goals.",
      icon: LineChart,
    },
    {
      title: "Multiple Input Methods",
      description: "Add ingredients by text, voice, or by taking pictures of your food items.",
      icon: Camera,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-nutri-green-light/10 to-nutri-blue-light/10 py-16 md:py-24">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Turn Your Ingredients Into 
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-nutri-green to-nutri-blue"> Healthy Meals</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-md">
                  Personalized recipe recommendations based on what you have, aligned with your health goals and dietary preferences.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="premium-button">
                    <Link to="/recipes">
                      Find Recipes <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/profile">Create Profile</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-nutri-green/20 rounded-full blur-3xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="Healthy Food" 
                  className="rounded-lg shadow-xl mx-auto animate-scale-in"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">How Nutri-Vision Works</h2>
              <p className="text-gray-600">
                Get personalized meal recommendations in just a few simple steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="premium-card p-6 text-center">
                <div className="w-12 h-12 bg-nutri-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-nutri-green font-bold">1</span>
                </div>
                <h3 className="premium-heading text-xl mb-2">Enter Your Ingredients</h3>
                <p className="premium-subheading">
                  Input ingredients you have using text, voice, or by taking pictures.
                </p>
              </div>
              
              <div className="premium-card p-6 text-center">
                <div className="w-12 h-12 bg-nutri-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-nutri-blue font-bold">2</span>
                </div>
                <h3 className="premium-heading text-xl mb-2">Set Your Preferences</h3>
                <p className="premium-subheading">
                  Add your dietary goals, preferences, and any food allergies or restrictions.
                </p>
              </div>
              
              <div className="premium-card p-6 text-center">
                <div className="w-12 h-12 bg-nutri-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-nutri-green font-bold">3</span>
                </div>
                <h3 className="premium-heading text-xl mb-2">Get Personalized Recipes</h3>
                <p className="premium-subheading">
                  Receive recipe suggestions optimized for your nutrition needs and available ingredients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Features You'll Love</h2>
              <p className="text-gray-600">
                Designed to make healthy eating simple and personalized
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-nutri-green to-nutri-blue-light rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="premium-heading text-xl mb-2">{feature.title}</h3>
                    <p className="premium-subheading">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-nutri-green to-nutri-blue-light">
          <div className="container text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Start Your Healthy Eating Journey Today</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Discover delicious, nutritious recipes personalized just for you
            </p>
            <Button asChild size="lg" className="bg-white text-nutri-green hover:bg-white/90">
              <Link to="/profile">
                Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
