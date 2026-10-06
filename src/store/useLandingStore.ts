import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export type LandingPage = 'original' | 'component-4';
export type ActiveSurvey = 'uno' | 'dos';

interface LandingState {
  activeLanding: LandingPage;
  loading: boolean;
  /** true cuando el backend respondio correctamente la ultima consulta. */
  tableReady: boolean;
  fetchActiveLanding: () => Promise<void>;
  /** Devuelve la encuesta que el backend dejo vinculada a la landing elegida. */
  setActiveLanding: (page: LandingPage) => Promise<ActiveSurvey>;
}

function injectDefaultTheme() {
  const root = document.documentElement;
  root.style.setProperty('--color-unidas-primary', '#6B21A8');
  root.style.setProperty('--color-unidas-secondary', '#9333EA');
  root.style.setProperty('--color-unidas-accent', '#F59E0B');
}

const normalize = (value: unknown): LandingPage =>
  value === 'component-4' ? 'component-4' : 'original';

export const useLandingStore = create<LandingState>((set) => ({
  activeLanding: 'original',
  loading: true,
  tableReady: false,

  // Lee el flag del backend propio (tabla 'settings'), la misma fuente de verdad
  // que 'active_survey'. Ya no depende de Supabase.
  fetchActiveLanding: async () => {
    injectDefaultTheme();
    try {
      const res = await fetch('/api/settings/active_landing');
      if (!res.ok) {
        set({ loading: false, tableReady: false });
        return;
      }
      const data = await res.json();
      set({ activeLanding: normalize(data?.value), loading: false, tableReady: true });
    } catch {
      // Red caida: conserva el valor actual y deja de bloquear el render.
      set({ loading: false, tableReady: false });
    }
  },

  setActiveLanding: async (page: LandingPage) => {
    const token = useAuthStore.getState().token;
    const res = await fetch('/api/admin/settings/active-landing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ value: page }),
    });

    if (!res.ok) {
      let message = 'No se pudo guardar la landing activa.';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch { /* la respuesta no era JSON */ }
      throw new Error(message);
    }

    const data = await res.json();
    const applied = normalize(data?.value);
    set({ activeLanding: applied, tableReady: true });
    return data?.active_survey === 'dos' ? 'dos' : 'uno';
  },
}));
