import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  theme: 'dark' | 'light';
  fontSize: 'sm' | 'md' | 'lg';
  soundsMuted: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  toggleSounds: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 'md',
      soundsMuted: false,
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setFontSize: (fontSize) => {
        document.documentElement.setAttribute('data-fontsize', fontSize);
        set({ fontSize });
      },
      toggleSounds: () => set((state) => ({ soundsMuted: !state.soundsMuted })),
    }),
    {
      name: 'mns-app-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme);
          document.documentElement.setAttribute('data-fontsize', state.fontSize);
        }
      },
    }
  )
);
