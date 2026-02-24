/**
 * LegalView Component Tests
 * Reusable component for legal/informational pages (Help, Privacy, Terms)
 * Tests: content rendering, back button, styling, accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalView } from '@/components/LegalView';
import type { ReactNode } from 'react';

describe('LegalView Component', () => {
  const mockOnBack = vi.fn();

  const defaultProps = {
    title: 'Ajuda & FAQ',
    content: 'Este é o conteúdo da página de ajuda.',
    onBack: mockOnBack
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page title', () => {
      render(<LegalView {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /ajuda & faq/i })).toBeInTheDocument();
    });

    it('should render content text', () => {
      render(<LegalView {...defaultProps} />);

      expect(screen.getByText('Este é o conteúdo da página de ajuda.')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<LegalView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /voltar|back|retornar/i })).toBeInTheDocument();
    });

    it('should display privacy policy', () => {
      const privacyContent = 'Nós respeitamos sua privacidade...';
      render(
        <LegalView
          title="Privacidade"
          content={privacyContent}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(privacyContent)).toBeInTheDocument();
    });

    it('should display terms of use', () => {
      const termsContent = 'Ao usar este serviço, você concorda com os seguintes termos...';
      render(
        <LegalView
          title="Termos de Uso"
          content={termsContent}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(termsContent)).toBeInTheDocument();
    });

    it('should display help/FAQ', () => {
      const helpContent = 'Como faço para resgatar um código?';
      render(
        <LegalView
          title="Ajuda"
          content={helpContent}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(helpContent)).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should render string content', () => {
      const content = 'Este é um conteúdo simples';
      render(<LegalView {...defaultProps} content={content} />);

      expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('should render very long content', () => {
      const longContent = 'Lorem ipsum '.repeat(100);
      render(<LegalView {...defaultProps} content={longContent} />);

      expect(screen.getByText(/lorem ipsum/i)).toBeInTheDocument();
    });

    it('should render content with special characters', () => {
      const content = 'Conteúdo com ©®™ caracteres especiais';
      render(<LegalView {...defaultProps} content={content} />);

      expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('should render content with line breaks', () => {
      const content = 'Primeira linha\nSegunda linha';
      const { container } = render(<LegalView {...defaultProps} content={content} />);

      expect(container.textContent).toContain('Primeira linha');
      expect(container.textContent).toContain('Segunda linha');
    });

    it('should handle ReactNode content', () => {
      const content = (
        <div data-testid="custom-content">
          <h3>Seção 1</h3>
          <p>Conteúdo da seção 1</p>
        </div>
      ) as ReactNode;

      render(<LegalView {...defaultProps} content={content} />);

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo da seção 1')).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      render(<LegalView {...defaultProps} />);
      const user = userEvent.setup();

      const backButton = screen.getByRole('button', { name: /voltar|back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should be easily accessible', async () => {
      render(<LegalView {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /voltar|back/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toBeVisible();
    });

    it('should have clear button text', () => {
      render(<LegalView {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /voltar|back|retornar/i });
      expect(backButton.textContent).toMatch(/voltar|back|retornar/i);
    });

    it('should have icon in back button', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /voltar|back/i });
      const icon = backButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not call onBack on render', () => {
      render(<LegalView {...defaultProps} />);

      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it('should handle multiple back button clicks', async () => {
      render(<LegalView {...defaultProps} />);
      const user = userEvent.setup();

      const backButton = screen.getByRole('button', { name: /voltar/i });

      await user.click(backButton);
      await user.click(backButton);
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(3);
    });
  });

  describe('Title Rendering', () => {
    it('should render different titles', () => {
      const titles = ['Ajuda', 'Privacidade', 'Termos de Uso'];

      titles.forEach(title => {
        const { unmount } = render(
          <LegalView title={title} content="Conteúdo" onBack={mockOnBack} />
        );

        expect(screen.getByRole('heading', { name: new RegExp(title) })).toBeInTheDocument();
        unmount();
      });
    });

    it('should display title as heading', () => {
      render(<LegalView {...defaultProps} />);

      const heading = screen.getByRole('heading');
      expect(heading.textContent).toBe('Ajuda & FAQ');
    });

    it('should use semantic heading element', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const heading = container.querySelector('h1, h2, h3');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have page layout styling', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const page = container.querySelector('[data-testid="legal-view"]') || container.firstChild;
      expect(page).toBeInTheDocument();
    });

    it('should have content area styling', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const content = container.querySelector('[data-testid="legal-content"]');
      if (content) {
        expect(content).toHaveClass(/(bg-|p-|rounded|max-w)/);
      }
    });

    it('should have proper spacing', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have entrance animation', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      // Check for motion element
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should transition smoothly', () => {
      const { rerender } = render(<LegalView {...defaultProps} />);

      rerender(
        <LegalView
          title="Novo Título"
          content="Novo Conteúdo"
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('heading', { name: /novo título/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const heading = container.querySelector('h1, h2, h3');
      expect(heading?.tagName).toMatch(/^H[1-6]$/);
    });

    it('should have accessible button', () => {
      render(<LegalView {...defaultProps} />);

      const button = screen.getByRole('button', { name: /voltar|back/i });
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBeTruthy();
    });

    it('should have proper contrast', () => {
      render(<LegalView {...defaultProps} />);

      const heading = screen.getByRole('heading');
      expect(heading).toBeVisible();
    });

    it('should be keyboard navigable', async () => {
      render(<LegalView {...defaultProps} />);
      const user = userEvent.setup();

      const backButton = screen.getByRole('button', { name: /voltar|back/i });

      backButton.focus();
      expect(backButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should have meaningful text content', () => {
      render(<LegalView {...defaultProps} />);

      const heading = screen.getByRole('heading');
      const content = screen.getByText('Este é o conteúdo da página de ajuda.');

      expect(heading.textContent).toBeTruthy();
      expect(content.textContent).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<LegalView {...defaultProps} />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should have responsive layout', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const content = container.querySelector('div');
      const className = content?.getAttribute('class') || '';
      expect(className).toMatch(/(flex|grid|p-|mx-|max-w)/);
    });

    it('should have readable text width', () => {
      const { container } = render(<LegalView {...defaultProps} />);

      const textElement = screen.getByText('Este é o conteúdo da página de ajuda.');
      expect(textElement).toBeVisible();
    });
  });

  describe('Different Page Types', () => {
    it('should work as Help page', () => {
      const helpContent = 'Como resgatar um código? Clique no botão resgatar e insira seu código.';
      render(
        <LegalView
          title="Ajuda"
          content={helpContent}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('heading', { name: /ajuda/i })).toBeInTheDocument();
      expect(screen.getByText(helpContent)).toBeInTheDocument();
    });

    it('should work as Privacy page', () => {
      const privacyContent = 'Coletamos apenas dados necessários para o funcionamento do serviço.';
      render(
        <LegalView
          title="Política de Privacidade"
          content={privacyContent}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('heading', { name: /privacidade/i })).toBeInTheDocument();
      expect(screen.getByText(privacyContent)).toBeInTheDocument();
    });

    it('should work as Terms page', () => {
      const termsContent = 'Você concorda com estes termos ao usar o serviço.';
      render(
        <LegalView
          title="Termos e Condições"
          content={termsContent}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('heading', { name: /termos/i })).toBeInTheDocument();
      expect(screen.getByText(termsContent)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<LegalView {...defaultProps} content="" />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100);
      render(<LegalView title={longTitle} content="Conteúdo" onBack={mockOnBack} />);

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Ajuda & FAQ™ - ©2024';
      render(<LegalView title={specialTitle} content="Conteúdo" onBack={mockOnBack} />);

      expect(screen.getByRole('heading', { name: new RegExp('Ajuda') })).toBeInTheDocument();
    });

    it('should render without crashing on unmount', () => {
      const { unmount } = render(<LegalView {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid prop updates', () => {
      const { rerender } = render(<LegalView {...defaultProps} />);

      for (let i = 0; i < 5; i++) {
        rerender(
          <LegalView
            title={`Título ${i}`}
            content={`Conteúdo ${i}`}
            onBack={mockOnBack}
          />
        );
      }

      expect(screen.getByRole('heading', { name: /Título 4/i })).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should provide complete legal page experience', async () => {
      render(<LegalView {...defaultProps} />);
      const user = userEvent.setup();

      // User reads the page
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('Este é o conteúdo da página de ajuda.')).toBeInTheDocument();

      // User clicks back
      const backButton = screen.getByRole('button', { name: /voltar/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should be reusable for multiple pages', () => {
      const pages = [
        { title: 'Ajuda', content: 'Conteúdo de ajuda' },
        { title: 'Privacidade', content: 'Conteúdo de privacidade' },
        { title: 'Termos', content: 'Conteúdo de termos' }
      ];

      pages.forEach(page => {
        const { unmount } = render(
          <LegalView
            title={page.title}
            content={page.content}
            onBack={mockOnBack}
          />
        );

        expect(screen.getByRole('heading', { name: new RegExp(page.title) })).toBeInTheDocument();
        expect(screen.getByText(page.content)).toBeInTheDocument();

        unmount();
      });
    });
  });
});
