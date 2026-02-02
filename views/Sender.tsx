import React, { useRef, useState } from 'react';
import { useP2PStore } from '../store/useP2P';
import { useLanguageStore } from '../store/useLanguage';
import { Button } from '../components/ui/Button';
import { TransferList } from '../components/TransferList';
import { Copy, ArrowLeft, UploadCloud, Check, Lock, ShieldCheck } from 'lucide-react';

export const Sender: React.FC = () => {
  const { code, status, reset, sendFile } = useP2PStore();
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers or non-secure contexts
      try {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed', fallbackErr);
      }
    }
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
              className="group relative inline-block text-5xl md:text-6xl font-mono font-bold tracking-wider text-zinc-900 dark:text-white cursor-pointer hover:scale-105 transition-transform active:scale-95 select-none"
            >
              {code}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs py-1 px-2 rounded">
                {copied ? 'Copied!' : 'Copy'}
              </div>
            </div>
            <button 
              onClick={copyCode}
              className="text-xs text-zinc-500 hover:text-indigo-500 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} 
              {copied ? 'Copied!' : t('clickCopy')}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-indigo-500 dark:text-indigo-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-current" />
            <span className="text-sm">{t('waiting')}</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900/50 py-1.5 px-3 rounded-full w-fit mx-auto">
            <Lock size={12} />
            <span>End-to-End Encrypted Channel</span>
          </div>
        </div>
      )}

      {(status === 'connected' || status === 'transferring') && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-500 bg-green-500/10 py-2 px-4 rounded-full w-fit mx-auto text-sm font-medium border border-green-500/20">
            <ShieldCheck size={16} />
            <span>Secure P2P Connection Active</span>
          </div>

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