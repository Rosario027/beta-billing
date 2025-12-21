import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActiveClientStore {
  activeClientId: number | null;
  setActiveClient: (id: number | null) => void;
}

// Simple global state for the currently selected client in the sidebar
export const useActiveClient = create<ActiveClientStore>()(
  persist(
    (set) => ({
      activeClientId: null,
      setActiveClient: (id) => set({ activeClientId: id }),
    }),
    {
      name: 'gst-active-client',
    }
  )
);
