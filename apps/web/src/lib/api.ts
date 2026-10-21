import type { HistoryItem } from '../types';

const API_BASE_STORAGE_KEY = 'bg_remover_api_base';
const API_TOKEN_STORAGE_KEY = 'bg_remover_api_token';

export function getApiBaseUrl(): string {
  return localStorage.getItem(API_BASE_STORAGE_KEY) || (import.meta.env.VITE_API_URL as string) || '';
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(API_BASE_STORAGE_KEY, url);
}

export function getApiToken(): string {
  return localStorage.getItem(API_TOKEN_STORAGE_KEY) || (import.meta.env.VITE_API_TOKEN as string) || '';
}

export function setApiToken(token: string): void {
  localStorage.setItem(API_TOKEN_STORAGE_KEY, token);
}

export async function fetchHealth(): Promise<{ ok: boolean; timestamp: number }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchHistory(limit = 20, offset = 0): Promise<{ items: HistoryItem[]; total: number }> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/api/history?limit=${limit}&offset=${offset}`, { headers });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to fetch history (${res.status}): ${errorBody}`);
  }

  return res.json();
}

export async function uploadHistoryImage(
  cutoutBlob: Blob,
  metadata: {
    originalFilename: string;
    width: number;
    height: number;
    modelUsed: string;
    bgConfigJson?: string;
  },
  originalBlob?: Blob
): Promise<{ id: string; cutoutUrl: string }> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  const formData = new FormData();
  formData.append('cutout', cutoutBlob, `${metadata.originalFilename}-cutout.png`);
  if (originalBlob) {
    formData.append('original', originalBlob, metadata.originalFilename);
  }
  formData.append('metadata', JSON.stringify(metadata));

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/api/history`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Upload failed (${res.status}): ${errorBody}`);
  }

  return res.json();
}

export async function deleteHistoryItem(id: string): Promise<{ deleted: boolean; id: string }> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/api/history/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Delete failed (${res.status}): ${errorBody}`);
  }

  return res.json();
}
