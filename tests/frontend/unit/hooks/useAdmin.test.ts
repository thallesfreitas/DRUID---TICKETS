import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdmin } from '@/hooks/useAdmin';
import { useFetch } from '@/hooks/useFetch';

const serviceMocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  getCodes: vi.fn(),
  getStats: vi.fn(),
  updateSettings: vi.fn(),
  uploadCsv: vi.fn(),
  exportRedeemed: vi.fn(),
}));

vi.mock('@/hooks/useFetch', () => ({
  useFetch: vi.fn(),
}));

vi.mock('@/services/api/admin', () => {
  class MockAdminService {
    getSettings = serviceMocks.getSettings;
    getCodes = serviceMocks.getCodes;
    getStats = serviceMocks.getStats;
    updateSettings = serviceMocks.updateSettings;
    uploadCsv = serviceMocks.uploadCsv;
    exportRedeemed = serviceMocks.exportRedeemed;
  }

  return { AdminService: MockAdminService };
});

describe('useAdmin', () => {
  const refetchSettings = vi.fn();
  const refetchCodes = vi.fn();
  const refetchStats = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const fetchStates = [
      {
        data: { start_date: '2024-01-01', end_date: '2024-12-31' },
        loading: false,
        refetch: refetchSettings,
      },
      {
        data: { codes: [], total: 0, page: 1, totalPages: 1 },
        loading: false,
        refetch: refetchCodes,
      },
      {
        data: { total: 10, used: 2, available: 8, recent: [] },
        loading: false,
        error: null,
        refetch: refetchStats,
      },
    ];

    let callIndex = 0;
    vi.mocked(useFetch).mockImplementation(() => {
      const state = fetchStates[callIndex % fetchStates.length];
      callIndex += 1;
      return state as any;
    });

    serviceMocks.updateSettings.mockResolvedValue(undefined);
    serviceMocks.uploadCsv.mockResolvedValue({ jobId: 'job-1', totalLines: 12 });
    serviceMocks.exportRedeemed.mockResolvedValue(undefined);
  });

  it('returns mapped state from useFetch', () => {
    const { result } = renderHook(() => useAdmin());

    expect(result.current.settings?.start_date).toBe('2024-01-01');
    expect(result.current.codesList?.totalPages).toBe(1);
    expect(result.current.stats?.available).toBe(8);
    expect(result.current.codesPage).toBe(1);
    expect(result.current.codesSearch).toBe('');
  });

  it('updates local pagination/search state', () => {
    const { result } = renderHook(() => useAdmin());

    act(() => {
      result.current.setCodesPage(3);
      result.current.setCodesSearch('PROMO');
    });

    expect(result.current.codesPage).toBe(3);
    expect(result.current.codesSearch).toBe('PROMO');
  });

  it('exposes fetch wrappers that call refetch', async () => {
    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.fetchCodes();
      await result.current.fetchStats();
    });

    expect(refetchCodes).toHaveBeenCalledTimes(1);
    expect(refetchStats).toHaveBeenCalledTimes(1);
  });

  it('updates settings and refetches settings', async () => {
    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.updateSettings({
        start_date: '2024-02-01',
        end_date: '2024-12-31',
      });
    });

    expect(serviceMocks.updateSettings).toHaveBeenCalledWith({
      start_date: '2024-02-01',
      end_date: '2024-12-31',
    });
    expect(refetchSettings).toHaveBeenCalledTimes(1);
  });

  it('uploads csv and sets initial import progress', async () => {
    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.uploadCsv('code,link\\nPROMO,https://example.com');
    });

    expect(serviceMocks.uploadCsv).toHaveBeenCalledTimes(1);
    expect(result.current.importProgress?.jobId).toBe('job-1');
    expect(result.current.importProgress?.status).toBe('processing');
  });

  it('exports redeemed codes and handles success state', async () => {
    const { result } = renderHook(() => useAdmin());

    await act(async () => {
      await result.current.exportRedeemed();
    });

    expect(serviceMocks.exportRedeemed).toHaveBeenCalledTimes(1);
    expect(result.current.exportLoading).toBe(false);
    expect(result.current.exportError).toBeNull();
  });
});
