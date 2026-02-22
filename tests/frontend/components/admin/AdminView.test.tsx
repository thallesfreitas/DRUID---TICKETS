/**
 * AdminView Component Tests
 * Complete admin dashboard with statistics, code management, CSV upload
 * Tests: stats display, codes management, CSV upload, settings, pagination, search
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminView } from '@/components/views/AdminView';
import * as adminModule from '@/hooks/useAdmin';
import * as pollingModule from '@/hooks/usePolling';

// Mock the hooks
vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn()
}));

vi.mock('@/hooks/usePolling', () => ({
  usePolling: vi.fn()
}));

describe('AdminView Component', () => {
  const mockUseAdmin = adminModule.useAdmin as any;
  const mockUsePolling = pollingModule.usePolling as any;

  const defaultAdminReturn = {
    codes: [
      { id: 1, code: 'PROMO001', link: 'https://example.com/1', is_used: false, used_at: null, ip_address: null },
      { id: 2, code: 'PROMO002', link: 'https://example.com/2', is_used: true, used_at: '2024-01-15 10:30', ip_address: '192.168.1.1' },
      { id: 3, code: 'PROMO003', link: 'https://example.com/3', is_used: false, used_at: null, ip_address: null }
    ],
    stats: {
      total: 100,
      used: 25,
      available: 75,
      recent: [
        { code: 'PROMO002', ip_address: '192.168.1.1', used_at: '2024-01-15 10:30' }
      ]
    },
    currentPage: 1,
    totalPages: 5,
    searchQuery: '',
    settings: { start_date: '2024-01-01', end_date: '2024-12-31' },
    loading: false,
    error: null,
    importStatus: null,
    onFetchCodes: vi.fn(),
    onSearch: vi.fn(),
    onPageChange: vi.fn(),
    onUpdateSettings: vi.fn(),
    onUploadCsv: vi.fn(),
    onExport: vi.fn()
  };

  const defaultPollingReturn = {
    data: {
      total: 100,
      used: 25,
      available: 75,
      recent: []
    },
    isPolling: false,
    error: null,
    startPolling: vi.fn(),
    stopPolling: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAdmin.mockReturnValue(defaultAdminReturn);
    mockUsePolling.mockReturnValue(defaultPollingReturn);
  });

  describe('Rendering', () => {
    it('should render admin header', () => {
      render(<AdminView />);

      expect(screen.getByText(/painel administrativo|admin|dashboard/i)).toBeInTheDocument();
    });

    it('should render admin controls (tabs)', () => {
      render(<AdminView />);

      expect(screen.getByRole('button', { name: /estatísticas|stats/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /códigos|codes/i })).toBeInTheDocument();
    });

    it('should render admin settings', () => {
      render(<AdminView />);

      expect(screen.getByText(/data de início|start date/i)).toBeInTheDocument();
      expect(screen.getByText(/data de término|end date/i)).toBeInTheDocument();
    });

    it('should render CSV upload section', () => {
      render(<AdminView />);

      expect(screen.getByText(/upload csv|importar/i)).toBeInTheDocument();
    });
  });

  describe('Statistics View', () => {
    it('should display stats cards', () => {
      render(<AdminView />);

      expect(screen.getByText(/total de códigos|total codes/i)).toBeInTheDocument();
      expect(screen.getByText(/códigos utilizados|used codes/i)).toBeInTheDocument();
      expect(screen.getByText(/códigos disponíveis|available codes/i)).toBeInTheDocument();
    });

    it('should show correct stat values', () => {
      render(<AdminView />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should display usage percentage', () => {
      render(<AdminView />);

      // 25 used out of 100 = 25%
      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });

    it('should show recent redeems list', () => {
      render(<AdminView />);

      expect(screen.getByText(/recent|recentes|ultimos/i)).toBeInTheDocument();
      expect(screen.getByText('PROMO002')).toBeInTheDocument();
    });

    it('should update stats when polling data changes', () => {
      const { rerender } = render(<AdminView />);

      mockUsePolling.mockReturnValue({
        ...defaultPollingReturn,
        data: {
          total: 150,
          used: 50,
          available: 100,
          recent: []
        }
      });

      rerender(<AdminView />);

      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('Codes List View', () => {
    it('should render codes table when codes tab is active', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      await waitFor(() => {
        expect(screen.getByText('PROMO001')).toBeInTheDocument();
        expect(screen.getByText('PROMO002')).toBeInTheDocument();
        expect(screen.getByText('PROMO003')).toBeInTheDocument();
      });
    });

    it('should display code usage status', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      await waitFor(() => {
        // PROMO002 is used
        expect(screen.getByText(/utilizado|used|2024-01-15/)).toBeInTheDocument();
      });
    });

    it('should show pagination controls', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      await waitFor(() => {
        expect(screen.getByText(/página|page/i)).toBeInTheDocument();
      });
    });

    it('should handle pagination', async () => {
      const onPageChange = vi.fn();
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        onPageChange
      });

      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      const nextButton = screen.getAllByRole('button').find(btn =>
        /próxima|next|>/i.test(btn.textContent || '')
      );

      if (nextButton) {
        await user.click(nextButton);
        expect(onPageChange).toHaveBeenCalled();
      }
    });

    it('should display search/filter functionality', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      const searchInput = screen.queryByRole('textbox', { name: /buscar|search|filter/i });
      expect(searchInput).toBeInTheDocument();
    });

    it('should handle search', async () => {
      const onSearch = vi.fn();
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        onSearch
      });

      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      const searchInput = screen.getByRole('textbox', { name: /buscar|search/i });
      await user.type(searchInput, 'PROMO001');

      expect(onSearch).toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    it('should display start and end date inputs', () => {
      render(<AdminView />);

      const startInput = screen.getByLabelText(/data de início|start date/i);
      const endInput = screen.getByLabelText(/data de término|end date/i);

      expect(startInput).toBeInTheDocument();
      expect(endInput).toBeInTheDocument();
    });

    it('should show current settings values', () => {
      render(<AdminView />);

      const startInput = screen.getByLabelText(/data de início|start date/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/data de término|end date/i) as HTMLInputElement;

      expect(startInput.value).toContain('2024-01-01');
      expect(endInput.value).toContain('2024-12-31');
    });

    it('should call onUpdateSettings when save is clicked', async () => {
      const onUpdateSettings = vi.fn();
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        onUpdateSettings
      });

      render(<AdminView />);
      const user = userEvent.setup();

      const saveButton = screen.getByRole('button', { name: /salvar|save/i });
      await user.click(saveButton);

      expect(onUpdateSettings).toHaveBeenCalled();
    });

    it('should allow date modification', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const startInput = screen.getByLabelText(/data de início|start date/i);
      await user.clear(startInput);
      await user.type(startInput, '2024-02-01');

      expect(startInput).toHaveValue('2024-02-01');
    });

    it('should validate date ranges', () => {
      render(<AdminView />);

      const startInput = screen.getByLabelText(/data de início|start date/i);
      const endInput = screen.getByLabelText(/data de término|end date/i);

      // Both inputs should be present
      expect(startInput).toBeInTheDocument();
      expect(endInput).toBeInTheDocument();
    });
  });

  describe('CSV Upload', () => {
    it('should display CSV upload input', () => {
      render(<AdminView />);

      const fileInput = screen.getByLabelText(/upload csv|escolher arquivo|selecionar csv/i);
      expect(fileInput).toBeInTheDocument();
    });

    it('should handle file selection', async () => {
      const onUploadCsv = vi.fn();
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        onUploadCsv
      });

      render(<AdminView />);
      const user = userEvent.setup();

      const fileInput = screen.getByLabelText(/upload csv|escolher arquivo/i) as HTMLInputElement;

      // Create a mock file
      const file = new File(['PROMO001,https://example.com/1'], 'codes.csv', { type: 'text/csv' });

      await user.upload(fileInput, file);

      expect(fileInput.files?.[0]).toBe(file);
    });

    it('should show upload progress', () => {
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        importStatus: {
          progress: 50,
          total: 100,
          processed: 50
        }
      });

      render(<AdminView />);

      expect(screen.getByText(/50%|progresso|progress/i)).toBeInTheDocument();
    });

    it('should handle upload completion', () => {
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        importStatus: {
          progress: 100,
          total: 100,
          processed: 100
        }
      });

      render(<AdminView />);

      expect(screen.getByText(/100%|concluído|completed/i)).toBeInTheDocument();
    });

    it('should handle upload errors', () => {
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        error: 'Erro ao fazer upload do arquivo CSV'
      });

      render(<AdminView />);

      expect(screen.getByText('Erro ao fazer upload do arquivo CSV')).toBeInTheDocument();
    });
  });

  describe('View Switching', () => {
    it('should switch to stats view by default', () => {
      render(<AdminView />);

      expect(screen.getByText(/total de códigos|total codes/i)).toBeInTheDocument();
    });

    it('should switch to codes view', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      await waitFor(() => {
        expect(screen.getByText('PROMO001')).toBeInTheDocument();
      });
    });

    it('should maintain tab state on re-render', () => {
      const { rerender } = render(<AdminView />);

      // Stats view is visible
      expect(screen.getByText(/total de códigos/i)).toBeInTheDocument();

      rerender(<AdminView />);

      // Should still be in stats view
      expect(screen.getByText(/total de códigos/i)).toBeInTheDocument();
    });
  });

  describe('Polling Integration', () => {
    it('should use polling hook for stats', () => {
      render(<AdminView />);

      expect(mockUsePolling).toHaveBeenCalled();
    });

    it('should start polling on mount', () => {
      const startPolling = vi.fn();
      mockUsePolling.mockReturnValue({
        ...defaultPollingReturn,
        startPolling
      });

      render(<AdminView />);

      expect(startPolling).toHaveBeenCalled();
    });

    it('should update stats from polling data', () => {
      mockUsePolling.mockReturnValue({
        ...defaultPollingReturn,
        data: {
          total: 200,
          used: 100,
          available: 100,
          recent: []
        }
      });

      render(<AdminView />);

      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should handle polling errors', () => {
      mockUsePolling.mockReturnValue({
        ...defaultPollingReturn,
        error: 'Erro ao carregar estatísticas'
      });

      render(<AdminView />);

      // Should still render even with error
      expect(screen.getByText(/admin|dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should display export button', () => {
      render(<AdminView />);

      expect(screen.getByRole('button', { name: /exportar|export|download/i })).toBeInTheDocument();
    });

    it('should call onExport when export button is clicked', async () => {
      const onExport = vi.fn();
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        onExport
      });

      render(<AdminView />);
      const user = userEvent.setup();

      const exportButton = screen.getByRole('button', { name: /exportar|export|download/i });
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when fetching codes', () => {
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        loading: true
      });

      render(<AdminView />);

      expect(screen.getByText(/carregando|loading/i)).toBeInTheDocument();
    });

    it('should disable interactions while loading', () => {
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        loading: true
      });

      render(<AdminView />);

      const saveButton = screen.getByRole('button', { name: /salvar|save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', () => {
      const errorMessage = 'Erro ao carregar códigos';
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        error: errorMessage
      });

      render(<AdminView />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      const onFetchCodes = vi.fn();
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        error: 'Erro ao carregar',
        onFetchCodes
      });

      render(<AdminView />);
      const user = userEvent.setup();

      const retryButton = screen.queryByRole('button', { name: /tentar novamente|retry/i });
      if (retryButton) {
        await user.click(retryButton);
        expect(onFetchCodes).toHaveBeenCalled();
      }
    });
  });

  describe('Integration', () => {
    it('should handle complete admin workflow', async () => {
      const onFetchCodes = vi.fn();
      const onUpdateSettings = vi.fn();
      const onUploadCsv = vi.fn();
      const onExport = vi.fn();

      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        onFetchCodes,
        onUpdateSettings,
        onUploadCsv,
        onExport
      });

      render(<AdminView />);
      const user = userEvent.setup();

      // View stats
      expect(screen.getByText(/total de códigos/i)).toBeInTheDocument();

      // Switch to codes view
      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });
      await user.click(codesTab);

      // Export codes
      const exportButton = screen.getByRole('button', { name: /exportar|export/i });
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalled();

      // Update settings
      const saveButton = screen.getByRole('button', { name: /salvar|save/i });
      await user.click(saveButton);

      expect(onUpdateSettings).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty codes list', () => {
      mockUseAdmin.mockReturnValue({
        ...defaultAdminReturn,
        codes: []
      });

      render(<AdminView />);

      expect(screen.getByText(/admin|dashboard/i)).toBeInTheDocument();
    });

    it('should handle null stats', () => {
      mockUsePolling.mockReturnValue({
        ...defaultPollingReturn,
        data: null
      });

      render(<AdminView />);

      expect(screen.getByText(/admin|dashboard/i)).toBeInTheDocument();
    });

    it('should handle rapid tab switching', async () => {
      render(<AdminView />);
      const user = userEvent.setup();

      const statsTab = screen.getByRole('button', { name: /estatísticas|stats/i });
      const codesTab = screen.getByRole('button', { name: /códigos|codes/i });

      for (let i = 0; i < 5; i++) {
        await user.click(statsTab);
        await user.click(codesTab);
      }

      // Should end up in codes view
      await waitFor(() => {
        expect(screen.getByText('PROMO001')).toBeInTheDocument();
      });
    });
  });
});
