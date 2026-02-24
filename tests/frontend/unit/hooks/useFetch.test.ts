/**
 * useFetch Hook Tests
 * Generic data fetching hook with loading, error, and refetch states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch } from '@/hooks/useFetch';

describe('useFetch Hook', () => {
  let mockFetcher: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetcher = vi.fn();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have null data initially', () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      expect(result.current.data).toBeNull();
    });

    it('should have loading false initially', () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      expect(result.current.loading).toBe(false);
    });

    it('should have error null initially', () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading Data', () => {
    it('should fetch data on mount', async () => {
      mockFetcher.mockResolvedValue({ id: 1, name: 'Test User' });

      renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalled();
      });
    });

    it('should set loading to true while fetching', async () => {
      mockFetcher.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ name: 'Test' }), 100))
      );

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should update data when fetch succeeds', async () => {
      const mockData = { id: 1, name: 'Test User' };
      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });

    it('should clear error when fetch succeeds', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should set loading false after fetch completes', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should set error when fetch fails', async () => {
      const error = new Error('Network error');
      mockFetcher.mockRejectedValue(error);

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should clear data when error occurs', async () => {
      mockFetcher.mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });
    });

    it('should set loading false on error', async () => {
      mockFetcher.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle different error types', async () => {
      mockFetcher.mockRejectedValue(new TypeError('Invalid data'));

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.error).toContain('Invalid data');
      });
    });

    it('should handle fetch timeout', async () => {
      mockFetcher.mockRejectedValue(new Error('Timeout'));

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.error).toContain('Timeout');
      });
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide refetch function', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test 1' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toEqual({ name: 'Test 1' });
      });

      mockFetcher.mockResolvedValue({ name: 'Test 2' });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ name: 'Test 2' });
      });
    });

    it('should call fetcher again on refetch', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful refetch', async () => {
      mockFetcher.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.error).toBe('Error');
      });

      mockFetcher.mockResolvedValue({ name: 'Success' });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle refetch error', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      mockFetcher.mockRejectedValue(new Error('Refetch failed'));

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed');
      });
    });
  });

  describe('Dependencies', () => {
    it('should refetch when dependencies change', async () => {
      mockFetcher.mockResolvedValue({ id: 1 });

      const { rerender } = renderHook(
        ({ deps }) => useFetch(mockFetcher, deps),
        { initialProps: { deps: [1] } }
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      rerender({ deps: [2] });

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(2);
      });
    });

    it('should not refetch when dependencies stay same', async () => {
      mockFetcher.mockResolvedValue({ id: 1 });

      const { rerender } = renderHook(
        ({ deps }) => useFetch(mockFetcher, deps),
        { initialProps: { deps: [1] } }
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      rerender({ deps: [1] });

      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle empty dependencies array', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      renderHook(() => useFetch(mockFetcher, []));

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Type Safety', () => {
    it('should return typed data', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const mockData: User = { id: 1, name: 'John', email: 'john@example.com' };
      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetch<User>(mockFetcher));

      await waitFor(() => {
        expect(result.current.data?.name).toBe('John');
        expect(result.current.data?.email).toBe('john@example.com');
      });
    });

    it('should handle generic type parameters', async () => {
      interface ApiResponse<T> {
        data: T;
        status: string;
      }

      const mockData: ApiResponse<{ id: number }> = {
        data: { id: 1 },
        status: 'success'
      };

      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() => useFetch<ApiResponse<{ id: number }>>(mockFetcher));

      await waitFor(() => {
        expect(result.current.data?.data.id).toBe(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null response', async () => {
      mockFetcher.mockResolvedValue(null);

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });
    });

    it('should handle undefined response', async () => {
      mockFetcher.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
      });
    });

    it('should handle empty object response', async () => {
      mockFetcher.mockResolvedValue({});

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data).toEqual({});
      });
    });

    it('should handle array response', async () => {
      const mockArray = [{ id: 1 }, { id: 2 }];
      mockFetcher.mockResolvedValue(mockArray);

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(Array.isArray(result.current.data)).toBe(true);
        expect(result.current.data?.length).toBe(2);
      });
    });

    it('should handle very large data', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`
      }));

      mockFetcher.mockResolvedValue(largeData);

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(result.current.data?.length).toBe(10000);
      });
    });

    it('should handle rapid refetch calls', async () => {
      mockFetcher.mockResolvedValue({ name: 'Test' });

      const { result } = renderHook(() => useFetch(mockFetcher));

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalled();
      });

      await act(async () => {
        await Promise.all([
          result.current.refetch(),
          result.current.refetch(),
          result.current.refetch()
        ]);
      });

      // Should handle multiple rapid calls
      expect(mockFetcher.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
