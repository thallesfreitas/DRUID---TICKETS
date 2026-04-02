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
  });

  it('starts with default state', () => {
    const { result } = renderHook(() => useRedeem());

    expect(result.current.step).toBe('identify');
    expect(result.current.promoCode).toBe('');
    expect(result.current.email).toBe('');
    expect(result.current.verificationCode).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.successData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.settings).toEqual(settingsMock);
  });

  it('uppercases promo code and sanitizes verification code', () => {
    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setPromoCode('bkclashpromo2026');
      result.current.setVerificationCode('12a34567');
    });

    expect(result.current.promoCode).toBe('BKCLASHPROMO2026');
    expect(result.current.verificationCode).toBe('123456');
  });

  it('requests verification and advances to otp step', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ email: 'player@example.com', message: 'ok' }),
    } as Response);

    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setPromoCode('bkclashpromo2026');
      result.current.setEmail('Player@Example.com');
    });

    await act(async () => {
      await result.current.handleRequestVerification(createSubmitEvent());
    });

    await waitFor(() => {
      expect(result.current.step).toBe('verify');
      expect(result.current.verificationEmail).toBe('player@example.com');
    });
  });

  it('redeems prize after otp validation', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ email: 'player@example.com', message: 'ok' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ link: 'https://example.com/prize' }),
      } as Response);

    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setPromoCode('bkclashpromo2026');
      result.current.setEmail('player@example.com');
    });

    await act(async () => {
      await result.current.handleRequestVerification(createSubmitEvent());
    });

    act(() => {
      result.current.setVerificationCode('123456');
    });

    await act(async () => {
      await result.current.handleRedeemPrize(createSubmitEvent());
    });

    await waitFor(() => {
      expect(result.current.successData?.link).toBe('https://example.com/prize');
    });
  });

  it('stores api errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Código promocional inválido' }),
    } as Response);

    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setPromoCode('invalid');
      result.current.setEmail('player@example.com');
    });

    await act(async () => {
      await result.current.handleRequestVerification(createSubmitEvent());
    });

    expect(result.current.error).toBe('Código promocional inválido');
    expect(result.current.step).toBe('identify');
  });

  it('returns to identify step and resets success', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ email: 'player@example.com', message: 'ok' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ link: 'https://example.com/prize' }),
      } as Response);

    const { result } = renderHook(() => useRedeem());

    act(() => {
      result.current.setPromoCode('bkclashpromo2026');
      result.current.setEmail('player@example.com');
    });

    await act(async () => {
      await result.current.handleRequestVerification(createSubmitEvent());
    });

    act(() => {
      result.current.setVerificationCode('123456');
      result.current.goToIdentifyStep();
    });

    expect(result.current.step).toBe('identify');
    expect(result.current.verificationCode).toBe('');

    act(() => {
      result.current.resetSuccess();
    });

    expect(result.current.promoCode).toBe('');
    expect(result.current.email).toBe('');
    expect(result.current.verificationEmail).toBe('');
    expect(result.current.successData).toBeNull();
  });
});
