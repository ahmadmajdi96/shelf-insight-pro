// Configurable API base URL for the ShelfVision backend
const STORAGE_KEY = 'shelfvision_api_url';

// Default to the Supabase (Lovable Cloud) URL from env
function getDefaultUrl(): string {
  // Use Vite env variable if available (browser context)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  return 'https://jcmtiompmpafqwqlichh.supabase.co';
}

export function getApiBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || getDefaultUrl();
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ''));
}

// Get the anon/apikey for Supabase requests
export function getApiKey(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  }
  return '';
}
