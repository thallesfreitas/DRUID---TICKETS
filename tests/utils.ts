/**
 * Test utilities and helpers
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi } from 'vitest';

/**
 * Custom render function with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Wait for async operations with timeout
 */
export async function waitForAsync(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse<T = any>(
  data: T,
  status = 200,
  statusText = 'OK'
): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a mock fetch error response
 */
export function createMockFetchErrorResponse(
  message: string,
  status = 400,
  statusText = 'Bad Request'
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Setup global fetch mock with responses
 */
export function setupFetchMock(responses: Map<string, Response>) {
  global.fetch = vi.fn((url: string) => {
    const response = responses.get(url);
    if (response) {
      return Promise.resolve(response.clone());
    }
    return Promise.reject(new Error(`No mock response for ${url}`));
  }) as any;
}

/**
 * Get last fetch call arguments
 */
export function getLastFetchCall() {
  const calls = (global.fetch as any).mock.calls;
  if (calls.length === 0) return null;
  return calls[calls.length - 1];
}

/**
 * Get all fetch call URLs
 */
export function getAllFetchUrls() {
  const calls = (global.fetch as any).mock.calls;
  return calls.map((call: any[]) => call[0]);
}

/**
 * Clear all fetch mocks
 */
export function clearFetchMocks() {
  (global.fetch as any).mockClear();
}

/**
 * Format date for comparisons in tests
 */
export function formatTestDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Create test IP address
 */
export function createTestIP(octet: number = 1): string {
  return `192.168.1.${octet}`;
}

/**
 * Create test promo code
 */
export function createTestCode(index: number = 1): string {
  return `CODE${String(index).padStart(4, '0')}`;
}

/**
 * Deep clone an object (for test fixtures)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
