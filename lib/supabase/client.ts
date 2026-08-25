import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function createServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
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
            ({
              name,
              value,
              options,
            }) => {
              cookieStore.set(
                name,
                value,
                options
              );
            }
          );
        } catch {
          /*
           * Server Components may not be able
           * to write cookies. Middleware/server
           * actions can handle refreshes when needed.
           */
        }
      },
    },
  });
}
