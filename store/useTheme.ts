import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  // Initialize based on localStorage or default to dark
  const saved = localStorage.getItem('theme');
  const initialDark = saved !== 'light'; // Default to true (dark) if not set or set to 'dark'
  
  // Apply initial class
  if (initialDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    isDark: initialDark,
    toggleTheme: () => {
      const newDark = !get().isDark;
      set({ isDark: newDark });
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      
      if (newDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
});