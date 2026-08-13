import { create } from 'zustand';

export const useAppStore = create((set) => ({
  activeComponent: 'inscripciones-estudiante',
  expandedMenu: null,
  showClearModal: false,
  
  setActiveComponent: (component) => set({ activeComponent: component }),
  setExpandedMenu: (menu) => set({ expandedMenu: menu }),
  setShowClearModal: (show) => set({ showClearModal: show }),
}));
