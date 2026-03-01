import { getApiBaseUrl } from './api-config';

const PUBLIC_BUCKETS = new Set(['dataset-images', 'shelf-images', 'sku-training-images']);

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function resolveImageUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;

  const baseUrl = safeUrl(getApiBaseUrl());
  const parsed = safeUrl(rawUrl);
  if (!baseUrl || !parsed) return rawUrl;

  // Normalize legacy internal links to the configured backend origin to avoid mixed-content issues.
  if (parsed.pathname.startsWith('/api/v1/download-shared-object/')) {
    return `${baseUrl.origin}${parsed.pathname}${parsed.search}`;
  }

  // Normalize backend storage URLs for known public buckets.
  if (parsed.origin === baseUrl.origin) {
    const match = parsed.pathname.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = decodeURIComponent(match[1]);
      const objectPath = match[2];

      if (bucket === 'public') return rawUrl;

      if (PUBLIC_BUCKETS.has(bucket)) {
        return `${baseUrl.origin}/storage/v1/object/public/${bucket}/${objectPath}${parsed.search}`;
      }
    }
  }

  return rawUrl;
}

export function shouldFetchWithAuth(rawUrl: string): boolean {
  const resolved = resolveImageUrl(rawUrl);
  const baseUrl = safeUrl(getApiBaseUrl());
  const parsed = safeUrl(resolved);
  if (!baseUrl || !parsed) return false;

  if (parsed.origin !== baseUrl.origin) return false;
  if (parsed.pathname.startsWith('/storage/v1/object/public/')) return false;
  if (parsed.pathname.startsWith('/api/v1/download-shared-object/')) return false;

  return true;
}
