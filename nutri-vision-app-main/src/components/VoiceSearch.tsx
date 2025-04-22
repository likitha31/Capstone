
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceSearchProps {
  onResult: (text: string) => void;
}

export function VoiceSearch({ onResult }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition on component mount
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new instance but don't start it yet
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      
      // Convert transcript to comma-separated ingredients
      const ingredients = transcript
        .split(/\s+/)  // Split on whitespace
        .filter(word => word.trim().length > 0) // Remove empty words
        .map(ingredient => ingredient.charAt(0).toUpperCase() + ingredient.slice(1).toLowerCase())  // Capitalize each ingredient
        .join(', ');  // Join with comma and space

      onResult(ingredients);
      setIsListening(false);
      toast({
        title: "Voice input captured",
        description: ingredients,
      });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
        toast({
          title: "Error",
          description: "Failed to capture voice input. Please try again.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          if (isListening) {
            recognitionRef.current.stop();
          }
        } catch (e) {
          console.error('Error cleaning up recognition:', e);
        }
      }
    };
  }, [onResult, toast]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({
        title: "Error",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
      }
    } else {
      // First, check for microphone permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          try {
            // Reset recognition instance to prevent previous errors from affecting new attempt
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onresult = recognitionRef.current!.onresult;
            recognition.onerror = recognitionRef.current!.onerror;
            recognition.onend = recognitionRef.current!.onend;
            
            recognitionRef.current = recognition;
            
            // Start the fresh recognition instance
            recognition.start();
            setIsListening(true);
            toast({
              title: "Listening",
              description: "Speak now to add ingredients...",
            });
          } catch (error) {
            console.error('Error starting recognition:', error);
            setIsListening(false);
            toast({
              title: "Error",
              description: "Failed to start voice recognition. Please try again.",
              variant: "destructive",
            });
          }
        })
        .catch(error => {
          console.error('Microphone permission error:', error);
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to use voice input.",
            variant: "destructive",
          });
        });
    }
  }, [isListening, toast]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleListening}
      className={isListening ? 'bg-red-100 hover:bg-red-200' : ''}
    >
      {isListening ? (
        <MicOff className="h-4 w-4 text-red-500" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
