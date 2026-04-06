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

describe('RedeemView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders identify step form when there is no success data', () => {
    vi.mocked(useRedeem).mockReturnValue({
      step: 'identify',
      promoCode: '',
      setPromoCode: vi.fn(),
      email: '',
      setEmail: vi.fn(),
      verificationCode: '',
      setVerificationCode: vi.fn(),
      verificationEmail: '',
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: null,
      loading: false,
      error: null,
      handleRequestVerification: vi.fn(),
      handleRedeemPrize: vi.fn(),
      goToIdentifyStep: vi.fn(),
      resetSuccess: vi.fn(),
    });

    render(<RedeemView />);

    expect(screen.getByText('Resgatar Código')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar seu email/i })).toBeInTheDocument();
  });

  it('submits verification request using hook handler', async () => {
    const handleRequestVerification = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useRedeem).mockReturnValue({
      step: 'identify',
      promoCode: 'OREIDOFOGO',
      setPromoCode: vi.fn(),
      email: 'player@example.com',
      setEmail: vi.fn(),
      verificationCode: '',
      setVerificationCode: vi.fn(),
      verificationEmail: '',
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: null,
      loading: false,
      error: null,
      handleRequestVerification,
      handleRedeemPrize: vi.fn(),
      goToIdentifyStep: vi.fn(),
      resetSuccess: vi.fn(),
    });

    const user = userEvent.setup();
    render(<RedeemView />);

    await user.click(screen.getByRole('button', { name: /validar seu email/i }));

    await waitFor(() => {
      expect(handleRequestVerification).toHaveBeenCalledTimes(1);
    });
  });

  it('renders otp step from hook state', () => {
    vi.mocked(useRedeem).mockReturnValue({
      step: 'verify',
      promoCode: 'OREIDOFOGO',
      setPromoCode: vi.fn(),
      email: 'player@example.com',
      setEmail: vi.fn(),
      verificationCode: '',
      setVerificationCode: vi.fn(),
      verificationEmail: 'player@example.com',
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: null,
      loading: false,
      error: null,
      handleRequestVerification: vi.fn(),
      handleRedeemPrize: vi.fn(),
      goToIdentifyStep: vi.fn(),
      resetSuccess: vi.fn(),
    });

    render(<RedeemView />);

    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resgatar prêmio/i })).toBeInTheDocument();
  });

  it('renders success panel when successData exists and supports copy/reset', async () => {
    const resetSuccess = vi.fn();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    vi.mocked(useRedeem).mockReturnValue({
      step: 'verify',
      promoCode: 'OREIDOFOGO',
      setPromoCode: vi.fn(),
      email: 'player@example.com',
      setEmail: vi.fn(),
      verificationCode: '123456',
      setVerificationCode: vi.fn(),
      verificationEmail: 'player@example.com',
      settings: { start_date: '2000-01-01', end_date: '2999-01-01' },
      settingsLoading: false,
      successData: { link: 'https://example.com/prize' },
      loading: false,
      error: null,
      handleRequestVerification: vi.fn(),
      handleRedeemPrize: vi.fn(),
      goToIdentifyStep: vi.fn(),
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
