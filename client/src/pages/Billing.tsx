import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Receipt, Hash, History, Key, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const Billing = () => {
  const [stats, setStats] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [secret, setSecret] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    const s = await api.get('/status');
    setStats(s.data);
    const l = await api.get('/billing-logs');
    setLogs(l.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = async () => {
    try {
      setError('');
      await api.post('/reset-billing', { secret });
      setSuccess('Faturamento zerado com sucesso!');
      setSecret('');
      setShowResetModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError('Chave Secreta Mestre Inválida.');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
      <header className="flex justify-between items-center bg-slate-900/30 p-12 rounded-[4rem] border border-slate-800/20 shadow-inner">
         <div className="flex items-center gap-10">
            <div className="bg-blue-500/10 p-8 rounded-[2.5rem] border border-blue-500/10 shadow-lg relative group">
               <Receipt size={56} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-transform" />
            </div>
            <div>
               <h1 className="text-6xl font-black text-white italic tracking-tighter mb-2">FECHAMENTO</h1>
               <p className="text-slate-500 font-bold uppercase tracking-[.4em] text-sm">Controle de Mensagens & Faturamento</p>
            </div>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Stats */}
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border-2 border-slate-800/60 p-14 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 <Receipt size={180} />
              </div>
              
              <h3 className="text-slate-500 font-black uppercase tracking-widest text-lg mb-4">Total Acumulado Neste Ciclo</h3>
              <div className="flex flex-col gap-2">
                 <p className="text-9xl font-black text-white italic drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] leading-none mb-4">
                   R$ <span className="text-blue-400">{(stats.messageCount * (stats.billingRate || 0.2)).toFixed(2)}</span>
                 </p>
                 <div className="bg-slate-950/80 px-10 py-4 rounded-full border border-slate-800 flex items-center gap-4 mx-auto backdrop-blur-md">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Métrica:</span>
                    <span className="text-white font-black text-xl">{stats.messageCount || 0} msgs</span>
                    <span className="text-slate-600">×</span>
                    <span className="text-white font-black text-xl">R$ {stats.billingRate?.toFixed(2)}</span>
                 </div>
              </div>

              <button 
                onClick={() => setShowResetModal(true)}
                className="mt-12 group relative bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-12 py-5 rounded-3xl font-black text-lg transition-all border border-red-500/30 flex items-center gap-4 overflow-hidden"
              >
                 <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                 <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                 ZERAR CICLO ATUAL
              </button>
           </div>

           {/* Feedback Messages */}
           {success && (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-8 rounded-[2.5rem] flex items-center gap-6 animate-bounce">
                 <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                 <p className="text-emerald-100 font-black text-xl italic">{success}</p>
              </div>
           )}
        </div>

        {/* Logs / History */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 p-10 rounded-[3.5rem] flex flex-col">
            <h3 className="text-xl font-black text-white italic tracking-tighter mb-10 flex items-center gap-4 uppercase">
               <div className="bg-slate-800 p-2.5 rounded-xl"><History size={20} className="text-blue-400" /></div>
               Histórico de Resets
            </h3>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
               {logs.map((log) => (
                 <div key={log.id} className="p-6 bg-slate-950 border border-slate-800/80 rounded-3xl group hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                         {new Date(log.timestamp).toLocaleDateString()} em {new Date(log.timestamp).toLocaleTimeString()}
                       </p>
                       <div className="w-2 h-2 rounded-full bg-blue-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <p className="text-white font-black text-2xl italic tracking-tighter">
                       R$ {(log.msgCountBeforeReset * (stats.billingRate || 0.2)).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Sessão de {log.msgCountBeforeReset} msgs</p>
                 </div>
               ))}

               {logs.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                    <History size={64} className="mb-4" />
                    <p className="font-black text-sm uppercase tracking-widest">Nenhum registro</p>
                 </div>
               )}
            </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6">
           <div className="bg-slate-900 border-4 border-red-500/20 w-full max-w-xl p-14 rounded-[4rem] shadow-[0_0_100px_rgba(239,68,68,0.1)] relative">
              <div className="bg-red-500/10 p-6 rounded-full w-fit mx-auto mb-10 border border-red-500/20 shadow-lg">
                 <AlertTriangle size={64} className="text-red-500" />
              </div>
              
              <h2 className="text-3xl font-black text-white text-center italic uppercase mb-4 tracking-tighter">ATENÇÃO: AÇÃO CRÍTICA</h2>
              <p className="text-slate-500 text-center font-bold mb-10 leading-relaxed px-10">Você está prestes a zerar o faturamento global do sistema. Esta operação é irreversível e exige a Chave Secreta Mestre.</p>
              
              <div className="space-y-6">
                <div className="relative">
                   <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                   <input 
                      type="password" 
                      placeholder="INSIRA A CHAVE MESTRE (resetSecret)"
                      className="bg-slate-950 border-2 border-slate-800 w-full p-6 pl-16 rounded-3xl text-white font-black text-center tracking-[0.5em] focus:border-red-500/50 outline-none transition-all placeholder:text-slate-800 placeholder:tracking-normal placeholder:font-bold"
                      value={secret} 
                      onChange={(e) => setSecret(e.target.value)} 
                   />
                </div>

                {error && (
                   <div className="flex items-center gap-3 justify-center text-red-500 font-black animate-shake">
                      <XCircle size={18} />
                      <p className="text-xs uppercase tracking-widest">{error}</p>
                   </div>
                )}

                <div className="flex gap-4">
                  <button onClick={() => setShowResetModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white p-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all">
                    CANCELAR
                  </button>
                  <button onClick={handleReset} className="flex-[2] bg-red-600 hover:bg-red-500 text-white p-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-3">
                    CONFIRMAR RESET
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
