"use client";

import { useState, useRef, useEffect } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { atom, useAtom } from "jotai";

// Atoms para gerenciar o estado do editor de recorte
export const cropperOpenAtom = atom<boolean>(false);
export const cropperImageSrcAtom = atom<string | null>(null);
export const cropperResultAtom = atom<File | null>(null);
export const cropperAspectRatioAtom = atom<number | undefined>(undefined);

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect || 16 / 9,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

interface ImageCropperProps {
  onCropComplete?: (file: File) => void;
  aspectRatio?: number;
}

export function ImageCropper({
  onCropComplete,
  aspectRatio,
}: ImageCropperProps) {
  const [isOpen, setIsOpen] = useAtom(cropperOpenAtom);
  const [imageSrc, setImageSrc] = useAtom(cropperImageSrcAtom);
  const [cropResult, setCropResult] = useAtom(cropperResultAtom);
  const [cropAspectRatio, setCropAspectRatio] = useAtom(cropperAspectRatioAtom);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Inicializa o aspect ratio
  useEffect(() => {
    if (aspectRatio) {
      setCropAspectRatio(aspectRatio);
    }
  }, [aspectRatio, setCropAspectRatio]);

  // Quando a imagem é carregada, configura o recorte inicial
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, cropAspectRatio));
  }

  // Gera a imagem recortada quando o recorte é concluído
  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = "high";

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    }
  }, [completedCrop]);

  // Converte o canvas para um arquivo
  const generateCroppedImage = () => {
    if (!previewCanvasRef.current || !completedCrop) {
      return;
    }

    const canvas = previewCanvasRef.current;

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty");
        return;
      }

      // Cria um novo arquivo a partir do blob
      const croppedFile = new File([blob], "cropped-image.png", {
        type: "image/png",
      });

      setCropResult(croppedFile);

      if (onCropComplete) {
        onCropComplete(croppedFile);
      }

      setIsOpen(false);
    }, "image/png");
  };

  const handleClose = () => {
    setIsOpen(false);
    setImageSrc(null);
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Recortar Imagem</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center space-y-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={cropAspectRatio}
            className="max-h-[400px] max-w-full"
          >
            <img
              ref={imgRef}
              alt="Imagem para recorte"
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-h-[400px] max-w-full"
            />
          </ReactCrop>

          <canvas ref={previewCanvasRef} className="hidden" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={generateCroppedImage}>Aplicar Recorte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
