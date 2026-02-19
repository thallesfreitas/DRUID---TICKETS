import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  Loader2, 
  LayoutDashboard, 
  History, 
  BarChart3,
  Mail,
  RefreshCw,
  ChevronRight,
  Upload
} from 'lucide-react';

// --- Types ---

interface Stats {
  total: number;
  used: number;
  available: number;
  recent: Array<{ code: string; ip_address: string; used_at: string }>;
}

interface CodeItem {
  id: number;
  code: string;
  link: string;
  is_used: number;
  used_at: string | null;
  ip_address: string | null;
}

interface Settings {
  start_date: string;
  end_date: string;
}

// --- Components ---

const Header = ({ onAdminClick, onLogoClick }: { onAdminClick: () => void, onLogoClick: () => void }) => (
  <header className="w-full py-6 px-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
    <button onClick={onLogoClick} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
        <Ticket className="text-white w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">PromoCode</h1>
    </button>
    <button 
      onClick={onAdminClick}
      className="p-2 text-slate-400 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50"
    >
      <LayoutDashboard size={20} />
    </button>
  </header>
);

const Footer = ({ setView }: { setView: (v: any) => void }) => (
  <footer className="py-8 text-center text-slate-400 text-xs mt-auto">
    <div className="flex justify-center space-x-6 mb-4">
      <button onClick={() => setView('help')} className="hover:text-slate-600">Ajuda</button>
      <button onClick={() => setView('privacy')} className="hover:text-slate-600">Privacidade</button>
      <button onClick={() => setView('terms')} className="hover:text-slate-600">Termos</button>
    </div>
    <p>© 2024 PromoCode Inc. Todos os direitos reservados.</p>
  </footer>
);

const FloatingSupport = () => (
  <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
    <a 
      href="https://wa.me/5500000000000" 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
      title="Suporte via WhatsApp"
    >
      <Mail size={24} />
    </a>
    <a 
      href="mailto:suporte@promocode.com" 
      className="w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
      title="Suporte via E-mail"
    >
      <Mail size={24} />
    </a>
  </div>
);

export default function App() {
  const [view, setView] = useState<'redeem' | 'admin' | 'help' | 'privacy' | 'terms'>('redeem');
  const [adminSubView, setAdminSubView] = useState<'stats' | 'codes'>('stats');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ link: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings>({ start_date: '', end_date: '' });
  const [codesList, setCodesList] = useState<CodeItem[]>([]);
  const [codesPage, setCodesPage] = useState(1);
  const [codesTotalPages, setCodesTotalPages] = useState(1);
  const [codesSearch, setCodesSearch] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch settings
  const fetchSettings = async (retries = 3) => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      if (retries > 0) {
        console.log(`Retrying fetchSettings... (${retries} left)`);
        setTimeout(() => fetchSettings(retries - 1), 2000);
      }
    }
  };

  // Fetch stats for admin
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) {
        const text = await res.text();
        console.error("Stats fetch failed:", text);
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  // Fetch codes for admin
  const fetchCodes = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/codes?page=${page}&search=${search}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Codes fetch failed:", text);
        return;
      }
      const data = await res.json();
      setCodesList(data.codes);
      setCodesTotalPages(data.totalPages);
      setCodesPage(data.page);
    } catch (err) {
      console.error("Failed to fetch codes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (view === 'admin') {
      if (adminSubView === 'stats') fetchStats();
      if (adminSubView === 'codes') fetchCodes(codesPage, codesSearch);
    }
  }, [view, adminSubView, codesPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCodesPage(1);
    fetchCodes(1, codesSearch);
  };

  const updateSettings = async (newSettings: Settings) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(newSettings);
        alert("Configurações salvas com sucesso!");
      }
    } catch (err) {
      alert("Erro ao salvar configurações.");
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setLoading(true);
      try {
        const res = await fetch('/api/admin/upload-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvData: text })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          if (adminSubView === 'stats') fetchStats();
          if (adminSubView === 'codes') fetchCodes(codesPage, codesSearch);
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert("Erro ao enviar arquivo.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.toUpperCase(),
          captchaToken: captchaVerified ? "mock-token" : null 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Ocorreu um erro inesperado.");
        setCaptchaVerified(false);
      } else {
        setSuccessData(data);
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (successData?.link) {
      navigator.clipboard.writeText(successData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isStarted = !settings.start_date || new Date(settings.start_date) <= new Date();
  const isEnded = settings.end_date && new Date(settings.end_date) < new Date();

  const getButtonText = () => {
    if (isEnded) return "RESGATES ENCERRADOS";
    if (!isStarted) {
      const date = new Date(settings.start_date).toLocaleString();
      return `INÍCIO EM ${date}`;
    }
    return loading ? "Processando..." : "Validar Código";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header 
        onAdminClick={() => setView(view === 'admin' ? 'redeem' : 'admin')} 
        onLogoClick={() => setView('redeem')}
      />

      <main className="flex-grow flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'redeem' ? (
            <motion.div 
              key="redeem"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              {!successData ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Resgatar Código</h2>
                    <p className="text-slate-500 mt-2">Insira seu código único para acessar seu benefício exclusivo.</p>
                  </div>

                  <form onSubmit={handleRedeem} className="space-y-5">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-700 text-sm"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="font-medium leading-tight">{error}</p>
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Código Promocional</label>
                      <input 
                        type="text"
                        required
                        disabled={!isStarted || isEnded}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="EX: PROMO2024"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all outline-none font-mono tracking-widest text-lg uppercase disabled:opacity-50"
                      />
                    </div>

                    {/* Mock reCAPTCHA */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          disabled={!isStarted || isEnded}
                          onClick={() => setCaptchaVerified(!captchaVerified)}
                          className={`w-6 h-6 rounded border-2 transition-all flex items-center justify-center ${captchaVerified ? 'bg-orange-600 border-orange-600' : 'bg-white border-slate-300'} disabled:opacity-50`}
                        >
                          {captchaVerified && <CheckCircle2 className="text-white w-4 h-4" />}
                        </button>
                        <span className="text-sm font-medium text-slate-600">Não sou um robô</span>
                      </div>
                      <img 
                        src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
                        alt="reCAPTCHA" 
                        className="w-6 h-6 opacity-50"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || !captchaVerified || !isStarted || isEnded}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center space-x-2 active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <span>{getButtonText()}</span>
                          {isStarted && !isEnded && <ArrowRight className="w-5 h-5" />}
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-[11px] text-center text-slate-400 mt-6 px-4 leading-relaxed">
                    Os códigos são de uso único e sensíveis a maiúsculas. Em caso de dúvidas, entre em contato com o suporte.
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-8 rounded-3xl shadow-xl shadow-green-100/50 border border-green-100 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  
                  <h2 className="text-2xl font-extrabold text-slate-900">Resgate Concluído!</h2>
                  <p className="text-slate-500 mt-2 mb-6">
                    Seu benefício exclusivo foi liberado com sucesso.
                  </p>

                  <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <img 
                      src="https://picsum.photos/seed/reward/600/300" 
                      alt="Prêmio" 
                      className="w-full h-40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seu Link de Prêmio</p>
                    <p className="text-orange-600 font-bold break-all mb-4">{successData.link}</p>
                    
                    <div className="flex flex-col gap-3">
                      <a 
                        href={successData.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-100"
                      >
                        <ExternalLink size={18} />
                        <span>Acessar Prêmio</span>
                      </a>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={handleCopy}
                          className="flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold transition-all shadow-sm"
                        >
                          <Copy size={18} />
                          <span>{copied ? "Copiado!" : "Copiar"}</span>
                        </button>
                        <a 
                          href={`https://wa.me/?text=${encodeURIComponent(`Olha só o prêmio que eu ganhei: ${successData.link}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold transition-all shadow-sm"
                        >
                          <Mail size={18} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setSuccessData(null); setCode(''); }}
                    className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center justify-center mx-auto transition-colors"
                  >
                    Resgatar outro código
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : view === 'help' ? (
            <motion.div 
              key="help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6">Ajuda & FAQ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Como resgato meu código?</h3>
                  <p className="text-slate-600 text-sm">Basta inserir o código recebido no campo da página inicial e clicar em validar.</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Meu código não funciona, o que fazer?</h3>
                  <p className="text-slate-600 text-sm">Verifique se digitou corretamente, respeitando maiúsculas e minúsculas. Se o problema persistir, entre em contato com o suporte.</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Quantas vezes posso usar o mesmo código?</h3>
                  <p className="text-slate-600 text-sm">Cada código é único e pode ser utilizado apenas uma única vez.</p>
                </div>
              </div>
              <button 
                onClick={() => setView('redeem')}
                className="mt-8 text-orange-600 font-bold flex items-center gap-2"
              >
                <ArrowRight size={18} className="rotate-180" />
                Voltar ao início
              </button>
            </motion.div>
          ) : view === 'privacy' ? (
            <motion.div 
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6">Política de Privacidade</h2>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm space-y-4">
                <p>Nós valorizamos a sua privacidade. Esta política descreve como coletamos e usamos seus dados.</p>
                <p>Coletamos apenas as informações necessárias para validar seu código e garantir a segurança da promoção, como seu endereço IP e data de acesso.</p>
                <p>Seus dados não são compartilhados com terceiros para fins de marketing.</p>
              </div>
              <button 
                onClick={() => setView('redeem')}
                className="mt-8 text-orange-600 font-bold flex items-center gap-2"
              >
                <ArrowRight size={18} className="rotate-180" />
                Voltar ao início
              </button>
            </motion.div>
          ) : view === 'terms' ? (
            <motion.div 
              key="terms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
            >
              <h2 className="text-3xl font-black text-slate-900 mb-6">Termos de Uso</h2>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm space-y-4">
                <p>Ao utilizar este site, você concorda com os seguintes termos:</p>
                <p>1. A promoção é válida apenas para códigos autênticos distribuídos pelos canais oficiais.</p>
                <p>2. Tentativas de fraude ou uso indevido do sistema resultarão em bloqueio imediato.</p>
                <p>3. Os prêmios estão sujeitos à disponibilidade e prazos estabelecidos na administração.</p>
              </div>
              <button 
                onClick={() => setView('redeem')}
                className="mt-8 text-orange-600 font-bold flex items-center gap-2"
              >
                <ArrowRight size={18} className="rotate-180" />
                Voltar ao início
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">Dashboard</h2>
                  <p className="text-slate-500">Acompanhamento em tempo real dos resgates.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                    <button 
                      onClick={() => setAdminSubView('stats')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminSubView === 'stats' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => setAdminSubView('codes')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminSubView === 'codes' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      Lista de Códigos
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                      <Upload size={16} />
                      <span>Lote 1</span>
                      <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                    </label>
                    <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                      <Upload size={16} />
                      <span>Lote 2</span>
                      <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                    </label>
                    <a 
                      href="data:text/csv;charset=utf-8,codigo,link" 
                      download="modelo_codes.csv"
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      Modelo CSV
                    </a>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Início do Resgate</label>
                  <input 
                    type="datetime-local"
                    value={settings.start_date}
                    onChange={(e) => setSettings({ ...settings, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fim do Resgate</label>
                  <input 
                    type="datetime-local"
                    value={settings.end_date}
                    onChange={(e) => setSettings({ ...settings, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <button 
                  onClick={() => updateSettings(settings)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  Salvar Datas
                </button>
              </div>

              {adminSubView === 'stats' ? (
                <>
                  {stats ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <BarChart3 size={24} />
                          </div>
                          <p className="text-slate-500 text-sm font-medium">Total de Códigos</p>
                          <p className="text-3xl font-black text-slate-900 mt-1">{stats.total.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                            <CheckCircle2 size={24} />
                          </div>
                          <p className="text-slate-500 text-sm font-medium">Resgates Realizados</p>
                          <p className="text-3xl font-black text-slate-900 mt-1">{stats.used.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                            <RefreshCw size={24} />
                          </div>
                          <p className="text-slate-500 text-sm font-medium">Disponíveis</p>
                          <p className="text-3xl font-black text-slate-900 mt-1">{stats.available.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <History className="text-orange-600" size={20} />
                              Resgates Recentes
                            </h3>
                          </div>
                          <div className="space-y-4">
                            {stats.recent.map((r, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                    <Ticket className="text-orange-600" size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{r.code}</p>
                                    <p className="text-xs text-slate-400 font-mono">{r.ip_address}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {new Date(r.used_at).toLocaleString()}
                                  </p>
                                  <ChevronRight size={16} className="text-slate-300 ml-auto" />
                                </div>
                              </div>
                            ))}
                            {stats.recent.length === 0 && (
                              <p className="text-center text-slate-400 py-8 italic">Nenhum resgate realizado ainda.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                      <p className="text-slate-500 font-medium">Carregando estatísticas...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Ticket className="text-orange-600" size={20} />
                        Lista de Códigos
                      </h3>
                      <a 
                        href="/api/admin/export-redeemed" 
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                      >
                        <Upload size={14} className="rotate-180" />
                        Exportar Resgatados
                      </a>
                    </div>
                    <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
                      <input 
                        type="text"
                        placeholder="Buscar por código ou IP..."
                        value={codesSearch}
                        onChange={(e) => setCodesSearch(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-64"
                      />
                      <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
                        Buscar
                      </button>
                    </form>
                  </div>
                  
                  <div className="overflow-x-auto">
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
                        {codesList.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">{c.code}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 max-w-[200px]">
                                <p className="text-xs text-slate-500 truncate">{c.link}</p>
                                <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">
                              {c.used_at ? new Date(c.used_at).toLocaleString() : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{c.ip_address || "-"}</td>
                            <td className="px-6 py-4">
                              {c.is_used ? (
                                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-[10px] font-bold">Resgatado</span>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-[10px] font-bold">Disponível</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {codesList.length === 0 && !loading && (
                    <div className="py-20 text-center">
                      <p className="text-slate-400 italic">Nenhum código encontrado.</p>
                    </div>
                  )}

                  <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                    <p className="text-xs text-slate-400 font-medium">
                      Página {codesPage} de {codesTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        disabled={codesPage === 1 || loading}
                        onClick={() => setCodesPage(p => p - 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button 
                        disabled={codesPage === codesTotalPages || loading}
                        onClick={() => setCodesPage(p => p + 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer setView={setView} />
      <FloatingSupport />
    </div>
  );
}
