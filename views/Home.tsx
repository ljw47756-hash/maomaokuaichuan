import React from 'react';
import { Send, Download, Zap } from 'lucide-react';
import { useP2PStore } from '../store/useP2P';
import { useLanguageStore } from '../store/useLanguage';

export const Home: React.FC = () => {
  const { setRole, generateCode } = useP2PStore();
  const { t } = useLanguageStore();

  const handleSend = () => {
    generateCode(); // Sets role to 'sender' automatically
  };

  const handleReceive = () => {
    setRole('receiver');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
          <Zap size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
          {t('heroTitle')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          {t('heroSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
        <button
          onClick={handleSend}
          className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-indigo-500/50 transition-all duration-300 shadow-sm dark:shadow-none"
        >
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-600 group-hover:text-white text-zinc-700 dark:text-zinc-200 transition-colors duration-300">
            <Send size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{t('sendBtn')}</h3>
            <p className="text-sm text-zinc-500">{t('sendDesc')}</p>
          </div>
        </button>

        <button
          onClick={handleReceive}
          className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-emerald-500/50 transition-all duration-300 shadow-sm dark:shadow-none"
        >
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-600 group-hover:text-white text-zinc-700 dark:text-zinc-200 transition-colors duration-300">
            <Download size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{t('receiveBtn')}</h3>
            <p className="text-sm text-zinc-500">{t('receiveDesc')}</p>
          </div>
        </button>
      </div>
      
      <p className="text-xs text-zinc-500 dark:text-zinc-600 max-w-xs">
         {t('note')}
      </p>
    </div>
  );
};