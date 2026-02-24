import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch } from '@/hooks/useFetch';

describe('useFetch', () => {
  it('fetches data on mount by default', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

    const { result } = renderHook(() => useFetch(fetcher));

    expect(result.current.data).toBeNull();
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.data).toEqual({ id: 1, name: 'Test' }));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('stores error when fetch fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFetch(fetcher));

    await waitFor(() => expect(result.current.error).toBe('Network error'));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('supports refetch', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });

    const { result } = renderHook(() => useFetch(fetcher));

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ id: 2 });
  });

  it('does not auto fetch when autoFetch is false', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useFetch(fetcher, [], false));

    expect(fetcher).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ ok: true });
  });

  it('refetches when dependencies change', async () => {
    const fetcher = vi.fn((id: number) => Promise.resolve({ id }));

    const { result, rerender } = renderHook(
      ({ id }) => useFetch(() => fetcher(id), [id]),
      { initialProps: { id: 1 } }
    );

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

    rerender({ id: 2 });

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
  });
});
