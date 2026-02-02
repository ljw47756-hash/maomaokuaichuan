import React from 'react';
import { useP2PStore } from './store/useP2P';
import { useLanguageStore } from './store/useLanguage';
import { useThemeStore } from './store/useTheme';
import { Home } from './views/Home';
import { Sender } from './views/Sender';
import { Receiver } from './views/Receiver';
import { Github, Languages, Cat } from 'lucide-react';

export default function App() {
  const { role } = useP2PStore();
  const { language, setLanguage, t } = useLanguageStore();
  const { isDark, toggleTheme } = useThemeStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b transition-colors duration-300 border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            {/* Replaced Logo */}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent uppercase tracking-wider font-extrabold">
              MAOMAOKUAICHUAN
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <Cat size={20} />
            </button>

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800"
            >
              <Languages size={14} />
              <span>{language === 'en' ? '中文' : 'English'}</span>
            </button>
            <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full flex flex-col">
        {role === 'idle' && <Home />}
        {role === 'sender' && <Sender />}
        {role === 'receiver' && <Receiver />}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-zinc-500 dark:text-zinc-600 text-sm">
        <p>© {new Date().getFullYear()} MAOMAOKUAICHUAN. {t('footer')}</p>
      </footer>
    </div>
  );
}