import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MenuConfig from './pages/MenuConfig';
import Management from './pages/Management';
import Billing from './pages/Billing';
import StatusSchedule from './pages/StatusSchedule';
import Login from './pages/Login';

// Protetor de Rota
const Protected = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" />;
  return (
    <div className="flex bg-[#0A0B14] text-slate-100 min-h-screen font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/menu" element={<Protected><MenuConfig /></Protected>} />
        <Route path="/status" element={<Protected><StatusSchedule /></Protected>} />
        <Route path="/billing" element={<Protected><Billing /></Protected>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
