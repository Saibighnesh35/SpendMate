import {
  createServerClient as createSSRClient,
} from "@supabase/ssr";

import { cookies } from "next/headers";

export async function createServerClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured."
    );
  }

  const cookieStore = await cookies();

  return createSSRClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              cookieStore.set(
                name,
                value,
                options
              );
            }
          );
        } catch {
          // Server Components may not be able to write cookies.
        }
      },
    },
  });
}
