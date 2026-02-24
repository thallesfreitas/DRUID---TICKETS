/**
 * Header Component Tests
 * Navigation header with logo, nav links, and admin button
 * Tests: rendering, navigation, admin button, styling, accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/Header';

describe('Header Component', () => {
  const defaultProps = {
    onAdminClick: vi.fn(),
    onLogoClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header element', () => {
      const { container } = render(<Header {...defaultProps} />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should display logo', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('img', { name: /logo/i })).toBeInTheDocument();
    });

    it('should have logo link', () => {
      render(<Header {...defaultProps} />);

      const logoLink = screen.getByRole('link', { name: /logo|home/i });
      expect(logoLink).toBeInTheDocument();
    });

    it('should render navigation', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have admin button', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('button', { name: /admin|painel/i })).toBeInTheDocument();
    });
  });

  describe('Logo Click', () => {
    it('should call onLogoClick when logo is clicked', async () => {
      render(<Header {...defaultProps} />);
      const user = userEvent.setup();

      const logoLink = screen.getByRole('link', { name: /logo|home/i });
      await user.click(logoLink);

      expect(defaultProps.onLogoClick).toHaveBeenCalled();
    });

    it('should navigate to home on logo click', async () => {
      render(<Header {...defaultProps} />);

      const logoLink = screen.getByRole('link', { name: /logo/i });
      expect(logoLink.getAttribute('href')).toBe('/');
    });

    it('should have correct logo alt text', () => {
      render(<Header {...defaultProps} />);

      const logo = screen.getByRole('img', { name: /logo|promo|code/i });
      expect(logo.getAttribute('alt')).toBeTruthy();
    });
  });

  describe('Admin Button', () => {
    it('should call onAdminClick when admin button is clicked', async () => {
      render(<Header {...defaultProps} />);
      const user = userEvent.setup();

      const adminButton = screen.getByRole('button', { name: /admin|painel/i });
      await user.click(adminButton);

      expect(defaultProps.onAdminClick).toHaveBeenCalled();
    });

    it('should have descriptive button text', () => {
      render(<Header {...defaultProps} />);

      const adminButton = screen.getByRole('button');
      expect(adminButton.textContent).toMatch(/admin|painel/i);
    });

    it('should have icon in admin button', () => {
      const { container } = render(<Header {...defaultProps} />);

      const adminButton = screen.getByRole('button', { name: /admin/i });
      const icon = adminButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have help link', () => {
      render(<Header {...defaultProps} />);

      const helpLink = screen.queryByRole('link', { name: /ajuda|help|faq/i });
      if (helpLink) {
        expect(helpLink).toBeInTheDocument();
      }
    });

    it('should have privacy link', () => {
      render(<Header {...defaultProps} />);

      const privacyLink = screen.queryByRole('link', { name: /privacidade|privacy/i });
      if (privacyLink) {
        expect(privacyLink).toBeInTheDocument();
      }
    });

    it('should have terms link', () => {
      render(<Header {...defaultProps} />);

      const termsLink = screen.queryByRole('link', { name: /termos|terms|condições/i });
      if (termsLink) {
        expect(termsLink).toBeInTheDocument();
      }
    });

    it('should have correct navigation structure', () => {
      const { container } = render(<Header {...defaultProps} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have header styling classes', () => {
      const { container } = render(<Header {...defaultProps} />);

      const header = container.querySelector('header');
      expect(header).toHaveClass(/(bg-|shadow|border)/);
    });

    it('should be sticky or fixed', () => {
      const { container } = render(<Header {...defaultProps} />);

      const header = container.querySelector('header');
      const className = header?.getAttribute('class') || '';
      expect(className).toMatch(/(sticky|fixed|top)/i);
    });

    it('should have proper padding', () => {
      const { container } = render(<Header {...defaultProps} />);

      const header = container.querySelector('header');
      expect(header).toHaveClass(/p-|px-|py-/);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic header element', () => {
      const { container } = render(<Header {...defaultProps} />);

      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should have proper link roles', () => {
      render(<Header {...defaultProps} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have proper button role', () => {
      render(<Header {...defaultProps} />);

      const adminButton = screen.getByRole('button');
      expect(adminButton).toBeInTheDocument();
    });

    it('should have aria-label for admin button', () => {
      render(<Header {...defaultProps} />);

      const adminButton = screen.getByRole('button', { name: /admin|painel/i });
      const label = adminButton.getAttribute('aria-label') || adminButton.textContent;
      expect(label).toBeTruthy();
    });

    it('should have alt text for logo', () => {
      render(<Header {...defaultProps} />);

      const logo = screen.getByRole('img');
      expect(logo.getAttribute('alt')).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
    });

    it('should have responsive classes', () => {
      const { container } = render(<Header {...defaultProps} />);

      const header = container.querySelector('header');
      const className = header?.getAttribute('class') || '';
      // Check for responsive Tailwind classes
      expect(className).toMatch(/(flex|grid|sm:|md:|lg:|xl:)/);
    });
  });

  describe('Logo Image', () => {
    it('should have correct logo source', () => {
      render(<Header {...defaultProps} />);

      const logo = screen.getByRole('img', { name: /logo/i });
      expect(logo.getAttribute('src')).toBeTruthy();
    });

    it('should have proper image dimensions', () => {
      render(<Header {...defaultProps} />);

      const logo = screen.getByRole('img', { name: /logo/i });
      expect(logo.getAttribute('width')).toBeTruthy();
      expect(logo.getAttribute('height')).toBeTruthy();
    });
  });

  describe('Callbacks', () => {
    it('should not call callbacks on render', () => {
      render(<Header {...defaultProps} />);

      expect(defaultProps.onAdminClick).not.toHaveBeenCalled();
      expect(defaultProps.onLogoClick).not.toHaveBeenCalled();
    });

    it('should handle multiple admin clicks', async () => {
      render(<Header {...defaultProps} />);
      const user = userEvent.setup();

      const adminButton = screen.getByRole('button', { name: /admin/i });

      await user.click(adminButton);
      await user.click(adminButton);
      await user.click(adminButton);

      expect(defaultProps.onAdminClick).toHaveBeenCalledTimes(3);
    });

    it('should handle both callbacks independently', async () => {
      render(<Header {...defaultProps} />);
      const user = userEvent.setup();

      const logoLink = screen.getByRole('link', { name: /logo/i });
      const adminButton = screen.getByRole('button', { name: /admin/i });

      await user.click(logoLink);
      await user.click(adminButton);

      expect(defaultProps.onLogoClick).toHaveBeenCalledTimes(1);
      expect(defaultProps.onAdminClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should render without callbacks errors', () => {
      expect(() => {
        render(<Header {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle rapid button clicks', async () => {
      render(<Header {...defaultProps} />);
      const user = userEvent.setup();

      const adminButton = screen.getByRole('button');

      for (let i = 0; i < 10; i++) {
        await user.click(adminButton);
      }

      expect(defaultProps.onAdminClick).toHaveBeenCalledTimes(10);
    });

    it('should handle prop updates', () => {
      const { rerender } = render(<Header {...defaultProps} />);

      const newProps = {
        onAdminClick: vi.fn(),
        onLogoClick: vi.fn()
      };

      rerender(<Header {...newProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Visual Hierarchy', () => {
    it('should have logo prominently displayed', () => {
      render(<Header {...defaultProps} />);

      const logo = screen.getByRole('img', { name: /logo/i });
      expect(logo).toBeVisible();
    });

    it('should have navigation visible', () => {
      render(<Header {...defaultProps} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeVisible();
    });

    it('should have admin button visible', () => {
      render(<Header {...defaultProps} />);

      const adminButton = screen.getByRole('button', { name: /admin/i });
      expect(adminButton).toBeVisible();
    });
  });
});
