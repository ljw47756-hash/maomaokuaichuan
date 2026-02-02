import React, { useState } from 'react';
import { useP2PStore } from '../store/useP2P';
import { useLanguageStore } from '../store/useLanguage';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TransferList } from '../components/TransferList';
import { ArrowLeft, Wifi } from 'lucide-react';

export const Receiver: React.FC = () => {
  const { status, joinRoom, reset } = useP2PStore();
  const { t } = useLanguageStore();
  const [inputCode, setInputCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length === 6) {
      joinRoom(inputCode);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={reset}>
          <ArrowLeft size={18} />
        </Button>
        <h2 className="text-xl font-semibold">{t('receiveFileTitle')}</h2>
      </div>

      {status === 'idle' || status === 'connecting' || status === 'failed' ? (
        <form onSubmit={handleJoin} className="space-y-6">
           <div className="space-y-4">
             <label className="block text-sm text-zinc-500 dark:text-zinc-400">{t('enterCode')}</label>
             <Input
               autoFocus
               placeholder="000000"
               maxLength={6}
               className="text-center text-3xl tracking-[0.5em] font-mono h-20"
               value={inputCode}
               onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
             />
           </div>
           
           <Button 
             type="submit" 
             disabled={inputCode.length !== 6 || status === 'connecting'} 
             className="w-full h-12 text-base"
           >
             {status === 'connecting' ? t('connecting') : t('connectBtn')}
           </Button>

           {status === 'failed' && (
             <p className="text-red-500 text-center text-sm">{t('failed')}</p>
           )}
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 text-green-600 dark:text-green-500 rounded-xl border border-green-500/20">
            <Wifi size={20} />
            <span className="font-medium">{t('connected')}</span>
          </div>
          
          <div className="text-center text-zinc-500 text-sm">
            {t('waitingFiles')}
          </div>

          <TransferList />
        </div>
      )}
    </div>
  );
};