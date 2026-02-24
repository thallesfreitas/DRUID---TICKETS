import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemView } from '@/components/views/RedeemView';
import { useRedeem } from '@/hooks/useRedeem';

vi.mock('@/hooks/useRedeem', () => ({
  useRedeem: vi.fn(),
}));

vi.mock('@/hooks/useRecaptchaV2', () => ({
  useRecaptchaV2: vi.fn(() => ({
    token: 'captcha-token',
    ready: true,
    renderWidget: vi.fn(),
    resetWidget: vi.fn(),
    siteKey: 'site-key',
  })),
}));

vi.mock('@/hooks/useRecaptchaEnterprise', () => ({
  useRecaptchaEnterprise: vi.fn(() => ({
    ready: false,
    executeRecaptcha: vi.fn().mockResolvedValue(''),
    siteKey: 'site-key',
  })),
}));

describe('RedeemView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form when there is no success data', () => {
    vi.mocked(useRedeem).mockReturnValue({
      code: '',
      setCode: vi.fn(),
      captchaVerified: true,
      setCaptchaVerified: vi.fn(),
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: null,
      loading: false,
      error: null,
      handleRedeem: vi.fn(),
      resetSuccess: vi.fn(),
    });

    render(<RedeemView />);

    expect(screen.getByText('Resgatar Código')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar código/i })).toBeInTheDocument();
  });

  it('submits using hook handler', async () => {
    const handleRedeem = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useRedeem).mockReturnValue({
      code: 'PROMO123',
      setCode: vi.fn(),
      captchaVerified: true,
      setCaptchaVerified: vi.fn(),
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: null,
      loading: false,
      error: null,
      handleRedeem,
      resetSuccess: vi.fn(),
    });

    const user = userEvent.setup();
    render(<RedeemView />);

    await user.click(screen.getByRole('button', { name: /validar código/i }));

    await waitFor(() => {
      expect(handleRedeem).toHaveBeenCalledTimes(1);
    });
  });

  it('changes code through hook setter', async () => {
    const setCode = vi.fn();

    vi.mocked(useRedeem).mockReturnValue({
      code: '',
      setCode,
      captchaVerified: true,
      setCaptchaVerified: vi.fn(),
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: null,
      loading: false,
      error: null,
      handleRedeem: vi.fn(),
      resetSuccess: vi.fn(),
    });

    const user = userEvent.setup();
    render(<RedeemView />);

    await user.type(screen.getByPlaceholderText('EX: PROMO2024'), 'PROMO');
    expect(setCode).toHaveBeenCalled();
  });

  it('renders success panel when successData exists and supports copy/reset', async () => {
    const resetSuccess = vi.fn();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    vi.mocked(useRedeem).mockReturnValue({
      code: 'PROMO123',
      setCode: vi.fn(),
      captchaVerified: true,
      setCaptchaVerified: vi.fn(),
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: { link: 'https://example.com/prize' },
      loading: false,
      error: null,
      handleRedeem: vi.fn(),
      resetSuccess,
    });

    const user = userEvent.setup();
    render(<RedeemView />);

    expect(screen.getByText('Resgate Concluído!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copiar' }));
    expect(writeTextSpy).toHaveBeenCalledWith('https://example.com/prize');

    await user.click(screen.getByRole('button', { name: /resgatar outro código/i }));
    expect(resetSuccess).toHaveBeenCalledTimes(1);
  });
});
