
import React, { useState } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';

interface GroupCardProps {
  group: TelegramGroup;
  isPriority?: boolean;
  onClick: (group: TelegramGroup) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isPriority, onClick }) => {
  const [copied, setCopied] = useState(false);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onClick(group)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-4 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.97]"
    >
      {isPriority && (
        <div className="absolute -top-2 -right-2 px-2.5 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-600/30 z-10 border border-blue-400/20">
          Recent
        </div>
      )}

      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <img 
          src={group.image} 
          alt={group.name} 
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
          loading="lazy"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight break-words">{group.name}</h3>
        <button 
          onClick={copyId}
          className="flex items-center gap-1.5 mt-1 group/id"
        >
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-widest hover:text-blue-500 transition-colors">
            ID: {group.id.substring(0, 10)}...
          </p>
          <Icons.Copy size={10} className={`text-slate-300 group-hover/id:text-blue-400 transition-all ${copied ? 'scale-125 text-emerald-500' : ''}`} />
        </button>
      </div>
      
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-blue-600 group-hover:text-white text-slate-400 dark:text-slate-600 transition-all duration-300 self-center">
        <Icons.Link size={18} />
      </div>
    </div>
  );
};

export default GroupCard;