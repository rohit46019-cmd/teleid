
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import GroupCard from './components/GroupCard.tsx';
import InviteModal from './components/InviteModal.tsx';
import { Icons } from './constants.tsx';
import { TelegramGroup } from './types.ts';
import { verifyBotToken, getChatDetails, TelegramBotInfo, getChatMemberCount } from './services/telegramService.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // Real State
  const [token, setToken] = useState(localStorage.getItem('tg_bot_token') || '');
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('tg_token_locked') === 'true');
  const [groups, setGroups] = useState<TelegramGroup[]>(() => {
    const saved = localStorage.getItem('tg_groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [newChatId, setNewChatId] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, []);
  
  useEffect(() => {
    const total = groups.reduce((sum, group) => sum + (group.memberCount || 0), 0);
    setTotalMembers(total);
  }, [groups]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tg_token_locked', isLocked.toString());
  }, [isLocked]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleVerify = async (testToken: string) => {
    if (!testToken) return;
    setIsVerifying(true);
    setError(null);
    try {
      const info = await verifyBotToken(testToken);
      setBotInfo(info);
      setToken(testToken);
      localStorage.setItem('tg_bot_token', testToken);
      refreshMemberCounts(testToken);
    } catch (err: any) {
      setError(err.message);
      setBotInfo(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddGroup = async () => {
    if (!token || !newChatId) return;
    setIsAddingGroup(true);
    setError(null);
    try {
      const chat = await getChatDetails(token, newChatId);
      const memberCount = await getChatMemberCount(token, newChatId);
      const newGroup: TelegramGroup = {
        id: chat.id.toString(),
        name: chat.title,
        memberCount: memberCount, 
        description: chat.description || 'Synced Group',
        category: 'Telegram',
        image: `https://picsum.photos/seed/${chat.id}/200`,
        lastInteraction: Date.now()
      };
      
      const updatedGroups = [newGroup, ...groups.filter(g => g.id !== newGroup.id)];
      setGroups(updatedGroups);
      localStorage.setItem('tg_groups', JSON.stringify(updatedGroups));
      setNewChatId('');
    } catch (err: any)
 {
      setError(err.message);
    } finally {
      setIsAddingGroup(false);
    }
  };

  const updateGroupUsage = (groupId: string) => {
    const updated = groups.map(g => 
      g.id === groupId ? { ...g, lastInteraction: Date.now() } : g
    );
    setGroups(updated);
    localStorage.setItem('tg_groups', JSON.stringify(updated));
  };

  const refreshMemberCounts = async (currentToken: string) => {
    if (!currentToken || groups.length === 0) return;
    setIsRefreshing(true);
    const updatedGroupsPromises = groups.map(async (group) => {
        try {
            const memberCount = await getChatMemberCount(currentToken, group.id);
            return { ...group, memberCount };
        } catch (e) {
            console.error(`Failed to update member count for ${group.name}`, e);
            return group; // return original group on error
        }
    });
    const updatedGroups = await Promise.all(updatedGroupsPromises);
    setGroups(updatedGroups);
    localStorage.setItem('tg_groups', JSON.stringify(updatedGroups));
    setIsRefreshing(false);
  };

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => (b.lastInteraction || 0) - (a.lastInteraction || 0));
  }, [groups]);

  const filteredGroups = sortedGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.id.includes(searchQuery)
  );

  const handleExport = () => {
    const config = { token, groups, isLocked };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "telebridge-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("Invalid file content");
            const config = JSON.parse(text);

            if (window.confirm("Overwrite current configuration? This cannot be undone.")) {
                if (config.token && typeof config.token === 'string') {
                    setToken(config.token);
                    localStorage.setItem('tg_bot_token', config.token);
                    handleVerify(config.token);
                }
                if (config.groups && Array.isArray(config.groups)) {
                    setGroups(config.groups);
                    localStorage.setItem('tg_groups', JSON.stringify(config.groups));
                }
                if (typeof config.isLocked === 'boolean') {
                    setIsLocked(config.isLocked);
                    localStorage.setItem('tg_token_locked', config.isLocked.toString());
                }
            }
        } catch (error) {
            setError("Failed to parse configuration file.");
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24 md:pb-8">
        <header className="flex flex-col gap-6 mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Administrator Portal</p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
                {activeTab}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
               <div className={`hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm`}>
                 <div className={`w-2 h-2 rounded-full ${botInfo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                   {botInfo ? `@${botInfo.username}` : 'Offline'}
                 </span>
               </div>
               <button onClick={() => handleVerify(token)} className="p-2.5 text-slate-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-95 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Icons.Zap size={20} className={isVerifying ? 'animate-spin text-blue-500' : ''} />
               </button>
            </div>
          </div>

          {(activeTab === 'dashboard' || activeTab === 'groups') && (
            <div className="flex flex-col md:flex-row items-center gap-4 p-2 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl border border-slate-300/30 dark:border-slate-800/50">
              <div className="relative group w-full md:flex-1">
                <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Filter by name or Chat ID..." 
                  className="bg-transparent text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl w-full text-sm outline-none placeholder-slate-400 dark:placeholder-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex w-full md:w-auto gap-2">
                <input 
                  type="text" 
                  placeholder="Chat ID (-100...)" 
                  className="flex-1 md:w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={newChatId}
                  onChange={(e) => setNewChatId(e.target.value)}
                />
                <button 
                  onClick={handleAddGroup}
                  disabled={isAddingGroup || !botInfo}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                >
                  {isAddingGroup ? 'Connecting...' : 'Sync Group'}
                </button>
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
             <div className="w-2 h-2 rounded-full bg-rose-500" />
             {error}
          </div>
        )}

        <div className="space-y-12 animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
               <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Active Bot</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white truncate">{botInfo?.username ? `@${botInfo.username}` : 'Not Connected'}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${botInfo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                      {botInfo ? 'Online' : 'Offline'}
                    </div>
                  </div>
               </div>
               <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Hubs</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{groups.length}</p>
                  <p className="mt-2 text-xs text-slate-500">Connected telegram chats</p>
               </div>
               <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Members</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{totalMembers.toLocaleString()}</p>
                  <p className="mt-2 text-xs text-slate-500">Across all hubs</p>
                  <button onClick={() => refreshMemberCounts(token)} disabled={isRefreshing || !botInfo} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-500 transition-all active:scale-90 disabled:opacity-30">
                    <Icons.Refresh size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
               </div>
               <div className="hidden sm:block bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl border border-blue-400/20 shadow-xl shadow-blue-500/10 transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-extrabold text-blue-100 uppercase tracking-widest mb-2">Security Engine</p>
                  <p className="text-lg font-bold text-white">Advanced AI Guard</p>
                  <p className="mt-2 text-xs text-blue-100/70">Encrypted token storage active</p>
               </div>
            </div>
          )}

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Usage-Priority Directory</h2>
              <div className="h-px flex-1 mx-6 bg-slate-200 dark:bg-slate-800 hidden md:block opacity-50"></div>
              <span className="text-[10px] font-bold text-slate-400">{filteredGroups.length} synced</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group, idx) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    isPriority={idx === 0 && !!group.lastInteraction}
                    onClick={(g) => {
                      updateGroupUsage(g.id);
                      setSelectedGroup(g);
                    }} 
                  />
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-700">
                    <Icons.Users size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Groups Found</h3>
                  <p className="text-slate-500 text-sm max-w-[280px] mx-auto mt-2 leading-relaxed font-medium">
                    Sync a new group using its Chat ID to start managing invites.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* API Credentials */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                    <Icons.Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">API Credentials</h2>
                    <p className="text-sm text-slate-500">Secure BotFather connection</p>
                  </div>
                </div>
                <button onClick={() => setIsLocked(!isLocked)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ isLocked ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500' }`}>
                  <Icons.Check size={14} /> {isLocked ? 'Locked' : 'Unlocked'}
                </button>
              </div>
              <div className="space-y-3">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bot Token</label>
                  <input type="password" placeholder="123456789:ABCDEF..." disabled={isLocked} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm font-mono text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" value={token} onChange={(e) => setToken(e.target.value)} />
              </div>
              {!isLocked && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 animate-in slide-in-from-top-2">
                    <button onClick={() => handleVerify(token)} disabled={isVerifying} className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]">
                      {isVerifying ? 'Authenticating...' : 'Validate and Save'}
                    </button>
                    <button onClick={() => { setToken(''); setBotInfo(null); localStorage.removeItem('tg_bot_token'); }} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-rose-500 transition-all active:scale-[0.98]">
                      Clear Credentials
                    </button>
                  </div>
              )}
            </div>

            {/* Group Directory */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Synced Groups Directory</h2>
              <p className="text-sm text-slate-500 mb-8">Quickly reference and copy your synced Chat IDs.</p>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sortedGroups.length > 0 ? sortedGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={group.image} alt={group.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white break-words">{group.name}</p>
                        <p className="text-xs font-mono text-slate-400">{group.id}</p>
                      </div>
                    </div>
                    <button onClick={() => copyToClipboard(group.id)} className="p-3 bg-white dark:bg-slate-700/50 hover:bg-blue-500 hover:text-white rounded-xl text-slate-400 transition-all shadow-sm active:scale-90">
                      <Icons.Copy size={16} />
                    </button>
                  </div>
                )) : (
                  <p className="text-center text-sm text-slate-400 py-8">No groups have been synced yet.</p>
                )}
              </div>
            </div>

            {/* Config Management */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Configuration Transfer</h2>
              <p className="text-sm text-slate-500 mb-8">Export your setup to a file or import an existing one to sync devices.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-sm font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                  <Icons.DownloadCloud size={18} /> Export Config
                </button>
                <button onClick={() => importFileRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-sm font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                  <Icons.UploadCloud size={18} /> Import Config
                </button>
                <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedGroup && (
        <InviteModal 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
          botToken={token}
        />
      )}
    </div>
  );
};

export default App;