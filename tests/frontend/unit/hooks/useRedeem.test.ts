import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetch } from '@/hooks/useFetch';
import { useRedeem } from '@/hooks/useRedeem';
import type { FormEvent } from 'react';

vi.mock('@/hooks/useFetch', () => ({
  useFetch: vi.fn(),
}));

const settingsMock = {
  start_date: '2024-01-01',
  end_date: '2024-12-31',
};

const createSubmitEvent = () =>
  ({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>);

describe('useRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useFetch).mockReturnValue({
      data: settingsMock,
      loading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ link: 'https://example.com/prize' }),
    } as Response);
  });

  it('starts with default state', () => {
    const { result } = renderHook(() => useRedeem());

    expect(result.current.code).toBe('');
    expect(result.current.captchaVerified).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.successData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.settings).toEqual(settingsMock);
  });

  it('uppercases code when setCode is called', () => {
    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setCode('promo-123');
    });

    expect(result.current.code).toBe('PROMO-123');
  });

  it('does not submit when code is empty', async () => {
    const { result } = renderHook(() => useRedeem());

    await act(async () => {
      await result.current.handleRedeem(createSubmitEvent());
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('submits code and stores success data', async () => {
    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setCode('promo-123');
    });

    await act(async () => {
      await result.current.handleRedeem(createSubmitEvent());
    });

    await waitFor(() => {
      expect(result.current.successData?.link).toBe('https://example.com/prize');
    });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('stores error and unchecks captcha when submit fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Código inválido' }),
    } as Response);

    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setCode('invalid');
    });

    await act(async () => {
      await result.current.handleRedeem(createSubmitEvent());
    });

    expect(result.current.error).toBe('Código inválido');
    expect(result.current.captchaVerified).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('resets success state', () => {
    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setCode('PROMO123');
      result.current.setCaptchaVerified(false);
      result.current.resetSuccess();
    });

    expect(result.current.code).toBe('');
    expect(result.current.successData).toBeNull();
    expect(result.current.captchaVerified).toBe(true);
  });
});
