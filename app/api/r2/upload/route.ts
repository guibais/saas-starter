import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadImage } from "@/lib/cloudflare/r2";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (opcional, remova ou ajuste conforme necessário)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter dados do formulário multipart
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const path = formData.get("path") as string | undefined;

    if (!file || !folder) {
      return NextResponse.json(
        { error: "Arquivo ou pasta não fornecidos" },
        { status: 400 }
      );
    }

    console.log(`Recebendo upload para pasta ${folder}:`, {
      fileName: file.name,
      size: file.size,
      type: file.type,
      path: path || "raiz",
    });

    // Usar a função uploadImage do servidor
    const { url, error } = await uploadImage(folder, file, path);

    if (error) {
      console.error("Erro ao fazer upload:", error);
      return NextResponse.json(
        { error: "Falha ao fazer upload da imagem" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erro na rota de upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Aumentar o limite de tamanho do corpo da requisição
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
