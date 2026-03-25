import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Megaphone, Calendar, Save, CheckCircle2, AlertCircle, XCircle, Trash2, FileUp, Image as ImageIcon } from 'lucide-react';

const Management = () => {
  const [settings, setSettings] = useState<any>({
    marketBanner: '',
    marketBannerActive: false,
    menuImage: null,
  });
  
  const [reminders, setReminders] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const s = await api.get('/status');
      setSettings({
        marketBanner: s.data.marketBanner || '',
        marketBannerActive: s.data.marketBannerActive,
        menuImage: s.data.menuImage,
      });
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    await api.post('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUploadMenuImage = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await api.post('/settings/menu-image', fd);
    setSettings({ ...settings, menuImage: res.data.menuImage });
  };

  const handleRemoveMenuImage = async () => {
    if (!window.confirm('Remover imagem do menu?')) return;
    await api.delete('/settings/menu-image');
    setSettings({ ...settings, menuImage: null });
  };


  return (
    <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
      <header className="flex justify-between items-center bg-slate-900/30 p-12 rounded-[4rem] border border-slate-800/20">
         <div className="flex items-center gap-8">
            <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/10 shadow-lg">
               <Megaphone size={48} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div>
               <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">GESTÃO DE ALERTAS</h1>
               <p className="text-slate-500 font-bold uppercase tracking-[.3em] text-xs">Propaganda e Eventos Especiais</p>
            </div>
         </div>
      </header>

      <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
        {/* Market Event Banner */}
        <section className="bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 p-12 rounded-[3.5rem] shadow-2xl relative group overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform">
             <AlertCircle size={200} />
          </div>
          <h2 className="text-3xl font-bold mb-10 text-white flex items-center gap-4">
             <div className="bg-amber-500/20 p-2.5 rounded-xl"><AlertCircle className="text-amber-400" /></div>
             Alerta Global (Topo do Menu)
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-3xl border border-slate-800/60">
               <div>
                  <p className="font-bold text-white mb-1">Status do Alerta</p>
                  <p className="text-xs text-slate-500 uppercase font-black">Visibilidade no WhatsApp</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.marketBannerActive} onChange={(e) => setSettings({...settings, marketBannerActive: e.target.checked})} />
                  <div className="w-16 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-7 after:transition-all peer-checked:bg-emerald-500"></div>
               </label>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 tracking-[.25em] mb-4 uppercase">Conteúdo do Banner (Texto Curto)</label>
              <input 
                type="text" 
                placeholder="Ex: 🍓 FESTIVAL DE MORANGOS - SÓ HOJE!"
                className="bg-slate-950 border-2 border-slate-800 w-full p-6 rounded-3xl text-white font-black text-xl placeholder:text-slate-800 focus:border-amber-500/40 outline-none transition-all"
                value={settings.marketBanner} 
                onChange={(e) => setSettings({...settings, marketBanner: e.target.value})}
              />
            </div>

            <button onClick={handleSaveSettings} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 group">
               {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
               {saved ? 'SALVO COM SUCESSO' : 'ATUALIZAR BANNER GLOBAL'}
            </button>
          </div>
        </section>
        {/* Menu Global Banner */}
        <section className="bg-slate-900/40 border border-slate-800 p-12 rounded-[3.5rem] shadow-xl relative group">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white flex items-center gap-4">
                    <div className="bg-blue-500/20 p-2.5 rounded-xl"><ImageIcon className="text-blue-400" /></div>
                    Imagem do Menu (Encarte)
                </h2>
                {settings.menuImage && (
                    <button 
                        onClick={handleRemoveMenuImage} 
                        className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all border border-red-500/20"
                    >
                        <Trash2 size={14} /> Remover Foto Atual
                    </button>
                )}
            </div>
          
          <div className="space-y-6">
            {settings.menuImage ? (
              <div className="relative aspect-video bg-slate-950 rounded-[2.5rem] overflow-hidden border-2 border-slate-800 hover:border-blue-500/30 transition-all">
                <img 
                    src={`${api.defaults.baseURL?.replace('/api', '')}/${settings.menuImage}`} 
                    className="w-full h-full object-cover" 
                    alt="Menu Banner" 
                />
              </div>
            ) : (
              <label className="aspect-video bg-slate-950 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all group/upload">
                <FileUp size={48} className="text-slate-700 group-hover/upload:text-blue-400 transition-colors mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Clique para subir o encarte</p>
                <input type="file" className="hidden" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                        handleUploadMenuImage(e.target.files[0]);
                    }
                }} />
              </label>
            )}
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">💡 Esta imagem será enviada toda vez que o menu for aberto.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Management;
