import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Menu, Megaphone, Receipt, Settings, Bot, Camera, CreditCard, LogOut } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2 rounded-lg">
          <Bot className="w-8 h-8 text-emerald-400" />
        </div>
        <span className="font-bold text-xl tracking-tight">Bot Texugo <span className="text-emerald-500">V2</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
        <NavItem to="/menu" icon={<Menu className="w-5 h-5" />} label="Menu Bot" />
          <NavItem to="/management" icon={<Megaphone className="w-5 h-5" />} label="Gestão Geral" />
          <NavItem to="/status" icon={<Camera className="w-5 h-5" />} label="Status WhatsApp" />
          <NavItem to="/billing" icon={<CreditCard className="w-5 h-5" />} label="Faturamento" />
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <button 
          onClick={() => {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
        >
          <LogOut size={18} /> Sair do Painel
        </button>
        <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Sistema Ativo</span>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => 
      `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default Sidebar;
