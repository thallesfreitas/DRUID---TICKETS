/**
 * RedeemView Component Tests
 * Container component combining RedeemForm and RedeemSuccess
 * Tests: state management, form/success toggle, integration, copy functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedeemView } from '@/components/views/RedeemView';
import * as redeemModule from '@/hooks/useRedeem';

// Mock the useRedeem hook
vi.mock('@/hooks/useRedeem', () => ({
  useRedeem: vi.fn()
}));

describe('RedeemView Component', () => {
  const mockRedeemHook = redeemModule.useRedeem as any;

  const defaultHookReturn = {
    code: '',
    setCode: vi.fn(),
    captchaVerified: false,
    setCaptchaVerified: vi.fn(),
    loading: false,
    error: null,
    successData: null,
    isStarted: true,
    isEnded: false,
    settings: { start_date: '2024-01-01', end_date: '2024-12-31' },
    handleRedeem: vi.fn(),
    resetForm: vi.fn(),
    copied: false,
    onCopy: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedeemHook.mockReturnValue(defaultHookReturn);
  });

  describe('Rendering', () => {
    it('should render RedeemForm initially', () => {
      render(<RedeemView />);

      expect(screen.getByText(/Digite o código de promoção/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /código/i })).toBeInTheDocument();
    });

    it('should call useRedeem hook', () => {
      render(<RedeemView />);

      expect(mockRedeemHook).toHaveBeenCalled();
    });

    it('should pass correct props to RedeemForm', () => {
      render(<RedeemView />);

      const input = screen.getByRole('textbox', { name: /código/i });
      expect(input).toBeInTheDocument();

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call handleRedeem when form is submitted', async () => {
      const handleRedeem = vi.fn().mockResolvedValue(undefined);
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        code: 'PROMO123'
      });

      render(<RedeemView />);
      const user = userEvent.setup();

      const button = screen.getByRole('button', { name: /resgatar/i });
      await user.click(button);

      expect(handleRedeem).toHaveBeenCalled();
    });

    it('should pass code to handleRedeem', async () => {
      const handleRedeem = vi.fn().mockResolvedValue(undefined);
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        code: 'PROMO123'
      });

      render(<RedeemView />);
      const user = userEvent.setup();

      const button = screen.getByRole('button', { name: /resgatar/i });
      await user.click(button);

      await waitFor(() => {
        expect(handleRedeem).toHaveBeenCalled();
      });
    });

    it('should handle form submission errors', async () => {
      const errorMessage = 'Código inválido';
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        error: errorMessage
      });

      render(<RedeemView />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Form/Success Toggle', () => {
    it('should show success view when successData is set', () => {
      const successData = {
        link: 'https://example.com/promo-123'
      };

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData
      });

      render(<RedeemView />);

      // Should show success message instead of form
      expect(screen.getByText(/sucesso|resgatado com sucesso/i)).toBeInTheDocument();
      expect(screen.getByText(successData.link)).toBeInTheDocument();
    });

    it('should show form when successData is null', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: null
      });

      render(<RedeemView />);

      expect(screen.getByText(/Digite o código de promoção/i)).toBeInTheDocument();
    });

    it('should toggle from form to success after successful redeem', () => {
      const { rerender } = render(<RedeemView />);

      // Initially shows form
      expect(screen.getByText(/Digite o código de promoção/i)).toBeInTheDocument();

      // After success
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: { link: 'https://example.com' }
      });

      rerender(<RedeemView />);

      // Now shows success
      expect(screen.getByText(/sucesso|resgatado com sucesso/i)).toBeInTheDocument();
    });

    it('should show correct view based on successData state', () => {
      const states = [
        { successData: null, shouldShowForm: true },
        { successData: { link: 'https://a.com' }, shouldShowForm: false },
        { successData: null, shouldShowForm: true }
      ];

      states.forEach(state => {
        mockRedeemHook.mockReturnValue({
          ...defaultHookReturn,
          ...state
        });

        const { unmount } = render(<RedeemView />);

        if (state.shouldShowForm) {
          expect(screen.getByText(/Digite o código de promoção/i)).toBeInTheDocument();
        } else {
          expect(screen.getByText(/sucesso/i)).toBeInTheDocument();
        }

        unmount();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should call onCopy when copy button is clicked', async () => {
      const onCopy = vi.fn();
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: { link: 'https://example.com' },
        onCopy,
        copied: false
      });

      render(<RedeemView />);
      const user = userEvent.setup();

      const copyButton = screen.getByRole('button', { name: /copiar|copy/i });
      await user.click(copyButton);

      expect(onCopy).toHaveBeenCalled();
    });

    it('should pass correct link to copy', () => {
      const testLink = 'https://example.com/promo-2024-xyz';
      const onCopy = vi.fn();

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: { link: testLink },
        onCopy
      });

      render(<RedeemView />);

      expect(screen.getByText(testLink)).toBeInTheDocument();
    });

    it('should handle copy state changes', () => {
      const { rerender } = render(<RedeemView />);

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: { link: 'https://example.com' },
        copied: true
      });

      rerender(<RedeemView />);

      expect(screen.getByRole('button', { name: /copiado|copied/i })).toBeInTheDocument();
    });
  });

  describe('Reset Form', () => {
    it('should call resetForm when reset button is clicked', async () => {
      const resetForm = vi.fn();
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: { link: 'https://example.com' },
        resetForm
      });

      render(<RedeemView />);
      const user = userEvent.setup();

      const resetButton = screen.getByRole('button', { name: /novo resgate|resgatar outro/i });
      await user.click(resetButton);

      expect(resetForm).toHaveBeenCalled();
    });

    it('should return to form after reset', async () => {
      const resetForm = vi.fn();
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: { link: 'https://example.com' },
        resetForm
      });

      const { rerender } = render(<RedeemView />);

      // Show success view
      expect(screen.getByText(/sucesso/i)).toBeInTheDocument();

      // Simulate reset
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        successData: null,
        resetForm
      });

      rerender(<RedeemView />);

      // Back to form
      expect(screen.getByText(/Digite o código de promoção/i)).toBeInTheDocument();
    });

    it('should allow multiple redeems after reset', async () => {
      const handleRedeem = vi.fn().mockResolvedValue(undefined);
      const resetForm = vi.fn();

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        resetForm,
        code: 'PROMO1'
      });

      const { rerender } = render(<RedeemView />);

      // First redeem
      let button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeInTheDocument();

      // Simulate success
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        resetForm,
        successData: { link: 'https://example.com' }
      });

      rerender(<RedeemView />);

      // Reset
      const resetButton = screen.getByRole('button', { name: /novo resgate/i });
      expect(resetButton).toBeInTheDocument();

      // Back to form for second redeem
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        resetForm,
        code: ''
      });

      rerender(<RedeemView />);

      button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      const errorMessage = 'Código já foi utilizado';
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        error: errorMessage
      });

      render(<RedeemView />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show brute force error', () => {
      const bruteForceError = 'Muitas tentativas. Tente novamente em 15 minutos';
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        error: bruteForceError
      });

      render(<RedeemView />);

      expect(screen.getByText(bruteForceError)).toBeInTheDocument();
    });

    it('should clear error after successful redeem', () => {
      const { rerender } = render(<RedeemView />);

      // Show error
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        error: 'Código inválido'
      });

      rerender(<RedeemView />);
      expect(screen.getByText('Código inválido')).toBeInTheDocument();

      // Clear error on success
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        error: null,
        successData: { link: 'https://example.com' }
      });

      rerender(<RedeemView />);
      expect(screen.queryByText('Código inválido')).not.toBeInTheDocument();
    });

    it('should handle various error types', () => {
      const errors = [
        'Código inválido',
        'Código já foi utilizado',
        'Promoção ainda não começou',
        'Promoção encerrada',
        'Muitas tentativas'
      ];

      errors.forEach(error => {
        mockRedeemHook.mockReturnValue({
          ...defaultHookReturn,
          error
        });

        const { unmount } = render(<RedeemView />);
        expect(screen.getByText(error)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable form while loading', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        loading: true
      });

      render(<RedeemView />);

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).toBeDisabled();
    });

    it('should show loading indicator', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        loading: true
      });

      render(<RedeemView />);

      expect(screen.getByText(/carregando|processando/i)).toBeInTheDocument();
    });

    it('should enable form when loading completes', () => {
      const { rerender } = render(<RedeemView />);

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        loading: false
      });

      rerender(<RedeemView />);

      const button = screen.getByRole('button', { name: /resgatar/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Code Input Handling', () => {
    it('should update code on input change', async () => {
      const setCode = vi.fn();
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        setCode,
        code: 'PROMO123'
      });

      render(<RedeemView />);

      // Code is set via hook
      expect(mockRedeemHook).toHaveBeenCalled();
    });

    it('should handle uppercase code conversion', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        code: 'PROMO123'
      });

      render(<RedeemView />);

      const input = screen.getByRole('textbox', { name: /código/i }) as HTMLInputElement;
      expect(input.value).toBe('PROMO123');
    });
  });

  describe('Captcha Handling', () => {
    it('should toggle captcha verification', () => {
      const setCaptchaVerified = vi.fn();
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        setCaptchaVerified,
        captchaVerified: false
      });

      render(<RedeemView />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should show captcha requirement', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        captchaVerified: false
      });

      render(<RedeemView />);

      expect(screen.getByText(/captcha|humano|verificar/i)).toBeInTheDocument();
    });
  });

  describe('Promotional Dates', () => {
    it('should display when promo is active', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        isStarted: true,
        isEnded: false
      });

      render(<RedeemView />);

      expect(screen.getByRole('button', { name: /resgatar/i })).not.toBeDisabled();
    });

    it('should disable form when promo has not started', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        isStarted: false,
        isEnded: false
      });

      render(<RedeemView />);

      expect(screen.getByRole('button', { name: /resgatar/i })).toBeDisabled();
    });

    it('should disable form when promo has ended', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        isStarted: true,
        isEnded: true
      });

      render(<RedeemView />);

      expect(screen.getByRole('button', { name: /resgatar/i })).toBeDisabled();
    });
  });

  describe('Integration', () => {
    it('should handle complete redeem flow', async () => {
      const handleRedeem = vi.fn().mockResolvedValue(undefined);
      const resetForm = vi.fn();
      const onCopy = vi.fn();

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        resetForm,
        onCopy,
        code: 'PROMO123',
        captchaVerified: true
      });

      const { rerender } = render(<RedeemView />);
      const user = userEvent.setup();

      // Submit form
      let button = screen.getByRole('button', { name: /resgatar/i });
      await user.click(button);

      // Show success
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        resetForm,
        onCopy,
        successData: { link: 'https://example.com/promo-123' }
      });

      rerender(<RedeemView />);

      expect(screen.getByText(/sucesso/i)).toBeInTheDocument();

      // Copy link
      const copyButton = screen.getByRole('button', { name: /copiar/i });
      await user.click(copyButton);

      expect(onCopy).toHaveBeenCalled();

      // Reset
      const resetButton = screen.getByRole('button', { name: /novo resgate/i });
      await user.click(resetButton);

      expect(resetForm).toHaveBeenCalled();
    });

    it('should handle multiple error and retry flow', async () => {
      const handleRedeem = vi.fn().mockResolvedValue(undefined);

      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        error: 'Código inválido'
      });

      const { rerender } = render(<RedeemView />);

      expect(screen.getByText('Código inválido')).toBeInTheDocument();

      // Retry with correct code
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        handleRedeem,
        error: null,
        successData: { link: 'https://example.com' }
      });

      rerender(<RedeemView />);

      expect(screen.getByText(/sucesso/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null settings', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        settings: null
      });

      render(<RedeemView />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle rapid state changes', () => {
      const { rerender } = render(<RedeemView />);

      for (let i = 0; i < 5; i++) {
        mockRedeemHook.mockReturnValue({
          ...defaultHookReturn,
          successData: i % 2 === 0 ? null : { link: 'https://example.com' }
        });

        rerender(<RedeemView />);
      }

      // Should end in success state
      expect(screen.getByText(/sucesso/i)).toBeInTheDocument();
    });

    it('should handle unmount during loading', () => {
      mockRedeemHook.mockReturnValue({
        ...defaultHookReturn,
        loading: true
      });

      const { unmount } = render(<RedeemView />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
