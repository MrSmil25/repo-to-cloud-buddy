import { createClient } from '@supabase/supabase-js';

// External Supabase project provided by the project owner.
// The publishable key is safe to ship in client code.
const SUPABASE_URL = 'https://uuajelzksfreocbmfsou.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kVJxw5z7yD2hS6jpJair1w_mPdV0mxU';

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New-format publishable keys are opaque strings, not bearer JWTs.
    if (headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
});
