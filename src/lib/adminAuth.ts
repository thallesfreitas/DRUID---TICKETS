/**
 * Admin token storage (localStorage)
 */

const KEY = 'admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(KEY);
}
