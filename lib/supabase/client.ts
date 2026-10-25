"use client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

let client: ReturnType<typeof createClient<Database>> | undefined;

export function createBrowserClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase público não configurado.");
  client = createClient<Database>(url, key);
  return client;
}
