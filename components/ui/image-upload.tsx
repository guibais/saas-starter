"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STORAGE_BUCKETS } from "@/lib/cloudflare/r2";
import { atom, useAtom } from "jotai";
import { Upload, X, Image as ImageIcon, Crop as CropIcon } from "lucide-react";
import {
  ImageCropper,
  cropperOpenAtom,
  cropperImageSrcAtom,
  cropperResultAtom,
} from "./image-cropper";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Atoms para gerenciar o estado do editor de imagem
export const imageFileAtom = atom<File | null>(null);
export const imagePreviewAtom = atom<string | null>(null);
export const imageUrlAtom = atom<string | null>(null);
export const imageLoadingAtom = atom<boolean>(false);
export const imageErrorAtom = atom<string | null>(null);

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void;
  onUploadStarted?: () => void;
  defaultImage?: string;
  folder?: string;
  label?: string;
  description?: string;
  aspectRatio?: number;
  enableCropping?: boolean;
}

export function ImageUpload({
  onImageUploaded,
  onUploadStarted,
  defaultImage = "",
  folder = STORAGE_BUCKETS.PRODUCTS,
  label = "Imagem",
  description = "Faça upload de uma imagem para o produto",
  aspectRatio,
  enableCropping = true,
}: ImageUploadProps) {
  const [imageFile, setImageFile] = useAtom(imageFileAtom);
  const [imagePreview, setImagePreview] = useAtom(imagePreviewAtom);
  const [imageUrl, setImageUrl] = useAtom(imageUrlAtom);
  const [isUploading, setIsUploading] = useAtom(imageLoadingAtom);
  const [error, setError] = useAtom(imageErrorAtom);

  const [cropperOpen, setCropperOpen] = useAtom(cropperOpenAtom);
  const [cropperImageSrc, setCropperImageSrc] = useAtom(cropperImageSrcAtom);
  const [cropperResult, setCropperResult] = useAtom(cropperResultAtom);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa o preview com a imagem padrão, se fornecida
  useEffect(() => {
    console.log("Inicializando imagem padrão:", defaultImage);
    if (defaultImage && !imagePreview) {
      setImageUrl(defaultImage);
      setImagePreview(defaultImage);
    }
  }, [defaultImage, imagePreview, setImagePreview, setImageUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError("O arquivo selecionado não é uma imagem válida.");
      return;
    }

    // Validar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setError(null);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const previewUrl = event.target.result as string;

        if (enableCropping) {
          // Abrir o editor de recorte
          setCropperImageSrc(previewUrl);
          setCropperOpen(true);
        } else {
          // Usar a imagem diretamente
          setImageFile(file);
          setImagePreview(previewUrl);

          // Iniciar upload automaticamente
          uploadImageFile(file);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Quando o recorte é concluído
  const handleCropComplete = (croppedFile: File) => {
    setImageFile(croppedFile);

    // Criar preview da imagem recortada
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);

        // Iniciar upload automaticamente após recorte
        uploadImageFile(croppedFile);
      }
    };
    reader.readAsDataURL(croppedFile);
  };

  // Função para processar o upload da imagem
  const uploadImageFile = async (file: File) => {
    try {
      setIsUploading(true);
      onUploadStarted?.();

      // Criar FormData para envio
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // Enviar para a API de upload (servidor)
      const response = await fetch("/api/r2/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erro na resposta da API:", data.error);
        toast.error("Falha ao fazer upload da imagem. Tente novamente.");
        setIsUploading(false);
        return;
      }

      const { url } = data;

      if (url.startsWith("__r2_error__")) {
        console.error("Erro no R2:", url);
        toast.error(
          "Falha na conexão com o servidor de armazenamento. Tente novamente mais tarde."
        );
        setIsUploading(false);
        return;
      }

      // Verificar se é uma URL especial de armazenamento
      if (url.startsWith("__r2_storage__")) {
        // Mostrar mensagem informando que a imagem será processada posteriormente
        toast.success("Imagem enviada, mas será processada em segundo plano.");
        console.log("URL especial de armazenamento:", url);
      } else {
        // URL normal, mostrar preview
        setImagePreview(url);
      }

      // Atualizar estados
      setImageUrl(url);
      setIsUploading(false);
      onImageUploaded?.(url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Falha ao fazer upload da imagem. Tente novamente.");
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) {
      setError("Selecione uma imagem para fazer upload.");
      return;
    }

    await uploadImageFile(imageFile);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onImageUploaded) {
      onImageUploaded("");
    }
  };

  const handleOpenCropper = () => {
    if (imagePreview) {
      setCropperImageSrc(imagePreview);
      setCropperOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="image-upload">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {imagePreview ? (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-border">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            {enableCropping && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleOpenCropper}
              >
                <CropIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-md flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
          <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arraste e solte ou clique para selecionar
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="max-w-md"
        />

        {isUploading && (
          <div className="flex items-center text-sm text-amber-500">
            <Upload className="animate-pulse mr-2 h-4 w-4" />
            Enviando imagem... Por favor, aguarde.
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {imageUrl && !error && !isUploading && (
        <p className="text-sm text-green-600">Imagem enviada com sucesso!</p>
      )}

      {/* Componente de recorte */}
      <ImageCropper
        onCropComplete={handleCropComplete}
        aspectRatio={aspectRatio}
      />
    </div>
  );
}
