import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../api/api';

const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/login', { password });
            localStorage.setItem('admin_token', res.data.token);
            window.location.href = '/';
        } catch (err: any) {
            setError('Senha de acesso incorreta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/10">
                        <ShieldCheck className="text-emerald-400 w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Área Restrita</h1>
                    <p className="text-slate-500 mt-2 font-medium">Acesso exclusivo para administradores Colorado.</p>
                </div>

                <div className="premium-card p-10 bg-slate-900/40 backdrop-blur-xl border-slate-800/50">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Senha de Segurança</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-800 p-5 pl-14 rounded-2xl text-white font-bold outline-none focus:border-emerald-500 transition-all text-lg"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-bold text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <button 
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                            ) : (
                                <>Acessar Painel <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-10 text-slate-600 text-xs font-bold uppercase tracking-widest">
                    Colorado Bot v2.0 • Sistema Seguro
                </p>
            </div>
        </div>
    );
};

export default Login;
