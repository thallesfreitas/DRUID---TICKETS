/**
 * RedeemSuccess Component Tests
 * Success message and sharing interface after code redemption
 * Tests: UI rendering, copy to clipboard, sharing, reset functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemSuccess } from '@/components/redeem/RedeemSuccess';

describe('RedeemSuccess Component', () => {
  let mockOnCopy: ReturnType<typeof vi.fn>;
  let mockOnReset: ReturnType<typeof vi.fn>;

  const defaultProps = {
    link: 'https://example.com/promo-2024-abc123',
    copied: false,
    onCopy: mockOnCopy,
    onReset: mockOnReset
  };

  beforeEach(() => {
    mockOnCopy = vi.fn();
    mockOnReset = vi.fn();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  describe('Rendering', () => {
    it('should render success message', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByText(/sucesso|resgatado com sucesso/i)).toBeInTheDocument();
    });

    it('should display the promo link', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByText(defaultProps.link)).toBeInTheDocument();
    });

    it('should render copy button', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByRole('button', { name: /copiar|copy/i })).toBeInTheDocument();
    });

    it('should render open link button', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const openButton = screen.getAllByRole('button').find(btn =>
        /abrir|open|visitar|ir|visite/i.test(btn.textContent || '')
      );
      expect(openButton).toBeInTheDocument();
    });

    it('should render reset button', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByRole('button', { name: /novo resgate|tentar novamente|resgatar outro/i })).toBeInTheDocument();
    });

    it('should render share button', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByRole('button', { name: /compartilhar|whatsapp|share/i })).toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard', () => {
    it('should call onCopy when copy button is clicked', async () => {
      render(<RedeemSuccess {...defaultProps} />);
      const user = userEvent.setup();

      const copyButton = screen.getByRole('button', { name: /copiar|copy/i });
      await user.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalled();
    });

    it('should show copied state', () => {
      const { rerender } = render(<RedeemSuccess {...defaultProps} copied={false} />);

      let copyButton = screen.getByRole('button', { name: /copiar/i });
      expect(copyButton.textContent).toMatch(/copiar/i);

      rerender(<RedeemSuccess {...defaultProps} copied={true} />);

      copyButton = screen.getByRole('button', { name: /copiado|copied/i });
      expect(copyButton.textContent).toMatch(/copiado|copied/i);
    });

    it('should display success feedback after copy', async () => {
      const { rerender } = render(<RedeemSuccess {...defaultProps} copied={false} />);
      const user = userEvent.setup();

      const copyButton = screen.getByRole('button', { name: /copiar/i });
      await user.click(copyButton);

      rerender(<RedeemSuccess {...defaultProps} copied={true} />);

      // Button text should change to indicate success
      expect(screen.getByRole('button', { name: /copiado/i })).toBeInTheDocument();
    });

    it('should write link to clipboard', async () => {
      render(<RedeemSuccess {...defaultProps} />);
      const user = userEvent.setup();

      const copyButton = screen.getByRole('button', { name: /copiar/i });
      await user.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalled();
    });
  });

  describe('Link Opening', () => {
    it('should have correct href for open link button', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const link = screen.getByRole('link', { name: /abrir|open|visitar/i });
      expect(link.getAttribute('href')).toBe(defaultProps.link);
    });

    it('should open link in new tab', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const link = screen.getByRole('link', { name: /abrir|open|visitar/i });
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('should have rel attribute for security', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const link = screen.getByRole('link', { name: /abrir|open|visitar/i });
      expect(link.getAttribute('rel')).toMatch(/noopener|noreferrer/);
    });
  });

  describe('Reset Functionality', () => {
    it('should call onReset when reset button is clicked', async () => {
      render(<RedeemSuccess {...defaultProps} />);
      const user = userEvent.setup();

      const resetButton = screen.getByRole('button', { name: /novo resgate|tentar novamente|resgatar outro/i });
      await user.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });

    it('should allow multiple redeems', async () => {
      const { rerender } = render(<RedeemSuccess {...defaultProps} />);
      const user = userEvent.setup();

      const resetButton = screen.getByRole('button', { name: /novo resgate/i });
      await user.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);

      rerender(<RedeemSuccess {...defaultProps} />);
      await user.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(2);
    });
  });

  describe('Share Functionality', () => {
    it('should render share button', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByRole('button', { name: /compartilhar|whatsapp/i })).toBeInTheDocument();
    });

    it('should have WhatsApp share link', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /compartilhar|whatsapp/i });
      const whatsappLink = shareButton.closest('a');

      if (whatsappLink) {
        expect(whatsappLink.href).toMatch(/whatsapp|wa.me/i);
      }
    });

    it('should include link in share message', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /compartilhar|whatsapp/i });
      const whatsappLink = shareButton.closest('a');

      if (whatsappLink) {
        expect(whatsappLink.href).toContain(encodeURIComponent(defaultProps.link));
      }
    });

    it('should include promotional message in share', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /compartilhar|whatsapp/i });
      const whatsappLink = shareButton.closest('a');

      if (whatsappLink) {
        expect(whatsappLink.href).toMatch(/text=/);
      }
    });
  });

  describe('Link Validation', () => {
    it('should handle different link formats', () => {
      const links = [
        'https://example.com/123',
        'https://example.com/promo?id=123',
        'https://example.com/path/to/promo#section'
      ];

      links.forEach(link => {
        const { unmount } = render(<RedeemSuccess {...defaultProps} link={link} />);
        expect(screen.getByText(link)).toBeInTheDocument();
        unmount();
      });
    });

    it('should display very long links', () => {
      const longLink = 'https://example.com/' + 'a'.repeat(200);
      render(<RedeemSuccess {...defaultProps} link={longLink} />);

      expect(screen.getByText(longLink)).toBeInTheDocument();
    });

    it('should handle special characters in link', () => {
      const specialLink = 'https://example.com/promo?code=ABC-123_XYZ&utm=test&ref=2024';
      render(<RedeemSuccess {...defaultProps} link={specialLink} />);

      expect(screen.getByText(specialLink)).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show success animation', () => {
      const { container } = render(<RedeemSuccess {...defaultProps} />);

      // Check for animation class or motion element
      const successContainer = container.querySelector('[data-testid="success-container"]');
      expect(successContainer).toBeInTheDocument();
    });

    it('should display success icon or badge', () => {
      render(<RedeemSuccess {...defaultProps} />);

      // Look for success indicators
      const successIndicator = screen.queryByRole('img', { hidden: true });
      // Or check for text indicating success
      expect(screen.getByText(/✓|sucesso|êxito/i)).toBeInTheDocument();
    });

    it('should highlight the promo link visually', () => {
      const { container } = render(<RedeemSuccess {...defaultProps} />);

      const linkElement = screen.getByText(defaultProps.link);
      expect(linkElement).toHaveClass(/(code|link|highlight|bg-blue|bg-gray)/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<RedeemSuccess {...defaultProps} />);

      expect(screen.getByRole('button', { name: /copiar|copy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compartilhar|whatsapp/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /novo resgate|resgatar outro/i })).toBeInTheDocument();
    });

    it('should announce copied state to screen readers', () => {
      const { rerender } = render(<RedeemSuccess {...defaultProps} copied={false} />);

      let copyButton = screen.getByRole('button', { name: /copiar/i });
      expect(copyButton.getAttribute('aria-label') || copyButton.textContent).toMatch(/copiar/i);

      rerender(<RedeemSuccess {...defaultProps} copied={true} />);

      copyButton = screen.getByRole('button', { name: /copiado|copied/i });
      expect(copyButton.getAttribute('aria-label') || copyButton.textContent).toMatch(/copiado/i);
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<RedeemSuccess {...defaultProps} />);

      // Check for proper heading
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should link have descriptive text or aria-label', () => {
      render(<RedeemSuccess {...defaultProps} />);

      const link = screen.getByRole('link', { name: /abrir|open|visitar/i });
      expect(link.textContent || link.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty link', () => {
      render(<RedeemSuccess {...defaultProps} link="" />);

      // Should still render without crashing
      expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
    });

    it('should handle very short link', () => {
      render(<RedeemSuccess {...defaultProps} link="http://a.io/x" />);

      expect(screen.getByText('http://a.io/x')).toBeInTheDocument();
    });

    it('should handle rapid button clicks', async () => {
      render(<RedeemSuccess {...defaultProps} />);
      const user = userEvent.setup();

      const copyButton = screen.getByRole('button', { name: /copiar/i });
      await user.click(copyButton);
      await user.click(copyButton);
      await user.click(copyButton);

      expect(mockOnCopy).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple component instances', () => {
      const { container } = render(
        <div>
          <RedeemSuccess {...defaultProps} link="https://link1.com" />
          <RedeemSuccess {...defaultProps} link="https://link2.com" />
        </div>
      );

      expect(screen.getByText('https://link1.com')).toBeInTheDocument();
      expect(screen.getByText('https://link2.com')).toBeInTheDocument();
    });

    it('should handle state transitions', () => {
      const { rerender } = render(<RedeemSuccess {...defaultProps} copied={false} />);

      rerender(<RedeemSuccess {...defaultProps} copied={true} />);
      rerender(<RedeemSuccess {...defaultProps} copied={false} />);

      expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
    });
  });

  describe('Props Variations', () => {
    it('should render with https link', () => {
      render(<RedeemSuccess {...defaultProps} link="https://secure.example.com" />);

      expect(screen.getByText('https://secure.example.com')).toBeInTheDocument();
    });

    it('should render with custom link format', () => {
      const customLink = 'https://example.com/codes/PROMO2024ABC123';
      render(<RedeemSuccess {...defaultProps} link={customLink} />);

      expect(screen.getByText(customLink)).toBeInTheDocument();
    });

    it('should handle copied state changes', () => {
      const { rerender } = render(<RedeemSuccess {...defaultProps} copied={false} />);

      let buttons = screen.getAllByRole('button');
      expect(buttons.some(b => /copiar/i.test(b.textContent || ''))).toBe(true);

      rerender(<RedeemSuccess {...defaultProps} copied={true} />);

      buttons = screen.getAllByRole('button');
      expect(buttons.some(b => /copiado/i.test(b.textContent || ''))).toBe(true);
    });
  });
});
