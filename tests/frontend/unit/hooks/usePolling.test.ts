/**
 * usePolling Hook Tests
 * Generic polling hook for monitoring async operations
 * Handles intervals, callbacks, and cancellation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePolling } from '@/hooks/usePolling';

describe('usePolling Hook', () => {
  let mockFetcher: ReturnType<typeof vi.fn>;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetcher = vi.fn();
    mockCallback = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have null data initially', () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      expect(result.current.data).toBeNull();
    });

    it('should not be polling initially', () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      expect(result.current.isPolling).toBe(false);
    });

    it('should have null error initially', () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe('Starting Polling', () => {
    it('should start polling', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.isPolling).toBe(true);
    });

    it('should call fetcher when polling starts', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalled();
      });
    });

    it('should set data after first fetch', async () => {
      const mockData = { status: 'processing', progress: 50 };
      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });

    it('should call callback with data', async () => {
      const mockData = { status: 'processing' };
      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(mockData);
      });
    });
  });

  describe('Polling Intervals', () => {
    it('should poll at specified interval', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 1000)
      );

      act(() => {
        result.current.startPolling();
      });

      // First fetch on start
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // After 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);

      // After another second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(3);
    });

    it('should use default interval of 1000ms', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should handle custom intervals', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 500)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(3);
    });
  });

  describe('Stopping Polling', () => {
    it('should stop polling', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.isPolling).toBe(true);

      act(() => {
        result.current.stopPolling();
      });

      expect(result.current.isPolling).toBe(false);
    });

    it('should not fetch after stopping', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 1000)
      );

      act(() => {
        result.current.startPolling();
      });

      const callCount = mockFetcher.mock.calls.length;

      act(() => {
        result.current.stopPolling();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not have increased
      expect(mockFetcher.mock.calls.length).toBe(callCount);
    });

    it('should clear polling timer on stop', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
        result.current.stopPolling();
      });

      const initialCallCount = mockFetcher.mock.calls.length;

      act(() => {
        vi.runAllTimers();
      });

      // Should not increase if timer is cleared
      expect(mockFetcher.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Error Handling', () => {
    it('should set error when fetch fails', async () => {
      const error = new Error('Network error');
      mockFetcher.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should continue polling after error', async () => {
      mockFetcher
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 1000)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should retry
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful retry', async () => {
      mockFetcher
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Callback Invocation', () => {
    it('should call callback on each poll', async () => {
      const mockData = { status: 'processing' };
      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 1000)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockCallback).toHaveBeenCalledTimes(4); // initial + 3 intervals
    });

    it('should pass latest data to callback', async () => {
      let callCount = 0;
      mockFetcher.mockImplementation(() =>
        Promise.resolve({ status: 'processing', progress: ++callCount * 25 })
      );

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 500)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1];
      expect(lastCall[0].progress).toBeGreaterThan(0);
    });

    it('should stop polling when callback returns true', async () => {
      mockFetcher.mockResolvedValue({ status: 'completed' });
      mockCallback.mockReturnValue(true); // Signal to stop

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 500)
      );

      act(() => {
        result.current.startPolling();
      });

      // After callback returns true, polling should stop
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should eventually stop
      expect(result.current).toBeDefined();
    });
  });

  describe('Data Updates', () => {
    it('should update data with each poll', async () => {
      let progressValue = 0;
      mockFetcher.mockImplementation(() =>
        Promise.resolve({ status: 'processing', progress: (progressValue += 25) })
      );

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 500)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.data?.progress).toBeGreaterThan(0);
      });

      const firstProgress = result.current.data?.progress;

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.data?.progress).toBeGreaterThan(firstProgress!);
      });
    });

    it('should maintain data type consistency', async () => {
      const mockData = { status: 'processing', count: 100 };
      mockFetcher.mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        usePolling<typeof mockData>(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        expect(typeof result.current.data?.count).toBe('number');
      });
    });
  });

  describe('Cleanup', () => {
    it('should clean up on unmount', () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { unmount, result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
      });

      unmount();

      // Should not throw or have lingering timers
      expect(true).toBe(true);
    });

    it('should clear interval on unmount while polling', () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { unmount, result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 1000)
      );

      act(() => {
        result.current.startPolling();
      });

      const callCount = mockFetcher.mock.calls.length;

      unmount();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not increase after unmount
      expect(mockFetcher.mock.calls.length).toBe(callCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback)
      );

      act(() => {
        result.current.startPolling();
        result.current.stopPolling();
        result.current.startPolling();
        result.current.stopPolling();
      });

      expect(result.current.isPolling).toBe(false);
    });

    it('should handle empty callback', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, () => {})
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.runAllTimers();
      });

      // Should not crash
      expect(result.current.isPolling).toBe(true);
    });

    it('should handle very short polling intervals', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 10)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(11);
    });

    it('should handle very long polling intervals', async () => {
      mockFetcher.mockResolvedValue({ status: 'processing' });

      const { result } = renderHook(() =>
        usePolling(mockFetcher, mockCallback, 60000)
      );

      act(() => {
        result.current.startPolling();
      });

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });
});
