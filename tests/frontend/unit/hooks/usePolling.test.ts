import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePolling } from '@/hooks/usePolling';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('usePolling', () => {
  it('starts polling and performs first fetch immediately', async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 'processing' });
    const onComplete = vi.fn();

    const { result } = renderHook(() => usePolling(fetcher, onComplete, 10));

    act(() => {
      result.current.startPolling();
    });

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(result.current.isPolling).toBe(true);
    expect(onComplete).toHaveBeenCalledWith({ status: 'processing' });
  });

  it('polls again at each interval tick', async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 'processing' });

    const { result } = renderHook(() => usePolling(fetcher, undefined, 10));

    act(() => {
      result.current.startPolling();
    });

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(3));
  });

  it('stops polling when stopPolling is called', async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 'processing' });

    const { result } = renderHook(() => usePolling(fetcher, undefined, 10));

    act(() => {
      result.current.startPolling();
    });

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.stopPolling();
    });

    const callsAfterStop = fetcher.mock.calls.length;
    await sleep(40);

    expect(result.current.isPolling).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(callsAfterStop);
  });

  it('stores polling error when fetcher rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Polling failed'));

    const { result } = renderHook(() => usePolling(fetcher, undefined, 10));

    act(() => {
      result.current.startPolling();
    });

    await waitFor(() => expect(result.current.error).toBe('Polling failed'));
    expect(result.current.loading).toBe(false);
  });
});
