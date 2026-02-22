/**
 * useAdmin - Custom hook para lógica administrativa
 */

import { useState, useCallback } from 'react';
import { AdminService } from '../services/api/admin';
import { apiClient } from '../services/api/client';
import { Settings, PaginatedCodes, ImportStatusResponse } from '../types/api';
import { useFetch } from './useFetch';

const adminService = new AdminService(apiClient);

export interface UseAdminState {
  // Configurações
  settings: Settings | null;
  settingsLoading: boolean;
  updateSettings: (newSettings: Settings) => Promise<void>;

  // Códigos
  codesPage: number;
  setCodesPage: (page: number) => void;
  codesSearch: string;
  setCodesSearch: (search: string) => void;
  codesList: PaginatedCodes | null;
  codesLoading: boolean;
  fetchCodes: () => Promise<void>;

  // Stats
  stats: any;
  statsLoading: boolean;
  fetchStats: () => Promise<void>;

  // CSV Upload
  uploadCsv: (csvData: string) => Promise<{ jobId: string }>;
  importProgress: ImportStatusResponse | null;
  importLoading: boolean;

  // Export
  exportRedeemed: () => void;
}

export function useAdmin(): UseAdminState {
  const [codesPage, setCodesPage] = useState(1);
  const [codesSearch, setCodesSearch] = useState('');
  const [importProgress, setImportProgress] = useState<ImportStatusResponse | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Fetch settings
  const {
    data: settings,
    loading: settingsLoading,
    refetch: refetchSettings,
  } = useFetch(() => adminService.getSettings(), [], false);

  // Fetch codes
  const {
    data: codesList,
    loading: codesLoading,
    refetch: refetchCodes,
  } = useFetch(
    () => adminService.getCodes(codesPage, codesSearch),
    [codesPage, codesSearch],
    codesPage > 0
  );

  // Fetch stats
  const {
    data: stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useFetch(() => adminService.getStats(), [], false);

  const updateSettings = useCallback(
    async (newSettings: Settings) => {
      try {
        await adminService.updateSettings(newSettings);
        await refetchSettings();
      } catch (error) {
        throw error;
      }
    },
    [refetchSettings]
  );

  const fetchCodes = useCallback(async () => {
    await refetchCodes();
  }, [refetchCodes]);

  const fetchStats = useCallback(async () => {
    await refetchStats();
  }, [refetchStats]);

  const uploadCsv = useCallback(async (csvData: string) => {
    setImportLoading(true);
    try {
      const response = await adminService.uploadCsv(csvData);
      setImportProgress({
        jobId: response.jobId,
        status: 'processing',
        progress: 0,
        totalLines: response.totalLines,
        processedLines: 0,
        successfulLines: 0,
        failedLines: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
        errorMessage: null,
      });
      return response;
    } finally {
      setImportLoading(false);
    }
  }, []);

  return {
    settings,
    settingsLoading,
    updateSettings,
    codesPage,
    setCodesPage,
    codesSearch,
    setCodesSearch,
    codesList,
    codesLoading,
    fetchCodes,
    stats,
    statsLoading,
    fetchStats,
    uploadCsv,
    importProgress,
    importLoading,
    exportRedeemed: () => adminService.exportRedeemed(),
  };
}
