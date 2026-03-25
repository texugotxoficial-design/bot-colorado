import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Edit3, MessageSquare, ChevronDown, CheckCircle2, XCircle, FileUp, File, X, Image as ImageIcon } from 'lucide-react';
import api from '../api/api';

const MenuConfig = () => {
    const [options, setOptions] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ key: '', label: '', replyMessage: '', isActive: true });
    
    // Anexos
    const [files, setFiles] = useState<File[]>([]); // Novos para upload
    const [existingAttachments, setExistingAttachments] = useState<any[]>([]); // Já salvos no BD

    const fetchOptions = async () => {
        try {
            const res = await api.get('/options');
            setOptions(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    const handleEdit = (opt: any) => {
        setForm({ key: opt.key, label: opt.label, replyMessage: opt.replyMessage, isActive: opt.isActive });
        setEditingId(opt.id);
        setExistingAttachments(opt.attachments || []);
        setFiles([]);
        setShowForm(true);
    };

    const handleDeleteOption = async (id: string) => {
        if (!window.confirm('Excluir esta opção permanentemente?')) return;
        try {
            await api.delete(`/options/${id}`);
            fetchOptions();
        } catch (e) {
            alert('Erro ao excluir');
        }
    };

    const handleDeleteAttachment = async (id: string) => {
        try {
            await api.delete(`/options/attachments/${id}`);
            setExistingAttachments(prev => prev.filter(a => a.id !== id));
            fetchOptions();
        } catch (e) {
            alert('Erro ao excluir anexo');
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const formData = new FormData();
        if (editingId) formData.append('id', editingId);
        formData.append('key', form.key);
        formData.append('label', form.label);
        formData.append('replyMessage', form.replyMessage);
        formData.append('isActive', String(form.isActive));
        
        files.forEach(f => formData.append('attachments', f));

        try {
            await api.post('/options', formData);
            resetForm();
            fetchOptions();
        } catch (e) {
            alert('Erro ao salvar opção');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ key: '', label: '', replyMessage: '', isActive: true });
        setFiles([]);
        setExistingAttachments([]);
    };

    const getPreviewUrl = (file: File) => {
        if (file.type.startsWith('image/')) return URL.createObjectURL(file);
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Menu do Bot</h1>
                    <p className="text-slate-400 mt-2 font-medium">Configure as teclas de atalho e respostas automáticas.</p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3"
                    >
                        <Plus size={20} strokeWidth={3} /> Nova Opção
                    </button>
                )}
            </header>

            {showForm && (
                <div className="premium-card p-10 animate-in slide-in-from-top duration-500 overflow-hidden relative">
                    <button onClick={resetForm} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            <Edit3 className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {editingId ? 'Editar Opção' : 'Criar Nova Opção'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tecla</label>
                                <input 
                                    type="text" 
                                    value={form.key} 
                                    onChange={e => setForm({...form, key: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white text-xl font-black text-center focus:border-emerald-500 outline-none"
                                    placeholder="1"
                                    required
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nome da Opção (Menu)</label>
                                <input 
                                    type="text" 
                                    value={form.label}
                                    onChange={e => setForm({...form, label: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold focus:border-emerald-500 outline-none"
                                    placeholder="Ex: Ver Promoções da Semana"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Mensagem de Resposta</label>
                            <textarea 
                                rows={4}
                                value={form.replyMessage}
                                onChange={e => setForm({...form, replyMessage: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 p-6 rounded-3xl text-white font-medium focus:border-emerald-500 outline-none"
                                placeholder="Descreva o que o bot deve responder..."
                                required
                            />
                        </div>

                        {/* ANEXOS SECTION */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Encartes e Anexos</label>
                            
                            {/* Grid de Previsão */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {/* Existentes */}
                                {existingAttachments.map(att => (
                                    <div key={att.id} className="relative group aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                                        {att.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img src={`/${att.path}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Preview" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><File size={32} className="text-slate-700" /></div>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => handleDeleteAttachment(att.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-slate-900/80 text-[10px] text-slate-400 font-bold uppercase truncate">Salvo</div>
                                    </div>
                                ))}

                                {/* Novos Uploads (Pendentes) */}
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative group aspect-square bg-emerald-500/5 rounded-2xl overflow-hidden border border-emerald-500/20">
                                        {file.type.startsWith('image/') ? (
                                            <img src={getPreviewUrl(file)!} className="w-full h-full object-cover" alt="New Preview" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-4 text-center">
                                                <div className="space-y-1">
                                                    <FileUp size={24} className="text-emerald-400 mx-auto" />
                                                    <div className="text-[10px] text-emerald-500 font-bold truncate max-w-full">{file.name}</div>
                                                </div>
                                            </div>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-2 right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-lg hover:bg-emerald-400 shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-emerald-500/80 text-[10px] text-slate-950 font-bold uppercase text-center">Novo</div>
                                    </div>
                                ))}

                                {/* Botão de Adicionar Mais */}
                                <label className="aspect-square bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-900 transition-all group">
                                    <Plus size={24} className="text-slate-700 group-hover:text-emerald-400" />
                                    <span className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Adicionar</span>
                                    <input type="file" multiple className="hidden" onChange={e => {
                                        if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                    }} />
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-800/50">
                            <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Save size={20} /> {editingId ? 'Atualizar Opção' : 'Criar Opção Agora'}
                            </button>
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={() => handleDeleteOption(editingId)}
                                    className="px-8 py-5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Excluir Opção
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Listagem */}
            <div className="grid grid-cols-1 gap-6">
                {options.map((opt) => (
                    <div key={opt.id} className="premium-card p-10 hover:bg-slate-900/80 transition-all flex flex-col md:flex-row items-start md:items-center gap-10 group">
                        <div className="bg-emerald-500 text-slate-950 w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)]">
                            {opt.key}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                                    {opt.label}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleEdit(opt)} 
                                        className="bg-slate-800/50 hover:bg-slate-700 p-3 rounded-xl text-slate-300 transition-colors"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-500 text-lg italic leading-relaxed line-clamp-2">
                                "{opt.replyMessage}"
                            </p>
                            
                            {/* Tags de Arquivos na Lista */}
                            {opt.attachments && opt.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-2">
                                        <FileUp size={12} /> {opt.attachments.length} ARQUIVOS VINCULADOS
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {options.length === 0 && !showForm && (
                    <div className="premium-card p-20 text-center space-y-4">
                        <div className="bg-slate-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                            <MessageSquare className="text-slate-700" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-400">Nenhuma opção configurada</h2>
                        <p className="text-slate-600 max-w-xs mx-auto">Comece criando sua primeira tecla de menu para o bot.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuConfig;
