import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../../supabase-config.json';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? supabaseConfig.supabaseUrl;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY ?? supabaseConfig.supabaseKey;

if (!supabaseUrl || supabaseUrl.includes('<YOUR_SUPABASE_PROJECT_REF>')) {
  // No Supabase configuration detected – fall back to a mock client that uses localStorage.
  console.warn('Supabase not configured; using localStorage mock client');
  const mockClient = {
    from: () => ({
      select: async () => ({ data: [], error: null })
    }),
    auth: {
      signUp: async ({ email, password }) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existing = users.find((u) => u.email === email);
        if (existing) return { error: { message: 'User already exists' }, data: null };
        const newUser = { id: Date.now().toString(), email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return { data: newUser, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) return { error: { message: 'Invalid credentials' }, data: null };
        return { data: { user }, error: null };
      },
      signOut: async () => ({ error: null }),
      getUser: async () => {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        return { data: { user }, error: null };
      },
      onAuthStateChange: (callback) => {
        // No real auth state changes in mock – invoke once with stored user.
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        callback(user);
        return { data: {}, error: null };
      }
    }
  };
  // Ensure admin user exists in mock storage
  (() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some((u: any) => u.email === 'admin@example.com');
    if (!adminExists) {
      users.push({ id: '0', email: 'admin@example.com', password: '12345' });
      localStorage.setItem('users', JSON.stringify(users));
      // Set currentUser so getCurrentUser returns admin by default
      localStorage.setItem('currentUser', JSON.stringify({ id: '0', email: 'admin@example.com' }));
    }
  })();
  (globalThis as any)._supabaseClient = mockClient;
} else {
  if (!supabaseKey || (supabaseKey.startsWith('sb_publishable_') && supabaseKey.length <= 50)) {
    // Keep the publishable key, but warn if missing.
    console.warn('Supabase key may be missing or short');
  }
  // Initialize Supabase client
  (globalThis as any)._supabaseClient = createClient(supabaseUrl, supabaseKey);
}

const supabase = (globalThis as any)._supabaseClient;

// Connectivity check
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
    } else {
      console.log('Supabase connection established successfully');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Supabase connection test failed: client is offline.");
    }
  }
}

testConnection();

export { supabase };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};
