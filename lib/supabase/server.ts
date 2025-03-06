import {
  createServerComponentClient,
  createServerActionClient,
} from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

// Para uso em Server Components
export function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

// Para uso em Server Actions (Route Handlers)
export function createActionClient() {
  return createServerActionClient<Database>({ cookies });
}

// Exporta uma instância pronta para uso em Server Components
export const supabase = createClient();
