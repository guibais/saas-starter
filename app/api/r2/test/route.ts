import { NextRequest, NextResponse } from "next/server";
import {
  testR2Connection,
  r2Client,
  STORAGE_BUCKETS,
  MAIN_BUCKET,
} from "@/lib/cloudflare/r2";
import { getSession } from "@/lib/auth/session";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Testar conexão básica com o R2
    const connectionTest = await testR2Connection();

    // Tentar listar buckets via SDK
    let bucketsResult = null;
    let error = null;

    try {
      const command = new ListBucketsCommand({});
      const result = await r2Client.send(command);
      bucketsResult = result.Buckets?.map((b) => b.Name);
    } catch (err) {
      error = err;
      console.error("Erro ao listar buckets:", err);
    }

    // Verificar variáveis de ambiente
    const envVars = {
      accountIdConfigured: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      accessKeyConfigured: !!process.env.R2_ACCESS_KEY_ID,
      secretKeyConfigured: !!process.env.R2_SECRET_ACCESS_KEY,
      publicUrlConfigured: !!process.env.R2_PUBLIC_URL,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID?.substring(0, 8) + "...",
      publicUrl: process.env.R2_PUBLIC_URL,
    };

    return NextResponse.json({
      connectionTest,
      buckets: bucketsResult,
      mainBucket: MAIN_BUCKET,
      folders: STORAGE_BUCKETS,
      error: error ? String(error) : null,
      envVars,
    });
  } catch (error) {
    console.error("Erro ao testar conexão com R2:", error);
    return NextResponse.json(
      { error: "Erro ao testar conexão com R2" },
      { status: 500 }
    );
  }
}
