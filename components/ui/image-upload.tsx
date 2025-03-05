"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage, STORAGE_BUCKETS } from "@/lib/supabase/client";
import { atom, useAtom } from "jotai";
import { Upload, X, Image as ImageIcon, Crop as CropIcon } from "lucide-react";
import {
  ImageCropper,
  cropperOpenAtom,
  cropperImageSrcAtom,
  cropperResultAtom,
} from "./image-cropper";

// Atoms para gerenciar o estado do editor de imagem
export const imageFileAtom = atom<File | null>(null);
export const imagePreviewAtom = atom<string | null>(null);
export const imageUrlAtom = atom<string | null>(null);
export const imageLoadingAtom = atom<boolean>(false);
export const imageErrorAtom = atom<string | null>(null);

interface ImageUploadProps {
  onImageUploaded?: (url: string) => void;
  defaultImage?: string;
  bucket?: string;
  label?: string;
  description?: string;
  aspectRatio?: number;
  enableCropping?: boolean;
}

export function ImageUpload({
  onImageUploaded,
  defaultImage = "",
  bucket = STORAGE_BUCKETS.PRODUCTS,
  label = "Imagem",
  description = "Faça upload de uma imagem para o produto",
  aspectRatio,
  enableCropping = true,
}: ImageUploadProps) {
  const [imageFile, setImageFile] = useAtom(imageFileAtom);
  const [imagePreview, setImagePreview] = useAtom(imagePreviewAtom);
  const [imageUrl, setImageUrl] = useAtom(imageUrlAtom);
  const [isLoading, setIsLoading] = useAtom(imageLoadingAtom);
  const [error, setError] = useAtom(imageErrorAtom);

  const [cropperOpen, setCropperOpen] = useAtom(cropperOpenAtom);
  const [cropperImageSrc, setCropperImageSrc] = useAtom(cropperImageSrcAtom);
  const [cropperResult, setCropperResult] = useAtom(cropperResultAtom);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa o preview com a imagem padrão, se fornecida
  useState(() => {
    if (defaultImage && !imagePreview) {
      setImagePreview(defaultImage);
      setImageUrl(defaultImage);
    }
  });

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
      }
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleUpload = async () => {
    if (!imageFile) {
      setError("Selecione uma imagem para fazer upload.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { url, error } = await uploadImage(bucket, imageFile);

      if (error) {
        throw error;
      }

      setImageUrl(url);
      if (onImageUploaded) {
        onImageUploaded(url);
      }
    } catch (err) {
      setError("Erro ao fazer upload da imagem. Tente novamente.");
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="max-w-md"
        />
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!imageFile || isLoading}
          className="sm:w-auto"
        >
          {isLoading ? "Enviando..." : "Enviar Imagem"}
          {!isLoading && <Upload className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {imageUrl && !error && (
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
