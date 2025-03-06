import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { STORAGE_BUCKETS } from "@/lib/cloudflare/r2";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente tradicional - pode ser usado para operações não autenticadas
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com gerenciamento de autenticação integrado com Next.js
export const supabase = createClientComponentClient<Database>();

// Função para obter o token da sessão atual
export async function getAuthToken(): Promise<string | null> {
  try {
    // Tentar obter sessão do cliente
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Erro ao obter sessão:", error);
      return null;
    }

    if (data.session) {
      return data.session.access_token;
    }

    // Se não tivermos sessão, tentar verificar cookie do servidor (caso esteja executando em server component)
    try {
      // Esta parte será executada apenas no lado do servidor
      const cookieHeader = document.cookie;
      if (!cookieHeader) return null;

      // Extrair token do cookie se existir
      const tokenCookie = cookieHeader
        .split(";")
        .find((c) => c.trim().startsWith("sb-access-token="));
      if (tokenCookie) {
        return tokenCookie.split("=")[1].trim();
      }
    } catch (e) {
      // Provavelmente estamos em um ambiente de servidor, onde document não existe
      // Podemos ignorar este erro
    }

    return null;
  } catch (error) {
    console.error("Erro ao obter token de autenticação:", error);
    return null;
  }
}

export async function uploadImage(
  bucket: string,
  file: File,
  path?: string
): Promise<{ url: string; error: Error | null }> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Usando o cliente com autenticação para respeitar RLS
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro de upload:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { url: "", error: error as Error };
  }
}

export async function deleteImage(
  bucket: string,
  url: string
): Promise<{ error: Error | null }> {
  try {
    // Extrair o nome do arquivo da URL
    const urlParts = url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    // Usando o cliente com autenticação para respeitar RLS
    const { error } = await supabase.storage.from(bucket).remove([fileName]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { error: error as Error };
  }
}
