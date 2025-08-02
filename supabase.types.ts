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
      users: {
        Row: {
          id: string
          created_at: string
          email: string | null
          phone: string | null
          language: string
          auth_provider: 'social' | 'email'
          is_profile_complete: boolean
          full_name: string | null
          avatar_url: string | null
          last_sign_in: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email?: string | null
          phone?: string | null
          language?: string
          auth_provider?: 'social' | 'email'
          is_profile_complete?: boolean
          full_name?: string | null
          avatar_url?: string | null
          last_sign_in?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string | null
          phone?: string | null
          language?: string
          auth_provider?: 'social' | 'email'
          is_profile_complete?: boolean
          full_name?: string | null
          avatar_url?: string | null
          last_sign_in?: string | null
        }
      }
      user_flow_progress: {
        Row: {
          id: string
          user_id: string
          completed_steps: string[]
          current_step: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          completed_steps?: string[]
          current_step?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          completed_steps?: string[]
          current_step?: string
          created_at?: string
          updated_at?: string
        }
      }
      verification_codes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          phone: string
          code: string
          expires_at: string
          is_used: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          phone: string
          code: string
          expires_at: string
          is_used?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          phone?: string
          code?: string
          expires_at?: string
          is_used?: boolean
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
  }
}
