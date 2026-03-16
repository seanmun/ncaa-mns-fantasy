import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  fontSize: 'sm' | 'md' | 'lg';
  soundsMuted: boolean;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  toggleSounds: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      fontSize: 'md',
      soundsMuted: false,
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
          document.documentElement.setAttribute('data-fontsize', state.fontSize);
        }
      },
    }
  )
);
