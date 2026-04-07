/**
 * AdminView Component
 * Dashboard administrativo para gerenciar códigos e estatísticas
 * Orquestra subcomponentes: AdminControls, AdminSettings, AdminStats, AdminCodesList
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '@/hooks/useAdmin';
import { usePolling } from '@/hooks/usePolling';
import { AdminService } from '@/services/api/admin';
import { apiClient } from '@/services/api/client';
import { API_DEFAULTS } from '@/constants/api';
import { ImportStatusResponse, AdminSubViewType } from '@/types/api';
import {
  Loader2,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  History,
  Ticket,
  Upload,
  ExternalLink,
  ChevronRight,
  CircleAlert,
  Mail,
} from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';

// Converte string do banco (YYYY-MM-DD HH:mm:ss ou YYYY-MM-DD) para YYYY-MM-DD (valor do date input)
function toDateValue(s: string | undefined): string {
  if (!s || !s.trim()) return '';
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return '';
}

// used_at vem em UTC do backend; parse como UTC e formata em Brasília
function formatUsedAtBrasilia(usedAt: string | null | undefined): string {
  if (!usedAt || !usedAt.trim()) return '-';
  const t = usedAt.trim();
  const asUtc = /Z$|[+-]\d{2}:?\d{2}$/.test(t) ? t : t.replace(' ', 'T') + 'Z';
  return new Date(asUtc).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function ResgatesRealizadosCard({
  usedPhase1,
  usedPhase2,
}: {
  usedPhase1: number;
  usedPhase2: number;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 shrink-0">
        <CheckCircle2 size={24} aria-hidden />
      </div>
      <p className="text-slate-500 text-sm font-medium">Resgates realizados</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-slate-50 border border-slate-100/80 px-3 py-3 flex flex-col items-center text-center min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Fase 1
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
            {(usedPhase1 ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100/80 px-3 py-3 flex flex-col items-center text-center min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80 mb-1">
            Fase 2
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
            {(usedPhase2 ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

interface AdminViewProps {
  onBack: () => void;
}

export function AdminView({ onBack }: AdminViewProps) {
  const admin = useAdmin();
  const [adminSubView, setAdminSubView] = useState<AdminSubViewType>('stats');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const start = toDateValue(admin.settings?.start_date);
    const end = toDateValue(admin.settings?.end_date);
    setLocalStartDate(start);
    setLocalEndDate(end);
  }, [admin.settings?.start_date, admin.settings?.end_date]);

  const savedStart = toDateValue(admin.settings?.start_date);
  const savedEnd = toDateValue(admin.settings?.end_date);
  const datesDirty = localStartDate !== savedStart || localEndDate !== savedEnd;

  // Polling para status de importação
  const { data: importStatus, startPolling, stopPolling } = usePolling<ImportStatusResponse>(
    async () => {
      if (!admin.importProgress?.jobId) throw new Error('No job ID');
      const adminService = new AdminService(apiClient);
      return adminService.getImportStatus(admin.importProgress.jobId);
    },
    (data) => {
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        setTimeout(() => {
          if (adminSubView === 'stats') admin.fetchStats();
          if (adminSubView === 'email_redemptions') {
            admin.fetchStats();
            admin.fetchEmailRedemptions();
          }
          if (adminSubView === 'codes') admin.fetchCodes();
        }, 1000);
      }
    }
  );

  useEffect(() => {
    if (adminSubView === 'stats') {
      admin.fetchStats();
    } else if (adminSubView === 'email_redemptions') {
      admin.fetchStats();
      admin.fetchEmailRedemptions();
    } else {
      admin.fetchCodes();
    }
  }, [adminSubView]);

  // Handle CSV upload
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        await admin.uploadCsv(text);
        startPolling();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    admin.setCodesPage(1);
    await admin.fetchCodes();
  };

  const handleEmailRedemptionsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    admin.setEmailRedemptionsPage(1);
    await admin.fetchEmailRedemptions();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Acompanhamento em tempo real dos resgates.</p>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            <button
              type="button"
              onClick={() => setAdminSubView('stats' as AdminSubViewType)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminSubView === 'stats'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              Fase 1
            </button>
            <button
              type="button"
              onClick={() => setAdminSubView('email_redemptions' as AdminSubViewType)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminSubView === 'email_redemptions'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              Fase 2
            </button>
            <button
              type="button"
              onClick={() => setAdminSubView('codes' as AdminSubViewType)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminSubView === 'codes'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              Lista de Códigos
            </button>
          </div>

          {/* CSV Upload & Model Download */}
          <div className="flex flex-col gap-3">
            {/* <div className="flex gap-2">
              <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                <Upload size={16} />
                <span>Importar CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                  disabled={admin.importLoading}
                />
              </label>
              <a
                href="data:text/csv;charset=utf-8,codigo,link"
                download="modelo_codes.csv"
                className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                Modelo CSV
              </a>
            </div> */}

            {/* Import Progress */}
            {importStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">
                    {importStatus.status === 'processing'
                      ? 'Importando...'
                      : importStatus.status === 'completed'
                        ? 'Concluído!'
                        : 'Erro'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {importStatus.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                  <motion.div
                    className={`h-2.5 rounded-full ${importStatus.status === 'completed'
                      ? 'bg-green-500'
                      : importStatus.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-orange-500'
                      }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${importStatus.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  {importStatus.status === 'processing'
                    ? `Processando... ${importStatus.processedLines} de ${importStatus.totalLines} linhas`
                    : importStatus.status === 'completed'
                      ? `Importação concluída! ${importStatus.successfulLines} códigos importados.${importStatus.failedLines > 0 ? ` ${importStatus.failedLines} falharam.` : ''
                      }`
                      : `Erro: ${importStatus.errorMessage || 'Desconhecido'}`}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta: datas alteradas (não salvas) */}
      {datesDirty && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800"
        >
          <CircleAlert className="shrink-0 text-amber-600" size={20} />
          <p className="text-sm font-medium">
            As datas foram alteradas. Clique em <strong>Salvar Datas</strong> para aplicar.
          </p>
        </motion.div>
      )}

      {/* Alerta: sucesso ao salvar */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800"
        >
          <CheckCircle2 className="shrink-0 text-green-600" size={20} />
          <p className="text-sm font-medium">Datas salvas com sucesso.</p>
        </motion.div>
      )}

      {/* Settings Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <DatePicker
          id="admin-start-date"
          value={localStartDate}
          onChange={setLocalStartDate}
          placeholder="Selecione a data"
          label="Início do Resgate"
          aria-label="Início do Resgate"
        />
        <DatePicker
          id="admin-end-date"
          value={localEndDate}
          onChange={setLocalEndDate}
          placeholder="Selecione a data"
          label="Fim do Resgate"
          aria-label="Fim do Resgate"
        />
        <button
          onClick={async () => {
            setSaveSuccess(false);
            await admin.updateSettings({
              ...admin.settings!,
              start_date: localStartDate ? `${localStartDate} 00:00:00` : '',
              end_date: localEndDate ? `${localEndDate} 00:00:00` : '',
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
          }}
          disabled={!datesDirty}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Salvar Datas
        </button>
      </div>

      {/* Content based on subview */}
      {adminSubView === 'stats' ? (
        <>
          {admin.statsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Carregando estatísticas...</p>
            </div>
          ) : admin.stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <BarChart3 size={24} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Total de Códigos</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {admin.stats.total.toLocaleString()}
                  </p>
                </div>
                <ResgatesRealizadosCard
                  usedPhase1={admin.stats.used_phase1}
                  usedPhase2={admin.stats.used_phase2}
                />
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                    <RefreshCw size={24} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Disponíveis</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {admin.stats.available.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Recent Redeems */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <History className="text-orange-600" size={20} />
                    Resgates - Fase 1
                  </h3>
                </div>
                <div className="space-y-4">
                  {admin.stats.recent.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                          <Ticket className="text-orange-600" size={18} />
                        </div>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-slate-900">{r.code}</p>
                          <p className="text-xs text-slate-400 font-mono break-all">{r.ip_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 md:shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {formatUsedAtBrasilia(r.used_at)}
                        </p>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  ))}
                  {admin.stats.recent.length === 0 && (
                    <p className="text-center text-slate-400 py-8 italic">
                      Nenhum resgate realizado ainda.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-600 font-medium mb-2">
                {admin.statsError || 'Não foi possível carregar as estatísticas.'}
              </p>
              <p className="text-slate-400 text-sm mb-4">Verifique se o servidor está em execução e tente novamente.</p>
              <button
                type="button"
                onClick={() => admin.fetchStats()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            </div>
          )}
        </>
      ) : adminSubView === 'email_redemptions' ? (
        <>
          {admin.statsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Carregando estatísticas...</p>
            </div>
          ) : admin.stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <BarChart3 size={24} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Total de Códigos</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {admin.stats.total.toLocaleString()}
                  </p>
                </div>
                <ResgatesRealizadosCard
                  usedPhase1={admin.stats.used_phase1}
                  usedPhase2={admin.stats.used_phase2}
                />
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                    <RefreshCw size={24} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Disponíveis</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {admin.stats.available.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Mail className="text-orange-600" size={20} />
                    Resgates - Fase 2
                  </h3>
                  <form onSubmit={handleEmailRedemptionsSearch} className="flex w-full md:w-auto gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Buscar por e-mail ou código do prêmio..."
                      value={admin.emailRedemptionsSearch}
                      onChange={(e) => admin.setEmailRedemptionsSearch(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-72"
                    />
                    <button
                      type="submit"
                      className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shrink-0"
                    >
                      Buscar
                    </button>
                  </form>
                </div>

                {admin.emailRedemptionsError && (
                  <p className="text-sm text-red-600 font-medium mb-4">{admin.emailRedemptionsError}</p>
                )}

                <div className="relative space-y-4">
                  {admin.emailRedemptionsLoading && !admin.emailRedemptionsList && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-3" />
                      <p className="text-slate-500 text-sm font-medium">Carregando resgates...</p>
                    </div>
                  )}
                  {admin.emailRedemptionsLoading && admin.emailRedemptionsList && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl min-h-[120px]">
                      <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                    </div>
                  )}
                  {admin.emailRedemptionsList?.items.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                          <Mail className="text-orange-600" size={18} />
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
                          <p className="text-sm font-bold text-slate-900 break-all">{row.email}</p>
                          <p className="text-xs font-mono text-slate-700">{row.prize_code}</p>
                          <div className="flex items-center gap-2 max-w-full">
                            <p className="text-xs text-slate-500 truncate">{row.prize_link}</p>
                            <a
                              href={row.prize_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700 shrink-0"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 md:shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {formatUsedAtBrasilia(row.redeemed_at)}
                        </p>
                        <ChevronRight size={16} className="text-slate-300 hidden md:block" />
                      </div>
                    </div>
                  ))}
                  {admin.emailRedemptionsList &&
                    admin.emailRedemptionsList.items.length === 0 &&
                    !admin.emailRedemptionsLoading && (
                      <p className="text-center text-slate-400 py-8 italic">
                        Nenhum resgate por e-mail registrado.
                      </p>
                    )}
                </div>

                {admin.emailRedemptionsList && admin.emailRedemptionsList.total > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-xs text-slate-400 font-medium">
                      Página {admin.emailRedemptionsPage} de {admin.emailRedemptionsList.totalPages || 1}
                      <span className="text-slate-300 ml-1">
                        · {API_DEFAULTS.CODES_PAGE_SIZE} itens por página
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={admin.emailRedemptionsPage === 1 || admin.emailRedemptionsLoading}
                        onClick={() => admin.setEmailRedemptionsPage(admin.emailRedemptionsPage - 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={
                          admin.emailRedemptionsPage === admin.emailRedemptionsList.totalPages ||
                          admin.emailRedemptionsLoading
                        }
                        onClick={() => admin.setEmailRedemptionsPage(admin.emailRedemptionsPage + 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-600 font-medium mb-2">
                {admin.statsError || 'Não foi possível carregar as estatísticas.'}
              </p>
              <p className="text-slate-400 text-sm mb-4">Verifique se o servidor está em execução e tente novamente.</p>
              <button
                type="button"
                onClick={() => admin.fetchStats()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            </div>
          )}
        </>
      ) : admin.codesLoading && !admin.codesList ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Carregando códigos...</p>
        </div>
      ) : admin.statsError && !admin.stats ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-600 font-medium mb-2">
            {admin.statsError || 'Não foi possível carregar as estatísticas.'}
          </p>
          <p className="text-slate-400 text-sm mb-4">Verifique se o servidor está em execução e tente novamente.</p>
          <button
            type="button"
            onClick={() => admin.fetchCodes()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      ) : (
        /* Codes List Table */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="text-orange-600" size={20} />
                Lista de Códigos
              </h3>
              <button
                type="button"
                onClick={() => admin.exportRedeemed()}
                disabled={admin.exportLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={admin.exportError ?? undefined}
              >
                {admin.exportLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Upload size={14} className="rotate-180" />
                }
                {admin.exportLoading ? 'Exportando...' : 'Exportar Resgatados'}
              </button>
              {admin.exportError && (
                <span className="text-xs text-red-600 font-medium">{admin.exportError}</span>
              )}
            </div>
            <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2 items-center">
              <input
                type="text"
                placeholder="Buscar por código, IP ou e-mail..."
                value={admin.codesSearch}
                onChange={(e) => admin.setCodesSearch(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-64"
              />
              <select
                value={admin.codesStatus}
                onChange={(e) => {
                  admin.setCodesPage(1);
                  admin.setCodesStatus(e.target.value as 'all' | 'used' | 'available');
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                <option value="all">Todos</option>
                <option value="used">Resgatados</option>
                <option value="available">Disponíveis</option>
              </select>
              <button
                type="submit"
                className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
              >
                Buscar
              </button>
            </form>
          </div>

          <div className="relative overflow-x-auto">
            {admin.codesLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-b-3xl">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              </div>
            )}
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">Código Promocional</th>
                  <th className="px-6 py-4">Link Promo</th>
                  <th className="px-6 py-4">Data de Resgate</th>
                  <th className="px-6 py-4">IP do Resgate</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admin.codesList?.codes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                      {c.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <p className="text-xs text-slate-500 truncate">{c.link}</p>
                        <a
                          href={c.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatUsedAtBrasilia(c.redeemed_at ?? c.used_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 break-all max-w-[180px]">
                      {c.ip_address || c.redeemed_email || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {(c.is_used || c.redeemed_by_email) ? (
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-[10px] font-bold">
                          Resgatado
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-[10px] font-bold">
                          Disponível
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {admin.codesList && admin.codesList.codes.length === 0 && !admin.codesLoading && (
            <div className="py-20 text-center">
              <p className="text-slate-400 italic">Nenhum código encontrado.</p>
            </div>
          )}

          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50">
            <p className="text-xs text-slate-400 font-medium">
              Página {admin.codesPage} de {admin.codesList?.totalPages || 1}
              <span className="text-slate-300 ml-1">· {API_DEFAULTS.CODES_PAGE_SIZE} itens por página</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={admin.codesPage === 1 || admin.codesLoading}
                onClick={() => admin.setCodesPage(admin.codesPage - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={
                  admin.codesPage === admin.codesList?.totalPages || admin.codesLoading
                }
                onClick={() => admin.setCodesPage(admin.codesPage + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
