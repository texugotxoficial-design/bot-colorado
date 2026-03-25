import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Trash2, 
  Play, 
  Pause, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight, 
  Megaphone, 
  Edit3, 
  Layout, 
  Save, 
  Lock 
} from 'lucide-react';
import api from '../api/api';

interface BotStatus {
  status: string;
  qr: string | null;
  messageCount: number;
  billingRate: number;
  globalPaused: boolean;
  marketBanner?: string;
  marketBannerActive?: boolean;
  menuImage?: string;
  menuTitle: string;
  menuType?: string;
  remindersActive: boolean;
}

const Dashboard = () => {
  const [status, setStatus] = useState<BotStatus>({
    status: 'OFFLINE',
    qr: null,
    messageCount: 0,
    billingRate: 0.15,
    globalPaused: false,
    menuTitle: '',
    menuType: 'TEXT',
    remindersActive: false
  });

  const [analytics, setAnalytics] = useState<any>({ day: 0, month: 0, topOptions: [] });
  const [tempBanner, setTempBanner] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchData = async () => {
    try {
      const [resStatus, resAnalytics] = await Promise.all([
        api.get('/status'),
        api.get('/analytics/summary')
      ]);
      
      setStatus(resStatus.data);
      setAnalytics(resAnalytics.data);
      
      if (!initialized) {
        setTempBanner(resStatus.data.marketBanner || '');
        setTempTitle(resStatus.data.menuTitle || '');
        setInitialized(true);
      }
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [initialized]);

  const saveSettings = async (updates: any) => {
    setIsSaving(true);
    try {
      await api.post('/settings', { ...status, ...updates });
      fetchData();
    } catch (e) {
      alert('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetBilling = async () => {
    const secret = window.prompt('Digite a Secret de Reset:');
    if (!secret) return;
    try {
      await api.post('/reset-billing', { secret });
      fetchData();
      alert('Contador de faturamento resetado com sucesso.');
    } catch (e) {
      alert('Erro ao resetar: Secret inválida.');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-400 mt-2 font-medium">Gerenciamento em tempo real do seu WhatsApp.</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-3xl border border-slate-800">
          <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${status.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
            {status.status === 'ONLINE' ? 'SISTEMA ATIVO' : 'SISTEMA OFFLINE'}
          </div>

          <button
            onClick={() => saveSettings({ globalPaused: !status.globalPaused })}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${!status.globalPaused ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}>
            {status.globalPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            {status.globalPaused ? 'RETOMAR BOT' : 'PAUSAR BOT'}
          </button>
        </div>
      </header>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-slate-900/50 border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Mensagens Hoje</p>
            <button 
                onClick={async () => {
                    if (window.confirm('Deseja zerar TODAS as estatísticas de hoje e do mês?')) {
                        await api.post('/analytics/reset');
                        fetchData();
                    }
                }}
                className="text-slate-600 hover:text-red-400 transition-colors"
                title="Zerar Estatísticas"
            >
                <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{analytics.day}</span>
            <span className="text-emerald-400 text-xs font-bold mb-1">+{analytics.day > 0 ? 'Atividade' : 'Aguardando'}</span>
          </div>
        </div>
        <div className="premium-card p-6 bg-slate-900/50 border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Mensagens no Mês</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{analytics.month}</span>
            <span className="text-blue-400 text-xs font-bold mb-1">Acumulado</span>
          </div>
        </div>
        <div className="premium-card p-6 bg-slate-900/50 border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
             <p className="text-xs font-bold text-slate-500 uppercase mb-2">Opções mais Clicadas</p>
             <div className="space-y-3 mt-4">
                {analytics.topOptions && analytics.topOptions.length > 0 ? (
                  analytics.topOptions.map((opt: any, idx: number) => {
                    const max = analytics.topOptions[0]?._count?._all || 1;
                    const percent = (opt._count._all / max) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                          <span>{opt.optionKey === 'welcome' ? 'Início/Menu' : `Opção ${opt.optionKey}`}</span>
                          <span>{opt._count._all} cliques</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-600 italic">Nenhum dado capturado ainda...</p>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Conexão WhatsApp */}
          <div className="premium-card p-10 flex flex-col items-center justify-center min-h-[450px]">
            <h3 className="text-xl font-semibold mb-8 self-start flex items-center gap-2">
              <Activity className="text-emerald-400" /> Conexão WhatsApp
            </h3>

            {status.qr ? (
              <div className="flex flex-col items-center gap-6 animate-zoom-in text-center">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 border-4 border-emerald-500/10">
                  <img src={status.qr} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-slate-400 font-medium">Escaneie o código para conectar.</p>
              </div>
            ) : (
              <div className="text-center space-y-6">
                {status.status === 'ONLINE' ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center shadow-inner">
                      <ShieldCheck className="text-emerald-400 w-12 h-12" />
                    </div>
                    <p className="text-emerald-400 font-bold text-2xl tracking-tight">Bot Conectado!</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 italic">Estabelecendo conexão...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configurações Dinâmicas */}
          <div className="premium-card p-8 bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Megaphone className="text-emerald-400 w-4 h-4" /> Boas-vindas (Frase do Encarte)
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Banner Ativo?</span>
                        <label className="relative inline-flex items-center cursor-pointer scale-75">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={status.marketBannerActive}
                                onChange={(e) => saveSettings({ marketBannerActive: e.target.checked })} 
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempBanner}
                    onChange={(e) => setTempBanner(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-emerald-500"
                    placeholder="Ex: Ofertas do dia no Supermercado Colorado!"
                  />
                  <button onClick={() => saveSettings({ marketBanner: tempBanner })} className="bg-emerald-500 p-4 rounded-2xl text-slate-950 hover:bg-emerald-400 transition-all"><Save size={20} /></button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Edit3 className="text-emerald-400 w-4 h-4" /> Título Superior (Negrito)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-emerald-500"
                    placeholder="Ex: 🔥 OFERTAS IMBATÍVEIS 🔥"
                  />
                  <button onClick={() => saveSettings({ menuTitle: tempTitle })} className="bg-emerald-500 p-4 rounded-2xl text-slate-950 hover:bg-emerald-400 transition-all"><Save size={20} /></button>
                </div>
              </div>
            </div>

            {/* FOTO DO ENCARTE */}
            <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="text-purple-400 w-4 h-4" /> Foto Principal do Menu (Encarte)
                    </h3>
                    {status.menuImage && (
                        <button 
                            onClick={async () => {
                                if (window.confirm('Deseja remover a foto do encarte?')) {
                                    await api.delete('/settings/menu-image');
                                    fetchData();
                                }
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-all"
                        >
                            <Trash2 size={16} /> REMOVER FOTO
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {status.menuImage ? (
                        <div className="relative group">
                            <img 
                                src={`${api.defaults.baseURL?.replace('/api', '')}/${status.menuImage}`} 
                                alt="Banner Atual" 
                                className="w-full md:w-48 h-48 object-cover rounded-3xl border-2 border-slate-800 group-hover:border-purple-500/50 transition-all"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-3xl">
                                <p className="text-[10px] font-bold text-white uppercase text-center px-4">Foto Ativa no WhatsApp</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full md:w-48 h-48 bg-slate-950 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 gap-2">
                            <Megaphone size={30} className="opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Sem foto no menu</span>
                        </div>
                    )}

                    <div className="flex-1 space-y-4 w-full">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Esta foto será enviada automaticamente para o cliente assim que ele abrir o menu principal. Recomendamos fotos de encartes, promoções do dia ou o logo do mercado.
                        </p>
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                id="banner-upload"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    setIsSaving(true);
                                    try {
                                        await api.post('/settings/menu-image', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        fetchData();
                                    } catch (e) {
                                        alert('Erro ao subir imagem');
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                            />
                            <label 
                                htmlFor="banner-upload"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-xs cursor-pointer transition-all active:scale-95"
                            >
                                <Megaphone size={16} /> {status.menuImage ? 'ALTERAR FOTO DO ENCARTE' : 'ADICIONAR FOTO DO ENCARTE'}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector de Estilo de Menu */}
            <div className="mt-10 pt-10 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layout className="text-blue-400 w-4 h-4" /> Estilo do Menu no WhatsApp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => saveSettings({ menuType: 'TEXT' })}
                  className={`p-6 rounded-3xl border transition-all text-left group ${status.menuType === 'TEXT' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg uppercase tracking-tighter">Estilo Clássico</span>
                    {status.menuType === 'TEXT' && <ShieldCheck size={20} />}
                  </div>
                  <p className="text-xs opacity-60">Menu em texto com lista numerada (1, 2, 3...). Maior compatibilidade.</p>
                </button>

                <button 
                  onClick={() => saveSettings({ menuType: 'INTERACTIVE' })}
                  className={`p-6 rounded-3xl border transition-all text-left group ${status.menuType === 'INTERACTIVE' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg uppercase tracking-tighter">Menu Clicável</span>
                    {status.menuType === 'INTERACTIVE' && <ShieldCheck size={20} />}
                  </div>
                  <p className="text-xs opacity-60">Botão único que abre uma lista de opções para o cliente tocar.</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stats Card */}
          <div className="premium-card p-8 text-center bg-indigo-600 shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <MessageSquare size={100} />
            </div>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-[0.2em] mb-2">Mensagens Processadas</p>
            <h2 className="text-6xl font-black text-white">{status.messageCount}</h2>
            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="text-left">
                <p className="text-indigo-200 text-[10px] font-bold uppercase">Faturamento Estimado</p>
                <p className="text-white font-black text-xl">R$ {(status.messageCount * status.billingRate).toFixed(2).replace('.', ',')}</p>
              </div>
              <button 
                onClick={handleResetBilling}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all text-white border border-white/20"
                title="Resetar Contador"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="premium-card p-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600" /> Segurança
            </h3>
            <p className="text-slate-500 text-sm">Proteção ativa contra acessos não autorizados.</p>
            <button 
              onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/login'; }}
              className="w-full bg-slate-950 text-red-400 border border-red-500/20 p-4 rounded-2xl font-bold text-sm hover:bg-red-500/5 transition-all"
            >
              Sair do Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
