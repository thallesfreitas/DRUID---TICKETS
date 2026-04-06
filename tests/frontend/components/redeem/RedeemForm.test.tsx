import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemForm } from '@/components/redeem/RedeemForm';
import type { ComponentProps, FormEvent } from 'react';

const baseProps: ComponentProps<typeof RedeemForm> = {
  step: 'identify',
  promoCode: '',
  email: '',
  verificationCode: '',
  verificationEmail: '',
  loading: false,
  error: null,
  hasNotStarted: false,
  hasEnded: false,
  startDate: undefined,
  onRequestVerification: vi.fn(),
  onRedeemPrize: vi.fn(),
  onPromoCodeChange: vi.fn(),
  onEmailChange: vi.fn(),
  onVerificationCodeChange: vi.fn(),
  onBack: vi.fn(),
  recaptchaMode: 'v2',
  recaptchaReady: true,
  recaptchaToken: 'token',
  onRecaptchaRender: vi.fn(),
};

describe('RedeemForm', () => {
  it('renders identify step fields', () => {
    render(<RedeemForm {...baseProps} />);

    expect(screen.getByText('Resgatar Código')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('EX: OREIDOFOGO')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('voce@exemplo.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar seu email/i })).toBeInTheDocument();
  });

  it('calls change handlers on identify step', () => {
    const onPromoCodeChange = vi.fn();
    const onEmailChange = vi.fn();

    render(
      <RedeemForm
        {...baseProps}
        onPromoCodeChange={onPromoCodeChange}
        onEmailChange={onEmailChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('EX: OREIDOFOGO'), { target: { value: 'BK' } });
    fireEvent.change(screen.getByPlaceholderText('voce@exemplo.com'), { target: { value: 'test@example.com' } });

    expect(onPromoCodeChange).toHaveBeenCalledWith('BK');
    expect(onEmailChange).toHaveBeenCalledWith('test@example.com');
  });

  it('renders verify step fields', () => {
    render(
      <RedeemForm
        {...baseProps}
        step="verify"
        verificationEmail="player@example.com"
      />
    );

    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resgatar prêmio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alterar dados/i })).toBeInTheDocument();
  });

  it('submits request verification on identify step', async () => {
    const onRequestVerification = vi.fn((e: FormEvent) => e.preventDefault());
    const user = userEvent.setup();

    render(
      <RedeemForm
        {...baseProps}
        promoCode="OREIDOFOGO"
        email="player@example.com"
        onRequestVerification={onRequestVerification}
      />
    );

    await user.click(screen.getByRole('button', { name: /validar seu email/i }));

    await waitFor(() => {
      expect(onRequestVerification).toHaveBeenCalledTimes(1);
    });
  });

  it('submits prize redeem on verify step', async () => {
    const onRedeemPrize = vi.fn((e: FormEvent) => e.preventDefault());
    const user = userEvent.setup();

    render(
      <RedeemForm
        {...baseProps}
        step="verify"
        verificationCode="123456"
        onRedeemPrize={onRedeemPrize}
      />
    );

    await user.click(screen.getByRole('button', { name: /resgatar prêmio/i }));

    expect(onRedeemPrize).toHaveBeenCalledTimes(1);
  });

  it('calls back action on verify step', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(
      <RedeemForm
        {...baseProps}
        step="verify"
        onBack={onBack}
      />
    );

    await user.click(screen.getByRole('button', { name: /alterar dados/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows error block when error is present', () => {
    render(<RedeemForm {...baseProps} error="Código inválido" />);

    expect(screen.getByText('Código inválido')).toBeInTheDocument();
  });

  it('renders captcha container in identify v2 mode after first submit', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RedeemForm
        {...baseProps}
        promoCode="OREIDOFOGO"
        email="player@example.com"
        recaptchaToken=""
      />
    );

    await user.click(screen.getByRole('button', { name: /validar seu email/i }));

    expect(container.querySelector('#recaptcha-container')).toBeInTheDocument();
  });
});
