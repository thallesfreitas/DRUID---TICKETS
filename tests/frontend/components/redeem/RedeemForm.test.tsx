/**
 * RedeemForm Component Tests
 * Presentational component for code redemption form
 * Tests: UI rendering, input handling, validation, submit, accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemForm } from '@/components/redeem/RedeemForm';

describe('RedeemForm Component', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;
  let mockOnChange: ReturnType<typeof vi.fn>;
  let mockOnCaptchaChange: ReturnType<typeof vi.fn>;

  const defaultProps = {
    code: '',
    loading: false,
    error: null,
    captchaVerified: false,
    isStarted: true,
    isEnded: false,
    onSubmit: mockOnSubmit,
    onChange: mockOnChange,
    onCaptchaChange: mockOnCaptchaChange
  };

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnChange = vi.fn();
    mockOnCaptchaChange = vi.fn();
  });

  describe('Rendering', () => {
    it('should render form with all elements', () => {
      render(<RedeemForm {...defaultProps} />);

      expect(screen.getByText(/Digite o código de promoção/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /código/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resgatar/i })).toBeInTheDocument();
    });

    it('should render code input with correct value', () => {
      render(<RedeemForm {...defaultProps} code="PROMO123" />);

      const input = screen.getByRole('textbox', { name: /código/i }) as HTMLInputElement;
      expect(input.value).toBe('PROMO123');
    });

    it('should render captcha checkbox', () => {
      render(<RedeemForm {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();
      expect(checkbox.checked).toBe(false);
    });

    it('should render submit button', () => {
      render(<RedeemForm {...defaultProps} />);

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when code input changes', async () => {
      render(<RedeemForm {...defaultProps} />);
      const user = userEvent.setup();

      const input = screen.getByRole('textbox', { name: /código/i });
      await user.type(input, 'PROMO123');

      // onChange called for each character
      expect(mockOnChange).toHaveBeenCalledWith('P');
      expect(mockOnChange).toHaveBeenCalledWith('PR');
      expect(mockOnChange).toHaveBeenCalledWith('PROMO123');
    });

    it('should allow special characters in code input', async () => {
      render(<RedeemForm {...defaultProps} />);
      const user = userEvent.setup();

      const input = screen.getByRole('textbox');
      await user.type(input, 'PROMO-2024_ABC');

      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('-'));
      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('_'));
    });

    it('should call onCaptchaChange when checkbox toggles', async () => {
      render(<RedeemForm {...defaultProps} />);
      const user = userEvent.setup();

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnCaptchaChange).toHaveBeenCalled();
    });

    it('should update captcha checkbox state', async () => {
      const { rerender } = render(<RedeemForm {...defaultProps} captchaVerified={false} />);

      let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      rerender(<RedeemForm {...defaultProps} captchaVerified={true} />);

      checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', async () => {
      render(<RedeemForm {...defaultProps} code="PROMO123" />);
      const user = userEvent.setup();

      const button = screen.getByRole('button', { name: /resgatar/i });
      await user.click(button);

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should call onSubmit with form event', async () => {
      render(<RedeemForm {...defaultProps} />);
      const user = userEvent.setup();

      const button = screen.getByRole('button', { name: /resgatar/i });
      await user.click(button);

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should submit form when Enter key pressed', async () => {
      render(<RedeemForm {...defaultProps} />);
      const user = userEvent.setup();

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should disable submit button while loading', () => {
      render(<RedeemForm {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeDisabled();
    });

    it('should show loading spinner when loading', () => {
      render(<RedeemForm {...defaultProps} loading={true} />);

      // Check for loading indicator text or spinner
      expect(screen.getByText(/carregando|processando/i)).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error is provided', () => {
      const errorMessage = 'Código inválido';
      render(<RedeemForm {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      render(<RedeemForm {...defaultProps} error={null} />);

      // Error alert should not be visible
      const errorContainer = screen.queryByRole('alert');
      expect(errorContainer).not.toBeInTheDocument();
    });

    it('should display different error types', () => {
      const errors = [
        'Código já foi utilizado',
        'Muitas tentativas. Tente novamente em 15 minutos',
        'Promoção ainda não começou'
      ];

      errors.forEach(error => {
        const { unmount } = render(<RedeemForm {...defaultProps} error={error} />);
        expect(screen.getByText(error)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Validation States', () => {
    it('should show validation state when form is invalid', () => {
      render(<RedeemForm {...defaultProps} error="Campo obrigatório" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should not show validation error when form is valid', () => {
      render(<RedeemForm {...defaultProps} error={null} code="PROMO123" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('false');
    });

    it('should require captcha verification', () => {
      render(
        <RedeemForm
          {...defaultProps}
          captchaVerified={false}
          isEnded={false}
          isStarted={true}
        />
      );

      const button = screen.getByRole('button', { name: /resgatar/i });
      // Button should be disabled if captcha not verified (depending on implementation)
      // or there should be a clear indication that captcha is required
      expect(screen.getByText(/verificar|captcha|humano/i)).toBeInTheDocument();
    });
  });

  describe('Promotional Dates', () => {
    it('should display promotional dates info', () => {
      render(<RedeemForm {...defaultProps} isStarted={true} isEnded={false} />);

      // Should show that promo is active
      expect(screen.getByText(/promoção ativa|resgate disponível/i)).toBeInTheDocument();
    });

    it('should show message when promo has not started', () => {
      render(<RedeemForm {...defaultProps} isStarted={false} isEnded={false} />);

      expect(screen.getByText(/ainda não começou|em breve/i)).toBeInTheDocument();
    });

    it('should show message when promo has ended', () => {
      render(<RedeemForm {...defaultProps} isStarted={true} isEnded={true} />);

      expect(screen.getByText(/encerrada|expirou|fim/i)).toBeInTheDocument();
    });

    it('should disable form when promo is not started', () => {
      render(<RedeemForm {...defaultProps} isStarted={false} />);

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeDisabled();
    });

    it('should disable form when promo has ended', () => {
      render(<RedeemForm {...defaultProps} isEnded={true} />);

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<RedeemForm {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /código/i });
      expect(input).toBeInTheDocument();
    });

    it('should have descriptive button text', () => {
      render(<RedeemForm {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/resgatar/i);
    });

    it('should provide error feedback with aria-invalid', () => {
      const { rerender } = render(<RedeemForm {...defaultProps} error={null} />);

      let input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('false');

      rerender(<RedeemForm {...defaultProps} error="Erro" />);

      input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should announce loading state', () => {
      render(<RedeemForm {...defaultProps} loading={true} />);

      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid input changes', async () => {
      render(<RedeemForm {...defaultProps} />);
      const user = userEvent.setup();

      const input = screen.getByRole('textbox');
      await user.type(input, 'RAPID', { delay: 1 });

      expect(mockOnChange).toHaveBeenCalledWith('RAPID');
    });

    it('should handle very long code inputs', async () => {
      render(<RedeemForm {...defaultProps} code={'A'.repeat(100)} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value.length).toBe(100);
    });

    it('should handle simultaneous loading and error states', () => {
      render(
        <RedeemForm
          {...defaultProps}
          loading={true}
          error="Algum erro ocorreu"
        />
      );

      expect(screen.getByText(/carregando|processando/i)).toBeInTheDocument();
      expect(screen.getByText('Algum erro ocorreu')).toBeInTheDocument();
    });

    it('should handle all state combinations', () => {
      const states = [
        { loading: true, captchaVerified: true, error: null },
        { loading: false, captchaVerified: false, error: 'Error' },
        { loading: true, captchaVerified: false, error: 'Error' },
        { loading: false, captchaVerified: true, error: null }
      ];

      states.forEach(state => {
        const { unmount } = render(<RedeemForm {...defaultProps} {...state} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Props Variations', () => {
    it('should render with empty code', () => {
      render(<RedeemForm {...defaultProps} code="" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle uppercase code input', () => {
      render(<RedeemForm {...defaultProps} code="PROMO123" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('PROMO123');
    });

    it('should handle all callback prop types', async () => {
      const onSubmitWithoutEvent = vi.fn();
      render(
        <RedeemForm
          {...defaultProps}
          onSubmit={onSubmitWithoutEvent}
        />
      );
      const user = userEvent.setup();

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onSubmitWithoutEvent).toHaveBeenCalled();
    });
  });
});
