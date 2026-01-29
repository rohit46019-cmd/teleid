
import React from 'react';
import { Icons } from '../constants.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, toggleTheme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Icons.Home },
    { id: 'groups', label: 'Groups', icon: Icons.Users },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed top-0 left-0 z-20 transition-colors duration-300">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Icons.Zap className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">TeleBridge</span>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all group border border-transparent dark:border-slate-800"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white shadow-sm group-hover:rotate-12 transition-transform">
              {theme === 'dark' ? <Icons.Moon size={16} /> : <Icons.Sun size={16} />}
            </div>
          </button>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Cloud Sync Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 flex items-center justify-around p-3 z-50 rounded-[2rem] shadow-2xl">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-90 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-400'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          </button>
        ))}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-slate-400 active:scale-90"
        >
          {theme === 'dark' ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
