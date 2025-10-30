import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables or use hardcoded fallback
const rawUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined)?.toString().trim() || 'https://uwooqqjtwnorpiszpeah.supabase.co';
// Sanitize accidental leading '@' in provided URL
const supabaseUrl = rawUrl.replace(/^@/, '');
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined)?.toString().trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3b29xcWp0d25vcnBpc3pwZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEwODEsImV4cCI6MjA3NjAyNzA4MX0.-465t-JgYjYWe9hDnraWbne1y7aZIoSHDGtDVQ8IWKk';

// Enable Supabase (set false to force localStorage-only mode)
export const isSupabaseConfigured = true;

console.log("supabaseUrl", supabaseUrl);
console.log("supabaseAnonKey", supabaseAnonKey.substring(0, 20) + "...");
console.log("isSupabaseConfigured", isSupabaseConfigured);
console.log("connected to supabase");

// Create regular client for authenticated operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client that bypasses RLS for admin operations
// Note: In production, you should use a service role key from environment variables
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey
    }
  }
});

// Export for debugging
console.log('Supabase client created successfully');