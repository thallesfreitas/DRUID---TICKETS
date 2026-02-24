import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemForm } from '@/components/redeem/RedeemForm';
import type { ComponentProps, FormEvent } from 'react';

const baseProps: ComponentProps<typeof RedeemForm> = {
  code: '',
  loading: false,
  error: null,
  isStarted: true,
  isEnded: false,
  startDate: undefined,
  onSubmit: vi.fn(),
  onChange: vi.fn(),
  recaptchaMode: 'v2',
  recaptchaReady: true,
  recaptchaToken: 'token',
  onRecaptchaRender: vi.fn(),
};

describe('RedeemForm', () => {
  it('renders core form elements', () => {
    render(<RedeemForm {...baseProps} />);

    expect(screen.getByText('Resgatar Código')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('EX: PROMO2024')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar código/i })).toBeInTheDocument();
  });

  it('calls onChange when typing code', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<RedeemForm {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('EX: PROMO2024'), { target: { value: 'PROMO123' } });

    expect(onChange).toHaveBeenCalledWith('PROMO123');
  });

  it('calls onSubmit when form is submitted and enabled', async () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const user = userEvent.setup();

    render(<RedeemForm {...baseProps} code="PROMO123" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /validar código/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit in v2 mode when recaptcha token is missing', () => {
    render(<RedeemForm {...baseProps} recaptchaToken="" />);

    expect(screen.getByRole('button', { name: /validar código/i })).toBeDisabled();
  });

  it('disables submit in enterprise mode when not ready', () => {
    render(
      <RedeemForm
        {...baseProps}
        recaptchaMode="enterprise"
        recaptchaReady={false}
        recaptchaToken=""
      />
    );

    expect(screen.getByRole('button', { name: /validar código/i })).toBeDisabled();
  });

  it('hides captcha container in enterprise mode', () => {
    const { container } = render(
      <RedeemForm
        {...baseProps}
        recaptchaMode="enterprise"
        recaptchaToken=""
      />
    );

    expect(container.querySelector('#recaptcha-container')).not.toBeInTheDocument();
  });

  it('renders captcha container in v2 mode', () => {
    const { container } = render(<RedeemForm {...baseProps} recaptchaMode="v2" />);

    expect(container.querySelector('#recaptcha-container')).toBeInTheDocument();
  });

  it('calls onRecaptchaRender once when ready in v2 mode', async () => {
    const onRecaptchaRender = vi.fn();

    render(
      <RedeemForm
        {...baseProps}
        recaptchaMode="v2"
        recaptchaReady={true}
        onRecaptchaRender={onRecaptchaRender}
      />
    );

    await waitFor(() => {
      expect(onRecaptchaRender).toHaveBeenCalledWith('recaptcha-container');
    });
    expect(onRecaptchaRender).toHaveBeenCalledTimes(1);
  });

  it('shows schedule message before start date', () => {
    render(
      <RedeemForm
        {...baseProps}
        isStarted={false}
        startDate="2026-03-20"
        recaptchaToken=""
      />
    );

    expect(screen.getByRole('button', { name: /início em/i })).toBeDisabled();
  });

  it('shows ended message when campaign is over', () => {
    render(<RedeemForm {...baseProps} isEnded={true} recaptchaToken="" />);

    expect(screen.getByRole('button', { name: /resgates encerrados/i })).toBeDisabled();
  });

  it('renders error block when error is present', () => {
    render(<RedeemForm {...baseProps} error="Código inválido" />);

    expect(screen.getByText('Código inválido')).toBeInTheDocument();
  });

  it('submits form through native submit event', () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());

    const { container } = render(<RedeemForm {...baseProps} onSubmit={onSubmit} />);
    fireEvent.submit(container.querySelector('form')!);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
