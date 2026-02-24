import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemSuccess } from '@/components/redeem/RedeemSuccess';
import type { ComponentProps } from 'react';

const baseProps: ComponentProps<typeof RedeemSuccess> = {
  link: 'https://example.com/prize',
  copied: false,
  onCopy: vi.fn(),
  onReset: vi.fn(),
};

describe('RedeemSuccess', () => {
  it('renders success state and reward link', () => {
    render(<RedeemSuccess {...baseProps} />);

    expect(screen.getByText('Resgate Concluído!')).toBeInTheDocument();
    expect(screen.getByText(baseProps.link)).toBeInTheDocument();
  });

  it('calls onCopy when copy button is clicked', async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();

    render(<RedeemSuccess {...baseProps} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: 'Copiar' }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('shows copied label when copied is true', () => {
    render(<RedeemSuccess {...baseProps} copied={true} />);

    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();

    render(<RedeemSuccess {...baseProps} onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /resgatar outro código/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders external prize link with security attributes', () => {
    render(<RedeemSuccess {...baseProps} />);

    const openLink = screen.getByRole('link', { name: /acessar prêmio/i });
    expect(openLink).toHaveAttribute('href', baseProps.link);
    expect(openLink).toHaveAttribute('target', '_blank');
    expect(openLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders whatsapp share link with encoded prize url', () => {
    render(<RedeemSuccess {...baseProps} />);

    const shareLink = screen.getByRole('link', { name: /whatsapp/i });
    expect(shareLink.getAttribute('href')).toContain(encodeURIComponent(baseProps.link));
  });
});
