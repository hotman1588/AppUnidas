import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../../supabase-config.json';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? supabaseConfig.supabaseUrl;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY ?? supabaseConfig.supabaseKey;

if (!supabaseUrl || supabaseUrl.includes('<YOUR_SUPABASE_PROJECT_REF>')) {
  throw new Error(
    'Invalid Supabase configuration: set VITE_SUPABASE_URL to your Supabase project URL in .env or supabase-config.json'
  );
}

if (!supabaseKey || supabaseKey.startsWith('sb_publishable_') && supabaseKey.length <= 50) {
  // Keep the publishable key, but warn if missing.
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

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
