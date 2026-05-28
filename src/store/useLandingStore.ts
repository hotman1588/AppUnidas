import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type LandingPage = 'original' | 'component-4';

interface LandingState {
  activeLanding: LandingPage;
  loading: boolean;
  tableReady: boolean;
  fetchActiveLanding: () => Promise<void>;
  setActiveLanding: (page: LandingPage) => Promise<void>;
}

function injectDefaultTheme() {
  const root = document.documentElement;
  root.style.setProperty('--color-unidas-primary', '#6B21A8');
  root.style.setProperty('--color-unidas-secondary', '#9333EA');
  root.style.setProperty('--color-unidas-accent', '#F59E0B');
}

export const useLandingStore = create<LandingState>((set) => ({
  activeLanding: 'original',
  loading: true,
  tableReady: false,

  fetchActiveLanding: async () => {
    injectDefaultTheme();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'active_landing')
      .maybeSingle();

    if (error) {
      // Table does not exist or network error — default to original
      set({ activeLanding: 'original', loading: false, tableReady: false });
      return;
    }

    set({
      activeLanding: (data?.value as LandingPage) || 'original',
      loading: false,
      tableReady: true,
    });
  },

  setActiveLanding: async (page: LandingPage) => {
    set({ loading: true });
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'active_landing', value: page }, { onConflict: 'key' });

    if (error) {
      set({ loading: false });
      throw new Error(error.message);
    }

    set({ activeLanding: page, loading: false, tableReady: true });
  },
}));
