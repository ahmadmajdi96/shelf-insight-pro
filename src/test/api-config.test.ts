import { describe, it, expect } from 'vitest';
import { getApiBaseUrl, getApiKey, setApiBaseUrl } from '@/lib/api-config';

describe('api-config', () => {
  it('should return a base URL', () => {
    const url = getApiBaseUrl();
    expect(url).toBeTruthy();
    expect(typeof url).toBe('string');
  });

  it('should return an API key', () => {
    const key = getApiKey();
    expect(typeof key).toBe('string');
  });

  it('should strip trailing slashes when setting URL', () => {
    setApiBaseUrl('https://test.com///');
    const url = getApiBaseUrl();
    expect(url).not.toMatch(/\/$/);
  });
});
