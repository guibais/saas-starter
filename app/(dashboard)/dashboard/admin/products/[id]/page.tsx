"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { STORAGE_BUCKETS } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Product } from "@/lib/db/schema";

interface ProductFormData {
  name: string;
  description: string;
  productType: string;
  price: string;
  stockQuantity: string;
  unit: string;
  imageUrl: string;
  isAvailable: boolean;
}

// Função para buscar produto da API
const fetchProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`);

  if (!response.ok) {
    throw new Error("Falha ao carregar produto");
  }

  return response.json();
};

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const productId = params.id; // Usando diretamente, mas com uma variável separada
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    productType: "",
    price: "",
    stockQuantity: "",
    unit: "kg",
    imageUrl: "",
    isAvailable: true,
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await fetchProduct(productId);
        setFormData({
          name: product.name,
          description: product.description || "",
          productType: product.productType,
          price: product.price,
          stockQuantity: product.stockQuantity.toString(),
          unit: "kg", // Assumindo que a unidade é kg por padrão
          imageUrl: product.imageUrl || "",
          isAvailable: product.isAvailable,
        });
      } catch (error) {
        toast.error("Erro ao carregar produto");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          productType: formData.productType,
          price: parseFloat(formData.price),
          stockQuantity: parseInt(formData.stockQuantity),
          imageUrl: formData.imageUrl,
          isAvailable: formData.isAvailable,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar produto");
      }

      toast.success("Produto atualizado com sucesso");
      router.push("/dashboard/admin/products");
    } catch (error) {
      toast.error("Erro ao atualizar produto");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao excluir produto");
      }

      toast.success("Produto excluído com sucesso");
      router.push("/dashboard/admin/products");
    } catch (error) {
      toast.error("Erro ao excluir produto");
      console.error(error);
    } finally {
      setIsSaving(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/products")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Produto</h1>
        </div>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isSaving}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Produto
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome do Produto
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Maçã Gala"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Descrição
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descreva o produto..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="productType-select"
                    className="text-sm font-medium"
                  >
                    Tipo de Produto
                  </label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value) =>
                      handleSelectChange("productType", value)
                    }
                    required
                  >
                    <option value="">Selecione um tipo</option>
                    <option value="normal">Fruta Regular</option>
                    <option value="exotic">Fruta Exótica</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preço e Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Preço (R$)
                  </label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="stockQuantity"
                    className="text-sm font-medium"
                  >
                    Quantidade em Estoque
                  </label>
                  <Input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="unit-select" className="text-sm font-medium">
                    Unidade de Medida
                  </label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleSelectChange("unit", value)}
                    required
                  >
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="unidade">Unidade</option>
                    <option value="caixa">Caixa</option>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isAvailable: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium">
                    Produto disponível para venda
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imagem do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  defaultImage={formData.imageUrl}
                  bucket={STORAGE_BUCKETS.PRODUCTS}
                  label="Imagem do Produto"
                  description="Faça upload de uma imagem para o produto. Recomendamos uma imagem de alta qualidade com fundo branco."
                  aspectRatio={1}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/admin/products")}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir este produto? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
