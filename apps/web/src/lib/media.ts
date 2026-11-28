const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export function resolveMediaUrl(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
}
