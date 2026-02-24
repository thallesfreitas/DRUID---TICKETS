import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('renders legal navigation buttons', () => {
    render(<Footer setView={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Ajuda' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Termos' })).toBeInTheDocument();
  });

  it('calls setView with expected values', async () => {
    const setView = vi.fn();
    const user = userEvent.setup();

    render(<Footer setView={setView} />);

    await user.click(screen.getByRole('button', { name: 'Ajuda' }));
    await user.click(screen.getByRole('button', { name: 'Privacidade' }));
    await user.click(screen.getByRole('button', { name: 'Termos' }));

    expect(setView).toHaveBeenNthCalledWith(1, 'help');
    expect(setView).toHaveBeenNthCalledWith(2, 'privacy');
    expect(setView).toHaveBeenNthCalledWith(3, 'terms');
  });

  it('renders current year in copyright text', () => {
    render(<Footer setView={vi.fn()} />);

    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
