import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const hasValidConfig = supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase_project_url') &&
  !supabaseAnonKey.includes('your_supabase_anon_key');

if (!hasValidConfig) {
  console.warn('Missing or invalid Supabase environment variables. Using fallback configuration for build.');
}

// Create client with fallback for build
export const supabase = hasValidConfig
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

// Hook for client components
export const useSupabase = () => {
  return { supabase };
};

// Helper types for better TypeScript support
export type Tables = Database['public']['Tables'];
export type UserRow = Tables['users']['Row'];
export type UserFlowProgressRow = Tables['user_flow_progress']['Row'];

// Export a function for compatibility with existing imports
export function createServiceClient() {
  return supabase;
}
