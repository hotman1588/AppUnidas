import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type LandingPage = 'original' | 'component-4';

interface LandingState {
  activeLanding: LandingPage;
  loading: boolean;
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

  fetchActiveLanding: async () => {
    injectDefaultTheme();
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'active_landing')
        .maybeSingle();
      set({ activeLanding: (data?.value as LandingPage) || 'original', loading: false });
    } catch {
      set({ activeLanding: 'original', loading: false });
    }
  },

  setActiveLanding: async (page: LandingPage) => {
    set({ loading: true });
    try {
      await supabase
        .from('app_settings')
        .upsert({ key: 'active_landing', value: page }, { onConflict: 'key' });
      set({ activeLanding: page, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
