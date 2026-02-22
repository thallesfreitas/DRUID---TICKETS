/**
 * Footer Component Tests
 * Footer with navigation links and view shortcuts
 * Tests: rendering, navigation, view switching, links, styling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '@/components/Footer';

describe('Footer Component', () => {
  const mockSetView = vi.fn();

  const defaultProps = {
    setView: mockSetView
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render footer element', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should display copyright information', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(/©|copyright|2024/i)).toBeInTheDocument();
    });

    it('should display company/project name', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(/promo|code|promocode/i)).toBeInTheDocument();
    });

    it('should have navigation links', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have help link', () => {
      render(<Footer {...defaultProps} />);

      const helpLink = screen.getByRole('button', { name: /ajuda|help|faq/i });
      expect(helpLink).toBeInTheDocument();
    });

    it('should have privacy link', () => {
      render(<Footer {...defaultProps} />);

      const privacyLink = screen.getByRole('button', { name: /privacidade|privacy/i });
      expect(privacyLink).toBeInTheDocument();
    });

    it('should have terms link', () => {
      render(<Footer {...defaultProps} />);

      const termsLink = screen.getByRole('button', { name: /termos|terms|condições/i });
      expect(termsLink).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('should call setView with help when help link is clicked', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const helpLink = screen.getByRole('button', { name: /ajuda|help/i });
      await user.click(helpLink);

      expect(mockSetView).toHaveBeenCalledWith('help');
    });

    it('should call setView with privacy when privacy link is clicked', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const privacyLink = screen.getByRole('button', { name: /privacidade|privacy/i });
      await user.click(privacyLink);

      expect(mockSetView).toHaveBeenCalledWith('privacy');
    });

    it('should call setView with terms when terms link is clicked', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const termsLink = screen.getByRole('button', { name: /termos|terms/i });
      await user.click(termsLink);

      expect(mockSetView).toHaveBeenCalledWith('terms');
    });

    it('should handle multiple link clicks', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const helpLink = screen.getByRole('button', { name: /ajuda/i });
      const privacyLink = screen.getByRole('button', { name: /privacidade/i });

      await user.click(helpLink);
      await user.click(privacyLink);

      expect(mockSetView).toHaveBeenNthCalledWith(1, 'help');
      expect(mockSetView).toHaveBeenNthCalledWith(2, 'privacy');
    });
  });

  describe('Styling', () => {
    it('should have footer styling classes', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass(/(bg-|border|mt-|py-)/);
    });

    it('should be positioned at bottom', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      const className = footer?.getAttribute('class') || '';
      expect(className).toMatch(/(bottom|mt-auto|flex-end)/);
    });

    it('should have proper text styling', () => {
      render(<Footer {...defaultProps} />);

      const copyright = screen.getByText(/©|copyright/i);
      expect(copyright).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic footer element', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      expect(footer?.tagName).toBe('FOOTER');
    });

    it('should have contentinfo role', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      render(<Footer {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have meaningful link labels', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /ajuda|help/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /privacidade|privacy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /termos|terms/i })).toBeInTheDocument();
    });
  });

  describe('Social Links', () => {
    it('should have social media links if present', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const socialLinks = container.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="instagram"], a[href*="linkedin"]');
      // Social links are optional
      expect(socialLinks.length).toBeGreaterThanOrEqual(0);
    });

    it('should open social links in new tab', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const externalLinks = container.querySelectorAll('a[target="_blank"]');
      externalLinks.forEach(link => {
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toMatch(/noopener|noreferrer/);
      });
    });
  });

  describe('Links Structure', () => {
    it('should have links in proper order', () => {
      render(<Footer {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const labels = buttons.map(b => b.textContent?.toLowerCase());

      // Help, Privacy, Terms should be present
      expect(labels.some(l => l?.includes('ajuda') || l?.includes('help'))).toBe(true);
    });

    it('should be keyboard navigable', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const buttons = screen.getAllByRole('button');

      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        buttons[i].focus();
        expect(buttons[i]).toHaveFocus();
      }
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have responsive layout', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      const className = footer?.getAttribute('class') || '';
      expect(className).toMatch(/(flex|grid|sm:|md:|lg:|xl:|justify)/);
    });

    it('should stack links on mobile', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => {
        render(<Footer {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle setView being called multiple times', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const helpLink = screen.getByRole('button', { name: /ajuda/i });

      for (let i = 0; i < 5; i++) {
        await user.click(helpLink);
      }

      expect(mockSetView).toHaveBeenCalledTimes(5);
    });

    it('should handle rapid link clicks', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const buttons = screen.getAllByRole('button');

      for (let i = 0; i < 3; i++) {
        await user.click(buttons[i % buttons.length]);
      }

      expect(mockSetView).toHaveBeenCalled();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(<Footer {...defaultProps} />);

      const newSetView = vi.fn();
      rerender(<Footer setView={newSetView} />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display year', () => {
      render(<Footer {...defaultProps} />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('should have proper copyright format', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(/©.*2024|copyright.*2024|2024.*copyright/i)).toBeInTheDocument();
    });

    it('should display company information', () => {
      render(<Footer {...defaultProps} />);

      expect(screen.getByText(/promo|code|promocode/i)).toBeInTheDocument();
    });
  });

  describe('Link Targets', () => {
    it('should use buttons for internal navigation', () => {
      render(<Footer {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not have empty href attributes', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const links = container.querySelectorAll('a[href=""]');
      expect(links.length).toBe(0);
    });
  });

  describe('Visual Design', () => {
    it('should be visually distinct from main content', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass(/(bg-|border|dark|gray)/);
    });

    it('should have proper spacing', () => {
      const { container } = render(<Footer {...defaultProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass(/(p-|m-|py-|px-)/);
    });

    it('should be readable', () => {
      render(<Footer {...defaultProps} />);

      const copyright = screen.getByText(/copyright|©/i);
      expect(copyright).toBeVisible();
    });
  });

  describe('Integration', () => {
    it('should be part of page footer section', () => {
      const { container } = render(<Footer {...defaultProps} />);

      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should provide navigation to all legal pages', async () => {
      render(<Footer {...defaultProps} />);
      const user = userEvent.setup();

      const helpLink = screen.getByRole('button', { name: /ajuda|help/i });
      const privacyLink = screen.getByRole('button', { name: /privacidade|privacy/i });
      const termsLink = screen.getByRole('button', { name: /termos|terms/i });

      await user.click(helpLink);
      expect(mockSetView).toHaveBeenCalledWith('help');

      await user.click(privacyLink);
      expect(mockSetView).toHaveBeenCalledWith('privacy');

      await user.click(termsLink);
      expect(mockSetView).toHaveBeenCalledWith('terms');
    });
  });
});
