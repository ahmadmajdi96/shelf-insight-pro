// Configurable API base URL for the ShelfVision backend
const STORAGE_KEY = 'shelfvision_api_url';

// Default backend URL
function getDefaultUrl(): string {
  return 'https://iralpha.backend.cortanexai.com';
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
