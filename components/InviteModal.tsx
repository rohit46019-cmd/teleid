
import React, { useState, useEffect } from 'react';
import { TelegramGroup, GeminiInsight } from '../types.ts';
import { Icons } from '../constants.tsx';
import { getGroupInsights, generateLinkDescription } from '../services/geminiService.ts';
import { createInviteLink } from '../services/telegramService.ts';

interface InviteModalProps {
  group: TelegramGroup;
  onClose: () => void;
  botToken: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ group, onClose, botToken }) => {
  const [link, setLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [useLimit] = useState(1);
  const [expiration] = useState('0'); 

  useEffect(() => {
    if (botToken && group) {
      handleGenerateLink();
    }
    const fetchAI = async () => {
      const desc = await generateLinkDescription(group.name);
      setAiDescription(desc);
    };
    fetchAI();
  }, [group, botToken]);

  const handleGenerateLink = async () => {
    if (!botToken) {
      setError("Connect your bot in settings first!");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const realLink = await createInviteLink(
        botToken, 
        group.id, 
        useLimit, 
        parseInt(expiration)
      );
      setLink(realLink);
    } catch (err: any) {
      setError(err.message || 'Failed to generate link. Check bot permissions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col p-8 md:p-10 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-8">
           <div>
             <div className="flex items-center gap-3 mb-2">
               <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
               <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Secure Invite System</p>
             </div>
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[300px]">{group.name}</h2>
           </div>
           <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all p-3 rounded-2xl active:scale-90">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-bold uppercase tracking-wide">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 relative group min-h-[80px] flex items-center shadow-inner">
            {isGenerating ? (
              <div className="flex items-center gap-4 text-slate-400 text-sm font-bold animate-pulse">
                <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Encrypting link...
              </div>
            ) : link ? (
              <>
                <div className="text-blue-600 dark:text-blue-400 font-mono text-sm truncate mr-12 select-all font-bold">{link}</div>
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-4 p-3 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all shadow-sm active:scale-90"
                >
                  {copied ? <Icons.Check size={20} /> : <Icons.Copy size={20} />}
                </button>
              </>
            ) : (
              <span className="text-slate-400 italic text-sm font-medium">Link preparation required...</span>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleGenerateLink}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Rotate Key
            </button>
            <button 
              onClick={copyToClipboard}
              className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
            >
              {copied ? 'Copied' : 'Duplicate'}
            </button>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icons.Users size={14} className="text-slate-400" />
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Limit: 1 User</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Clock size={14} className="text-slate-400" />
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Type: Permanent</span>
              </div>
            </div>
            
            <div className="p-5 bg-slate-50 dark:bg-blue-500/5 rounded-2xl border border-slate-100 dark:border-blue-500/10">
               <p className="text-[11px] text-slate-500 dark:text-blue-300/70 leading-relaxed font-medium italic">
                 "{aiDescription || "Your exclusive bridge to the community is ready. Handle with care."}"
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
