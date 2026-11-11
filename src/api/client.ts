const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('sim_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('sim_token', token);
  } else {
    localStorage.removeItem('sim_token');
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string; token?: string; user?: any }> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Error ${res.status}: ${res.statusText}`,
      };
    }
    return data;
  } catch (err: any) {
    console.error('API Error:', err);
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server',
    };
  }
}
