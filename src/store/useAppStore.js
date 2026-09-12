import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

export const useAppStore = create((set) => ({
  session: null,
  isAuthInitialized: false,
  userRole: null,
  isPasswordRecovery: false,
  activeComponent: 'estudiante-360',
  expandedMenu: null,
  showClearModal: false,
  isCommandPaletteOpen: false,
  aiPrefilledData: null,
  
  initializeAuth: () => {
    let currentUserId = null;
    let inFlightRolePromise = null;

    const fetchRole = async (session) => {
      if (!session?.user?.id) {
        set({ userRole: null });
        currentUserId = null;
        return;
      }
      if (currentUserId === session.user.id && useAppStore.getState().userRole) {
        return;
      }
      if (inFlightRolePromise) {
        return inFlightRolePromise;
      }

      currentUserId = session.user.id;
      inFlightRolePromise = (async () => {
        try {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          const role = data?.role || 'user';
          set({ userRole: role });
        } catch (err) {
          console.error('Error fetching user role:', err);
          set({ userRole: 'user' });
        } finally {
          inFlightRolePromise = null;
        }
      })();

      return inFlightRolePromise;
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isAuthInitialized: true });
      fetchRole(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      if (event !== 'INITIAL_SESSION') {
        fetchRole(session);
      }

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
