// Configurable API base URL for the ShelfVision backend
const STORAGE_KEY = 'shelfvision_api_url';
const DEFAULT_URL = 'https://egg-equipment-microwave-holes.trycloudflare.com';

export function getApiBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ''));
}
