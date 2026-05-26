import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Environment {
  id: string;
  slug: string;
  name: string;
  is_active_globally: boolean;
  theme_config: {
    primary?: string;
    secondary?: string;
    accent?: string;
    [key: string]: any;
  };
  features_config: {
    [key: string]: any;
  };
  dashboard_layout: string;
}

interface EnvironmentState {
  activeEnvironment: Environment | null;
  environments: Environment[];
  loading: boolean;
  error: string | null;
  fetchEnvironments: () => Promise<void>;
  setActiveEnvironment: (id: string) => Promise<void>;
}

// Fallback por defecto si no hay conexión a BD
const defaultFallbackEnv: Environment = {
  id: 'local-fallback',
  slug: 'unidas-1',
  name: 'UNIDAS Barrios Unidos',
  is_active_globally: true,
  theme_config: {
    primary: '#6B21A8',
    secondary: '#9333EA',
    accent: '#F59E0B'
  },
  features_config: {},
  dashboard_layout: 'default'
};

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  activeEnvironment: null,
  environments: [],
  loading: true,
  error: null,

  fetchEnvironments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const active = data.find(env => env.is_active_globally) || data[0];
        set({ 
          environments: data as Environment[], 
          activeEnvironment: active as Environment,
          loading: false 
        });
        
        // Inject Theme variables to root
        injectThemeVariables(active.theme_config);
      } else {
        // Fallback si la tabla está vacía o no existe aún
        set({ 
          environments: [defaultFallbackEnv], 
          activeEnvironment: defaultFallbackEnv,
          loading: false 
        });
        injectThemeVariables(defaultFallbackEnv.theme_config);
      }
    } catch (err: any) {
      console.error('Error fetching environments:', err);
      // En caso de error, usar fallback para no romper la app
      set({ 
        error: err.message, 
        environments: [defaultFallbackEnv], 
        activeEnvironment: defaultFallbackEnv,
        loading: false 
      });
      injectThemeVariables(defaultFallbackEnv.theme_config);
    }
  },

  setActiveEnvironment: async (id: string) => {
    try {
      set({ loading: true });
      
      // 1. Apagar todos los demás
      const { error: err1 } = await supabase
        .from('environments')
        .update({ is_active_globally: false })
        .neq('id', id);
        
      if (err1) throw err1;

      // 2. Encender el seleccionado
      const { error: err2 } = await supabase
        .from('environments')
        .update({ is_active_globally: true })
        .eq('id', id);

      if (err2) throw err2;

      // Recargar lista y forzar actualización
      await get().fetchEnvironments();
      
      // Opcional: Recargar toda la página para asegurar que todo el estado de React se limpie
      window.location.reload();
      
    } catch (err: any) {
      console.error('Error setting active environment:', err);
      set({ error: err.message, loading: false });
    }
  }
}));

// Función auxiliar para inyectar variables CSS en el DOM
function injectThemeVariables(theme: any) {
  const root = document.documentElement;
  if (theme.primary) root.style.setProperty('--color-unidas-primary', theme.primary);
  if (theme.secondary) root.style.setProperty('--color-unidas-secondary', theme.secondary);
  if (theme.accent) root.style.setProperty('--color-unidas-accent', theme.accent);
  if (theme.dark) root.style.setProperty('--color-unidas-dark', theme.dark);
  if (theme.bg) root.style.setProperty('--color-unidas-bg', theme.bg);
}
