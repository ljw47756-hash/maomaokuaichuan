import React from 'react';
import { useP2PStore } from '../store/useP2P';
import { useLanguageStore } from '../store/useLanguage';
import { FileIcon, Download, CheckCircle, Loader2 } from 'lucide-react';

export const TransferList: React.FC = () => {
  const { files } = useP2PStore();
  const { t } = useLanguageStore();

  if (files.length === 0) return null;

  return (
    <div className="w-full space-y-3 mt-6">
      <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 px-1">{t('transfers')}</h3>
      {files.map((file) => (
        <div 
          key={file.id} 
          className="relative overflow-hidden group flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none"
        >
          {/* Progress Bar Background */}
          {file.status === 'transferring' && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300" 
              style={{ width: `${file.progress}%` }}
            />
          )}

          <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <FileIcon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
            <p className="text-xs text-zinc-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.status === 'completed' ? t('done') : `${file.progress}%`}
            </p>
          </div>

          <div className="shrink-0 text-zinc-400">
            {file.status === 'transferring' && <Loader2 className="animate-spin" size={20} />}
            {file.status === 'completed' && <CheckCircle className="text-green-500" size={20} />}
          </div>

          {file.status === 'completed' && file.blobUrl && (
             <a 
              href={file.blobUrl} 
              download={file.name}
              className="shrink-0 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-indigo-500 dark:text-indigo-400 transition-colors"
            >
              <Download size={18} />
             </a>
          )}
        </div>
      ))}
    </div>
  );
};