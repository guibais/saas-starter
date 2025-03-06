import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuração para o cliente R2 (compatível com S3)
// Estas variáveis devem ser usadas APENAS no servidor, nunca expor no cliente
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// Nome do bucket principal
export const MAIN_BUCKET = "tudo-fresco";

// Pastas dentro do bucket principal
export const STORAGE_BUCKETS = {
  PRODUCTS: "products",
  PLANS: "plans",
  PROFILES: "profiles",
} as const;

// Cliente do R2 - Configuração seguindo práticas recomendadas para Cloudflare R2 com AWS SDK v3
export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  // Configurações específicas para garantir compatibilidade com Cloudflare R2
  forcePathStyle: true,
});

/**
 * Formata URL concatenando caminhos sem duplicar barras
 */
function formatUrl(base: string, path: string): string {
  console.log("base", base);
  console.log("path", path);
  if (!base) return path;

  // Verificar se o caminho já começa com a base URL (evitar duplicação)
  if (path.startsWith(base) || path.startsWith("http")) {
    return path;
  }

  // Remover barras extras
  const baseWithoutTrailingSlash = base.endsWith("/")
    ? base.slice(0, -1)
    : base;
  const pathWithoutLeadingSlash = path.startsWith("/") ? path.slice(1) : path;

  return `${baseWithoutTrailingSlash}/${pathWithoutLeadingSlash}`;
}

/**
 * Faz upload de uma imagem para o R2
 * @param folder Nome da pasta dentro do bucket principal
 * @param file Arquivo para upload
 * @param path Caminho opcional dentro da pasta
 * @returns URL pública da imagem ou erro
 */
export async function uploadImage(
  folder: string,
  file: File,
  path?: string
): Promise<{ url: string; error: Error | null }> {
  try {
    // Verificar se as configurações R2 estão disponíveis
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error(
        "Erro: Configuração R2 incompleta. Verifique as variáveis de ambiente."
      );
      console.error({ R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY });
      throw new Error("Configuração R2 incompleta");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}_${Date.now()}.${fileExt}`;

    // Construir o caminho dentro do bucket principal
    const folderPath = folder ? `${folder}/` : "";
    const subPath = path ? `${path}/` : "";
    const filePath = `${folderPath}${subPath}${fileName}`;

    console.log("Iniciando upload para R2:");
    console.log("- Bucket:", MAIN_BUCKET);
    console.log("- Pasta:", folder);
    console.log("- Caminho do arquivo:", filePath);
    console.log("- Endpoint R2:", r2Client.config.endpoint);

    const fileBuffer = await file.arrayBuffer();

    try {
      // Upload para o R2 (usando o bucket principal)
      const uploadCommand = new PutObjectCommand({
        Bucket: MAIN_BUCKET,
        Key: filePath,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        CacheControl: "max-age=3600",
      });

      const uploadResponse = await r2Client.send(uploadCommand);
      console.log("Upload bem-sucedido:", uploadResponse);

      // Gerar URL pública
      let publicUrl = "";

      if (R2_PUBLIC_URL) {
        // Usar a URL pública configurada
        publicUrl = formatUrl(R2_PUBLIC_URL, filePath);
      } else if (R2_ACCOUNT_ID) {
        // Fallback para URL R2 padrão com o bucket
        publicUrl = formatUrl(
          `https://${MAIN_BUCKET}.${R2_ACCOUNT_ID}.r2.dev`,
          filePath
        );
      } else {
        throw new Error("R2_PUBLIC_URL e R2_ACCOUNT_ID não configurados");
      }

      console.log("- URL pública gerada:", publicUrl);

      return { url: publicUrl, error: null };
    } catch (uploadError) {
      console.error("Erro detalhado no upload:", uploadError);

      // Retornar um identificador especial para facilitar identificação no frontend
      return {
        url: `__r2_storage__:${MAIN_BUCKET}:${filePath}`,
        error: uploadError as Error,
      };
    }
  } catch (error) {
    console.error("Erro ao fazer upload de imagem:", error);

    // Em caso de erro, ainda retornamos um identificador para possível recuperação posterior
    return {
      url: `__r2_error__:${
        error instanceof Error ? error.message : String(error)
      }`,
      error: error as Error,
    };
  }
}

/**
 * Exclui uma imagem do R2
 * @param folder Nome da pasta dentro do bucket principal
 * @param url URL da imagem ou caminho do arquivo
 * @returns Objeto com informação de erro (null se sucesso)
 */
export async function deleteImage(
  folder: string,
  url: string
): Promise<{ error: Error | null }> {
  try {
    // Extrair o caminho do arquivo da URL
    let key = url;

    if (url.startsWith(R2_PUBLIC_URL)) {
      // Se for uma URL completa, extrair apenas o caminho relativo
      key = url.replace(R2_PUBLIC_URL, "").replace(/^\/+/, "");
    } else if (url.includes("/")) {
      // Se contiver /, assume que é um caminho relativo
      const pathParts = url.split("/");
      // Verificar se o primeiro elemento é o nome da pasta
      if (pathParts[0] === folder) {
        key = url; // Manter o caminho completo incluindo a pasta
      } else {
        // Adicionar a pasta se não estiver incluída
        key = formatUrl(folder, url);
      }
    } else {
      // Se for só um nome de arquivo, adicionar a pasta
      key = formatUrl(folder, url);
    }

    // Excluir do R2
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: MAIN_BUCKET,
        Key: key,
      })
    );

    return { error: null };
  } catch (error) {
    console.error("Erro ao excluir imagem:", error);
    return { error: error as Error };
  }
}

/**
 * Gera uma URL pré-assinada para visualização temporária de um objeto
 * @param folder Nome da pasta dentro do bucket principal
 * @param key Chave (caminho) do objeto
 * @param expiresIn Tempo de expiração em segundos (padrão: 3600)
 * @returns URL pré-assinada
 */
export async function getSignedImageUrl(
  folder: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  // Construir o caminho completo
  const fullKey = key.startsWith(folder) ? key : formatUrl(folder, key);

  const command = new GetObjectCommand({
    Bucket: MAIN_BUCKET,
    Key: fullKey,
  });

  try {
    // Gerar URL pré-assinada
    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL pré-assinada:", error);
    return "";
  }
}

// Função para verificar a conexão com o R2
export async function testR2Connection() {
  try {
    // Verificar se as configurações estão presentes
    const configStatus = {
      accountId: !!R2_ACCOUNT_ID,
      accessKey: !!R2_ACCESS_KEY_ID,
      secretKey: !!R2_SECRET_ACCESS_KEY,
      publicUrl: !!R2_PUBLIC_URL,
    };

    console.log("\n===== Diagnóstico de Configuração do R2 =====");
    console.log(
      `CLOUDFLARE_ACCOUNT_ID: ${
        configStatus.accountId ? "Configurado ✓" : "NÃO CONFIGURADO ✗"
      }`
    );
    console.log(
      `R2_ACCESS_KEY_ID: ${
        configStatus.accessKey ? "Configurado ✓" : "NÃO CONFIGURADO ✗"
      }`
    );
    console.log(
      `R2_SECRET_ACCESS_KEY: ${
        configStatus.secretKey ? "Configurado ✓" : "NÃO CONFIGURADO ✗"
      }`
    );
    console.log(
      `R2_PUBLIC_URL: ${
        configStatus.publicUrl ? "Configurado ✓" : "NÃO CONFIGURADO ✗"
      }`
    );
    console.log(`Bucket principal: ${MAIN_BUCKET}`);

    if (
      !configStatus.accountId ||
      !configStatus.accessKey ||
      !configStatus.secretKey
    ) {
      console.error(
        "❌ Configuração R2 incompleta. Verifique as variáveis de ambiente."
      );
      return {
        success: false,
        error:
          "Configuração R2 incompleta. Verifique as variáveis de ambiente.",
        configStatus,
        helpMessage:
          "Para resolver, verifique seu arquivo .env e reinicie o servidor. As variáveis CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY são obrigatórias.",
      };
    }

    console.log("\n===== Testando Conexão com o R2 =====");
    const endpoint =
      r2Client.config.endpoint?.toString() || "Endpoint não configurado";
    console.log("Endpoint utilizado:", endpoint);

    try {
      // Teste simples - Listar buckets ou verificar existência do bucket principal
      try {
        const listBucketsCmd = {
          Bucket: MAIN_BUCKET,
          MaxKeys: 1,
        };

        const testResult = await r2Client.send(
          new PutObjectCommand({
            Bucket: MAIN_BUCKET,
            Key: "_test/connection-test.txt",
            Body: Buffer.from("Teste de conexão com R2"),
            ContentType: "text/plain",
          })
        );

        console.log("✅ Teste de upload bem-sucedido:", testResult);

        // Verificar a formação de URLs públicas
        console.log("\n===== Teste de URLs Públicas =====");

        if (R2_PUBLIC_URL) {
          const testPath = "test-connection/example.jpg";
          const publicUrl = formatUrl(R2_PUBLIC_URL, testPath);
          console.log("URL pública de exemplo:", publicUrl);
        } else {
          console.log("⚠️ R2_PUBLIC_URL não configurado, usando fallback");
          const fallbackUrl = formatUrl(
            `https://${MAIN_BUCKET}.${R2_ACCOUNT_ID}.r2.dev`,
            "test/example.jpg"
          );
          console.log("URL fallback:", fallbackUrl);
        }

        return {
          success: true,
          endpoint,
          mainBucket: MAIN_BUCKET,
          configStatus,
          message: "Conexão com R2 estabelecida com sucesso!",
        };
      } catch (bucketError) {
        console.error("❌ Erro ao acessar bucket:", bucketError);
        return {
          success: false,
          endpoint,
          error:
            "Erro ao acessar bucket. Verifique se o bucket existe e se as permissões estão corretas.",
          details:
            bucketError instanceof Error
              ? bucketError.message
              : String(bucketError),
          configStatus,
        };
      }
    } catch (connectionError) {
      console.error("❌ Erro na conexão com o serviço R2:", connectionError);
      return {
        success: false,
        endpoint,
        error:
          "Erro ao conectar ao serviço R2. Verifique suas credenciais e configurações de rede.",
        details:
          connectionError instanceof Error
            ? connectionError.message
            : String(connectionError),
        configStatus,
      };
    }
  } catch (error) {
    console.error("❌ Erro durante o teste de conexão R2:", error);
    return {
      success: false,
      error: "Erro inesperado durante o teste de conexão.",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
