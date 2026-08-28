import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

export const useAppStore = create((set) => ({
  session: null,
  isAuthInitialized: false,
  userRole: null,
  isPasswordRecovery: false,
  activeComponent: 'inscripciones-estudiante',
  expandedMenu: null,
  showClearModal: false,
  isCommandPaletteOpen: false,
  aiPrefilledData: null,
  
  initializeAuth: () => {
    const fetchRole = async (session) => {
      if (!session) {
        set({ userRole: null });
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      const role = data?.role || 'user';
      set({ userRole: role });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isAuthInitialized: true });
      fetchRole(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      fetchRole(session);

      if (event === 'PASSWORD_RECOVERY') {
        set({ isPasswordRecovery: true });
      }
    });

    return () => subscription.unsubscribe();
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  setActiveComponent: (component) => set({ activeComponent: component }),
  setExpandedMenu: (menu) => set({ expandedMenu: menu }),
  setShowClearModal: (show) => set({ showClearModal: show }),
  setIsCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  setAiPrefilledData: (data) => set({ aiPrefilledData: data }),
}));
