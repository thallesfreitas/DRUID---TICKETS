import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminView } from '@/components/views/AdminView';
import { useAdmin } from '@/hooks/useAdmin';
import { usePolling } from '@/hooks/usePolling';

vi.mock('@/hooks/useAdmin', () => ({ useAdmin: vi.fn() }));
vi.mock('@/hooks/usePolling', () => ({ usePolling: vi.fn() }));

function buildAdminMock(overrides: Partial<ReturnType<typeof useAdmin>> = {}) {
  return {
    settings: { start_date: '2024-01-01 00:00:00', end_date: '2024-12-31 00:00:00' },
    settingsLoading: false,
    updateSettings: vi.fn().mockResolvedValue(undefined),
    codesPage: 1,
    setCodesPage: vi.fn(),
    codesSearch: '',
    setCodesSearch: vi.fn(),
    codesList: {
      codes: [
        {
          id: 1,
          code: 'PROMO001',
          link: 'https://example.com/1',
          is_used: false,
          used_at: null,
          ip_address: null,
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    },
    codesLoading: false,
    fetchCodes: vi.fn().mockResolvedValue(undefined),
    stats: {
      total: 100,
      used: 25,
      available: 75,
      recent: [],
    },
    statsLoading: false,
    statsError: null,
    fetchStats: vi.fn().mockResolvedValue(undefined),
    uploadCsv: vi.fn().mockResolvedValue({ jobId: 'job-1' }),
    importProgress: null,
    importLoading: false,
    exportRedeemed: vi.fn().mockResolvedValue(undefined),
    exportLoading: false,
    exportError: null,
    ...overrides,
  } as ReturnType<typeof useAdmin>;
}

describe('AdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePolling).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      isPolling: false,
    });
  });

  it('renders dashboard and loads stats by default', async () => {
    const admin = buildAdminMock();
    vi.mocked(useAdmin).mockReturnValue(admin);

    render(<AdminView onBack={vi.fn()} />);

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(admin.fetchStats).toHaveBeenCalled();
    });

    expect(screen.getByText('Total de Códigos')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('switches to codes view and fetches codes', async () => {
    const admin = buildAdminMock();
    vi.mocked(useAdmin).mockReturnValue(admin);

    const user = userEvent.setup();
    render(<AdminView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Lista de Códigos' }));

    await waitFor(() => {
      expect(admin.fetchCodes).toHaveBeenCalled();
    });
    expect(screen.getByText('PROMO001')).toBeInTheDocument();
  });

  it('saves dates through updateSettings', async () => {
    const admin = buildAdminMock();
    vi.mocked(useAdmin).mockReturnValue(admin);

    const user = userEvent.setup();
    render(<AdminView onBack={vi.fn()} />);

    const [startInput] = screen.getAllByPlaceholderText('DD/MM/AAAA');
    await user.clear(startInput);
    await user.type(startInput, '15032026');

    await user.click(screen.getByRole('button', { name: 'Salvar Datas' }));

    await waitFor(() => {
      expect(admin.updateSettings).toHaveBeenCalled();
    });

    expect(admin.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: '2026-03-15 00:00:00',
      })
    );
  });

  it('exports redeemed data', async () => {
    const admin = buildAdminMock();
    vi.mocked(useAdmin).mockReturnValue(admin);

    const user = userEvent.setup();
    render(<AdminView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Lista de Códigos' }));
    await user.click(screen.getByRole('button', { name: /exportar resgatados/i }));

    expect(admin.exportRedeemed).toHaveBeenCalledTimes(1);
  });

  it('renders retry state when stats fail', () => {
    vi.mocked(useAdmin).mockReturnValue(
      buildAdminMock({
        stats: null,
        statsError: 'Falha ao carregar',
      })
    );

    render(<AdminView onBack={vi.fn()} />);

    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
