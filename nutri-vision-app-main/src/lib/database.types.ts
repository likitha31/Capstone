
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      allergies: {
        Row: {
          id: string
          user_id: string
          allergy_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          allergy_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          allergy_type?: string
          created_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          day: string
          meal_type: string
          recipe_id: number
          recipe_title: string
          recipe_image: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day: string
          meal_type: string
          recipe_id: number
          recipe_title: string
          recipe_image: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day?: string
          meal_type?: string
          recipe_id?: number
          recipe_title?: string
          recipe_image?: string
          created_at?: string
        }
      }
      nutrition_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          calories: number
          protein: number
          carbs: number
          fat: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          calories: number
          protein: number
          carbs: number
          fat: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          age: number | null
          gender: string | null
          weight: number | null
          height: number | null
          diet_goal: string | null
          dietary_preference: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          age?: number | null
          gender?: string | null
          weight?: number | null
          height?: number | null
          diet_goal?: string | null
          dietary_preference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          age?: number | null
          gender?: string | null
          weight?: number | null
          height?: number | null
          diet_goal?: string | null
          dietary_preference?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
