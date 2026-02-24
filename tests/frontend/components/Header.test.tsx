import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '@/components/Header';
import type { ComponentProps } from 'react';

function renderHeader(props: ComponentProps<typeof Header> = {}) {
  return render(
    <MemoryRouter>
      <Header {...props} />
    </MemoryRouter>
  );
}

describe('Header', () => {
  it('renders brand and home link', () => {
    renderHeader();

    expect(screen.getByText('PromoCode')).toBeInTheDocument();
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('calls onLogoClick when clicking home link', async () => {
    const onLogoClick = vi.fn();
    const user = userEvent.setup();

    renderHeader({ onLogoClick });
    await user.click(screen.getByRole('link', { name: 'Home' }));

    expect(onLogoClick).toHaveBeenCalledTimes(1);
  });

  it('hides admin button by default', () => {
    renderHeader();
    expect(screen.queryByRole('link', { name: 'Admin Panel' })).not.toBeInTheDocument();
  });

  it('shows admin button when enabled and triggers callback', async () => {
    const onAdminClick = vi.fn();
    const user = userEvent.setup();

    renderHeader({ showAdminButton: true, onAdminClick });

    const adminLink = screen.getByRole('link', { name: 'Admin Panel' });
    expect(adminLink).toHaveAttribute('href', '/admin');

    await user.click(adminLink);
    expect(onAdminClick).toHaveBeenCalledTimes(1);
  });
});
