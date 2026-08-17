/**
 * Application Runtime Configuration
 */

export const CONFIG = {
  isSupabaseEnabled: Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ),
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};
