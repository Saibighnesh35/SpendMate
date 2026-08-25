import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  const store = await cookies();
  return createSSRClient(url, key, { cookies: { getAll: () => store.getAll(), setAll: (updates) => { try { updates.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server components cannot write auth cookies. */ } } } });
}
