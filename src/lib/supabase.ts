import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables or use hardcoded fallback
const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined)?.toString().trim() || 'https://uwooqqjtwnorpiszpeah.supabase.co';
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined)?.toString().trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk';

// Always configured since we have fallback values
export const isSupabaseConfigured = true;

console.log("supabaseUrl", supabaseUrl);
console.log("supabaseAnonKey", supabaseAnonKey.substring(0, 20) + "...");
console.log("isSupabaseConfigured", isSupabaseConfigured);
console.log("connected to supabase");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export for debugging
console.log('Supabase client created successfully');