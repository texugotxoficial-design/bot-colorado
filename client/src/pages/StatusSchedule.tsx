import React, { useEffect, useState } from 'react';
import { Camera, Calendar, Clock, Trash2, Plus, Image as ImageIcon, Send, History } from 'lucide-react';
import api from '../api/api';

interface Schedule {
  id: string;
  text: string | null;
  imagePath: string | null;
  scheduledAt: string;
  isPosted: boolean;
}

const StatusSchedule = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [text, setText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get('/status-schedules');
      setSchedules(data);
    } catch (e) {
      console.error('Erro ao buscar agendamentos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return alert('Selecione uma data e hora');

    setLoading(true);
    const formData = new FormData();
    formData.append('text', text);
    formData.append('scheduledAt', new Date(scheduledAt).toISOString());
    if (image) formData.append('image', image);

    try {
      await api.post('/status-schedules', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setText('');
      setScheduledAt('');
      setImage(null);
      fetchSchedules();
    } catch (e) {
      alert('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Excluir este agendamento?')) return;
    try {
      await api.delete(`/status-schedules/${id}`);
      fetchSchedules();
    } catch (e) {
      alert('Erro ao excluir');
    }
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-3xl"><Camera className="text-emerald-400 w-8 h-8" /></div>
          Status do WhatsApp
        </h1>
        <p className="text-slate-400">Agende e gerencie suas postagens automáticas nos Stories.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Formulário de Criação */}
        <div className="premium-card p-10 space-y-8">
          <h3 className="text-xl font-semibold flex items-center gap-3"><Plus className="text-emerald-400" /> Novo Agendamento</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Texto do Status (Legenda)</label>
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700/60 rounded-3xl p-5 text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none min-h-[120px]"
                placeholder="O que você quer dizer hoje?"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Data e Hora do Post</label>
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-3xl p-4 text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Anexo (Imagem)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept="image/*"
                  />
                  <div className="bg-slate-900 border-2 border-dashed border-slate-700/60 rounded-3xl p-4 flex items-center justify-center gap-3 text-slate-400 group-hover:border-emerald-500/40 transition-all">
                    <ImageIcon size={20} />
                    <span>{image ? image.name : 'Escolher Foto'}</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-3xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Send size={20} /> Agendar Postagem
            </button>
          </form>
        </div>

        {/* Lista de Agendamentos */}
        <div className="premium-card p-10 space-y-8 flex flex-col">
          <h3 className="text-xl font-semibold flex items-center gap-3"><History className="text-blue-400" /> Próximas Postagens</h3>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {schedules.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                  <Clock size={48} className="opacity-20" />
                  <p className="italic">Nenhum post agendado para o momento.</p>
               </div>
            ) : (
              schedules.map((item) => (
                <div key={item.id} className={`p-6 rounded-[2rem] border transition-all ${item.isPosted ? 'bg-slate-900/20 border-slate-800/40 opacity-50' : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                        {item.imagePath && (
                            <img src={`/${item.imagePath}`} className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-lg" alt="Preview" />
                        )}
                        <div>
                            <p className="text-white font-medium line-clamp-1">{item.text || 'Sem legenda'}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                <Calendar size={14} /> 
                                {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${item.isPosted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {item.isPosted ? 'Postado' : 'Agendado'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!item.isPosted && (
                      <button onClick={() => deleteSchedule(item.id)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusSchedule;
