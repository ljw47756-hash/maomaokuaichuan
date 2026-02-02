import React, { useRef } from 'react';
import { useP2PStore } from '../store/useP2P';
import { useLanguageStore } from '../store/useLanguage';
import { Button } from '../components/ui/Button';
import { TransferList } from '../components/TransferList';
import { Copy, ArrowLeft, UploadCloud } from 'lucide-react';

export const Sender: React.FC = () => {
  const { code, status, reset, sendFile } = useP2PStore();
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyCode = () => {
    if (code) navigator.clipboard.writeText(code);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => sendFile(file));
    }
    // reset value to allow same file selection again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={reset}>
          <ArrowLeft size={18} />
        </Button>
        <h2 className="text-xl font-semibold">{t('sendFileTitle')}</h2>
      </div>

      {status === 'waiting' && (
        <div className="text-center space-y-6 py-8">
          <div className="space-y-2">
            <p className="text-zinc-500 dark:text-zinc-400">{t('shareCode')}</p>
            <div 
              onClick={copyCode}
              className="text-5xl md:text-6xl font-mono font-bold tracking-wider text-zinc-900 dark:text-white cursor-pointer hover:scale-105 transition-transform active:scale-95"
            >
              {code}
            </div>
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
              <Copy size={12} /> {t('clickCopy')}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-indigo-500 dark:text-indigo-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-current" />
            <span className="text-sm">{t('waiting')}</span>
          </div>
        </div>
      )}

      {(status === 'connected' || status === 'transferring') && (
        <div className="space-y-6">
          <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-colors text-center cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
              <UploadCloud size={24} />
            </div>
            <p className="text-zinc-700 dark:text-zinc-200 font-medium">{t('uploadTitle')}</p>
            <p className="text-sm text-zinc-500 mt-1">{t('uploadDesc')}</p>
          </div>
          
          <TransferList />
        </div>
      )}
    </div>
  );
};