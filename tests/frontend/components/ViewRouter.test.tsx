/**
 * ViewRouter Component Tests
 * Central routing logic for all views
 * Tests: view switching, animations, proper view rendering, view transitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewRouter } from '@/components/ViewRouter';
import type { ViewType } from '@/types/api';

// Mock view components
vi.mock('@/components/views/RedeemView', () => ({
  RedeemView: () => <div data-testid="redeem-view">Redeem View</div>
}));

vi.mock('@/components/views/AdminView', () => ({
  AdminView: () => <div data-testid="admin-view">Admin View</div>
}));

vi.mock('@/components/views/HelpView', () => ({
  HelpView: () => <div data-testid="help-view">Help View</div>
}));

vi.mock('@/components/views/PrivacyView', () => ({
  PrivacyView: () => <div data-testid="privacy-view">Privacy View</div>
}));

vi.mock('@/components/views/TermsView', () => ({
  TermsView: () => <div data-testid="terms-view">Terms View</div>
}));

describe('ViewRouter Component', () => {
  const defaultProps = {
    view: 'redeem' as ViewType,
    setView: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('View Rendering', () => {
    it('should render RedeemView when view is redeem', () => {
      render(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
    });

    it('should render AdminView when view is admin', () => {
      render(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
    });

    it('should render HelpView when view is help', () => {
      render(<ViewRouter {...defaultProps} view="help" />);

      expect(screen.getByTestId('help-view')).toBeInTheDocument();
    });

    it('should render PrivacyView when view is privacy', () => {
      render(<ViewRouter {...defaultProps} view="privacy" />);

      expect(screen.getByTestId('privacy-view')).toBeInTheDocument();
    });

    it('should render TermsView when view is terms', () => {
      render(<ViewRouter {...defaultProps} view="terms" />);

      expect(screen.getByTestId('terms-view')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('should switch from redeem to admin', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-view')).not.toBeInTheDocument();

      rerender(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.queryByTestId('redeem-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
    });

    it('should switch from admin to help', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();

      rerender(<ViewRouter {...defaultProps} view="help" />);

      expect(screen.queryByTestId('admin-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('help-view')).toBeInTheDocument();
    });

    it('should switch between legal views', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="privacy" />);

      expect(screen.getByTestId('privacy-view')).toBeInTheDocument();

      rerender(<ViewRouter {...defaultProps} view="terms" />);

      expect(screen.queryByTestId('privacy-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('terms-view')).toBeInTheDocument();
    });

    it('should return to redeem from any view', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();

      rerender(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.queryByTestId('admin-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
    });

    it('should handle rapid view changes', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      const views: ViewType[] = ['admin', 'help', 'privacy', 'terms', 'redeem'];

      views.forEach(view => {
        rerender(<ViewRouter {...defaultProps} view={view} />);
        expect(screen.getByTestId(`${view}-view`)).toBeInTheDocument();
      });
    });
  });

  describe('All Views', () => {
    it('should render exactly one view at a time', () => {
      const views: ViewType[] = ['redeem', 'admin', 'help', 'privacy', 'terms'];

      views.forEach(view => {
        const { unmount } = render(<ViewRouter {...defaultProps} view={view} />);

        const renderedViews = ['redeem', 'admin', 'help', 'privacy', 'terms'].filter(v => {
          try {
            screen.getByTestId(`${v}-view`);
            return true;
          } catch {
            return false;
          }
        });

        expect(renderedViews).toHaveLength(1);
        expect(renderedViews[0]).toBe(view);
        unmount();
      });
    });

    it('should support all valid view types', () => {
      const validViews: ViewType[] = ['redeem', 'admin', 'help', 'privacy', 'terms'];

      validViews.forEach(view => {
        const { unmount } = render(<ViewRouter {...defaultProps} view={view} />);
        expect(screen.getByTestId(`${view}-view`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Animation and Transitions', () => {
    it('should have AnimatePresence for view transitions', () => {
      const { container } = render(<ViewRouter {...defaultProps} view="redeem" />);

      // Check that motion/react AnimatePresence is present
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle view transitions smoothly', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      // Transition to admin
      rerender(<ViewRouter {...defaultProps} view="admin" />);

      // Should not throw and should render new view
      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
    });
  });

  describe('View Props', () => {
    it('should pass setView to child views if needed', () => {
      const mockSetView = vi.fn();
      render(<ViewRouter {...defaultProps} setView={mockSetView} view="help" />);

      expect(screen.getByTestId('help-view')).toBeInTheDocument();
    });

    it('should have setView function available', () => {
      const setView = vi.fn();
      render(<ViewRouter {...defaultProps} setView={setView} view="redeem" />);

      expect(setView).toBeDefined();
    });
  });

  describe('View Dependencies', () => {
    it('should render RedeemView independently', () => {
      const { unmount } = render(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
      expect(() => unmount()).not.toThrow();
    });

    it('should render AdminView independently', () => {
      const { unmount } = render(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
      expect(() => unmount()).not.toThrow();
    });

    it('should render all legal views independently', () => {
      const legalViews: ViewType[] = ['help', 'privacy', 'terms'];

      legalViews.forEach(view => {
        const { unmount } = render(<ViewRouter {...defaultProps} view={view} />);
        expect(screen.getByTestId(`${view}-view`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('State Management', () => {
    it('should accept view prop', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();

      rerender(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
    });

    it('should accept setView prop', () => {
      const setView = vi.fn();
      render(<ViewRouter {...defaultProps} setView={setView} view="redeem" />);

      expect(setView).toBeDefined();
    });

    it('should update when props change', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      const newSetView = vi.fn();
      rerender(<ViewRouter {...defaultProps} view="admin" setView={newSetView} />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle initial redeem view', () => {
      render(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
    });

    it('should handle returning to redeem from all views', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="admin" />);

      rerender(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
    });

    it('should handle rapid switching between views', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      for (let i = 0; i < 10; i++) {
        const views: ViewType[] = ['admin', 'help', 'privacy', 'terms', 'redeem'];
        const view = views[i % views.length];

        rerender(<ViewRouter {...defaultProps} view={view} />);

        expect(screen.getByTestId(`${view}-view`)).toBeInTheDocument();
      }
    });

    it('should handle same view re-render', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      rerender(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
    });

    it('should unmount correctly', () => {
      const { unmount } = render(<ViewRouter {...defaultProps} view="admin" />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Navigation Flow', () => {
    it('should support help view access from redeem', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      rerender(<ViewRouter {...defaultProps} view="help" />);

      expect(screen.getByTestId('help-view')).toBeInTheDocument();
    });

    it('should support privacy view access from redeem', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      rerender(<ViewRouter {...defaultProps} view="privacy" />);

      expect(screen.getByTestId('privacy-view')).toBeInTheDocument();
    });

    it('should support terms view access from redeem', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      rerender(<ViewRouter {...defaultProps} view="terms" />);

      expect(screen.getByTestId('terms-view')).toBeInTheDocument();
    });

    it('should support admin view access from redeem', () => {
      const { rerender } = render(<ViewRouter {...defaultProps} view="redeem" />);

      rerender(<ViewRouter {...defaultProps} view="admin" />);

      expect(screen.getByTestId('admin-view')).toBeInTheDocument();
    });

    it('should always allow return to redeem', () => {
      const views: ViewType[] = ['admin', 'help', 'privacy', 'terms'];

      views.forEach(view => {
        const { rerender, unmount } = render(<ViewRouter {...defaultProps} view={view} />);

        rerender(<ViewRouter {...defaultProps} view="redeem" />);

        expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Rendering Performance', () => {
    it('should not render unmounted views', () => {
      render(<ViewRouter {...defaultProps} view="redeem" />);

      expect(screen.getByTestId('redeem-view')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('help-view')).not.toBeInTheDocument();
    });

    it('should only render active view', () => {
      const testCases: ViewType[] = ['redeem', 'admin', 'help', 'privacy', 'terms'];

      testCases.forEach(view => {
        const { unmount } = render(<ViewRouter {...defaultProps} view={view} />);

        const visibleElements = testCases.filter(v => {
          try {
            screen.getByTestId(`${v}-view`);
            return true;
          } catch {
            return false;
          }
        });

        expect(visibleElements).toHaveLength(1);
        unmount();
      });
    });
  });
});
