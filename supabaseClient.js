import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://hszukdjgqrjkbuxcjbud.supabase.co';
const supabaseKey = 'sb_publishable_bEPx2O2FqXCHvpv13XX2fw_DDw2FjOf'; // This is the anon public key, safe to expose in frontend
export const supabase = createClient(supabaseUrl, supabaseKey);