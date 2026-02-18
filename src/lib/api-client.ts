import { getApiBaseUrl } from './api-config';

const TOKEN_KEY = 'shelfvision_access_token';
const USER_KEY = 'shelfvision_user';

// ─── Token Management ────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user: any | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

// ─── Auth state listeners ────────────────────────────────
type AuthListener = (event: string, session: any) => void;
const authListeners = new Set<AuthListener>();

export function onAuthChange(fn: AuthListener) {
  authListeners.add(fn);
  return () => { authListeners.delete(fn); };
}

function notifyAuth(event: string, session: any) {
  authListeners.forEach(fn => fn(event, session));
}

// ─── Base fetch helper ───────────────────────────────────
async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = getApiBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...opts, headers });
  return res;
}

async function apiFetchJSON(path: string, opts: RequestInit = {}) {
  const res = await apiFetch(path, opts);
  if (res.status === 204) return null;
  const body = await res.json();
  if (!res.ok) throw new Error(body?.detail || body?.error || `API error ${res.status}`);
  return body;
}

// ─── Auth ────────────────────────────────────────────────
export const auth = {
  async login(email: string, password: string) {
    // Use token endpoint for full token response
    const data = await apiFetchJSON('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) {
      setToken(data.access_token);
      const user = data.user || { id: data.sub, email };
      setStoredUser(user);
      notifyAuth('SIGNED_IN', { access_token: data.access_token, user });
    }
    return data;
  },

  async signup(email: string, password: string, data?: Record<string, unknown>) {
    const result = await apiFetchJSON('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data }),
    });
    return result;
  },

  async logout() {
    try {
      await apiFetch('/auth/v1/logout', { method: 'POST' });
    } catch { /* ignore */ }
    setToken(null);
    setStoredUser(null);
    notifyAuth('SIGNED_OUT', null);
  },

  getSession() {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) return null;
    return { access_token: token, user };
  },

  getUser() {
    return getStoredUser();
  },
};

// ─── REST (PostgREST-style) ──────────────────────────────
interface ListOptions {
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
  count?: boolean;      // use HEAD + Prefer: count=exact
  head?: boolean;       // HEAD request
}

export const rest = {
  async list(resource: string, opts: ListOptions = {}) {
    const params = new URLSearchParams();
    if (opts.select) params.set('select', opts.select);
    if (opts.filters) {
      Object.entries(opts.filters).forEach(([k, v]) => params.set(k, v));
    }
    if (opts.order) params.set('order', opts.order);
    if (opts.limit) params.set('limit', String(opts.limit));

    const qs = params.toString();
    const path = `/rest/v1/${resource}${qs ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {};
    if (opts.count) headers['Prefer'] = 'count=exact';

    if (opts.head) {
      const res = await apiFetch(path, { method: 'HEAD', headers });
      const countHeader = res.headers.get('content-range');
      const total = countHeader ? parseInt(countHeader.split('/').pop() || '0') : 0;
      return { data: null, count: total };
    }

    const data = await apiFetchJSON(path, { headers });
    return { data: Array.isArray(data) ? data : data ? [data] : [], count: Array.isArray(data) ? data.length : 0 };
  },

  async get(resource: string, id: string, opts: { select?: string } = {}) {
    const params = new URLSearchParams();
    params.set('id', `eq.${id}`);
    if (opts.select) params.set('select', opts.select);
    const path = `/rest/v1/${resource}?${params.toString()}`;
    const data = await apiFetchJSON(path);
    return Array.isArray(data) ? data[0] : data;
  },

  async create(resource: string, payload: any) {
    const data = await apiFetchJSON(`/rest/v1/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },

  async update(resource: string, filters: Record<string, string>, payload: any) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => params.set(k, v));
    const data = await apiFetchJSON(`/rest/v1/${resource}?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data;
  },

  async remove(resource: string, id: string) {
    await apiFetchJSON(`/rest/v1/${resource}?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── RPC ─────────────────────────────────────────────────
export async function rpc(fn: string, params: any) {
  return apiFetchJSON(`/rest/v1/rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ─── Edge Functions ──────────────────────────────────────
export async function invoke(fn: string, body: any) {
  return apiFetchJSON(`/functions/v1/${fn}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Storage ─────────────────────────────────────────────
export const storage = {
  async upload(bucket: string, path: string, file: File) {
    const base = getApiBaseUrl();
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err?.error || err?.detail || 'Upload failed');
    }

    return await res.json();
  },

  async uploadMultiple(bucket: string, path: string, files: File[], metadata?: Record<string, string>) {
    const base = getApiBaseUrl();
    const token = getToken();
    const formData = new FormData();

    if (metadata) {
      Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));
    }

    files.forEach(file => formData.append('files', file));

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err?.error || err?.detail || 'Upload failed');
    }

    return await res.json();
  },

  getPublicUrl(bucket: string, path: string) {
    return `${getApiBaseUrl()}/storage/v1/object/${bucket}/${path}`;
  },
};

// ─── Convenience: API object ─────────────────────────────
export const api = { auth, rest, rpc, invoke, storage };
export default api;
