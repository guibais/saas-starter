"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Trash, Plus, Minus, Save } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import React, { use } from "react";
import { uploadImage, STORAGE_BUCKETS } from "@/lib/cloudflare/r2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface FixedItem {
  id?: number;
  productId: number;
  quantity: number;
  productName?: string;
  productPrice?: string;
  productType?: string;
}

interface CustomizableRule {
  min: number;
  max: number;
}

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  fixedItems: FixedItem[];
  customizableRules: {
    normal: CustomizableRule;
    exotic: CustomizableRule;
  };
}

interface Product {
  id: number;
  name: string;
  price: string;
  productType: string;
}

export default function EditPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const unwrappedParams = use(params as any) as { id: string };
  const planId = unwrappedParams.id;
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    fixedItems: [],
    customizableRules: {
      normal: { min: 0, max: 0 },
      exotic: { min: 0, max: 0 },
    },
  });

  // Carregar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Falha ao carregar produtos");
        }
        const data = await response.json();
        const productsData = data.products || data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        toast.error("Erro ao carregar produtos");
        console.error(error);
      }
    };

    fetchProducts();
  }, []);

  // Carregar dados do plano
  useEffect(() => {
    const loadPlan = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/plans/${planId}`);
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do plano");
        }
        const planData = await response.json();

        // Definir os dados do plano no formulário
        setFormData({
          name: planData.name,
          description: planData.description || "",
          price: planData.price,
          imageUrl: planData.imageUrl || "", // Garantir que a URL da imagem seja carregada corretamente
          fixedItems: planData.fixedItems.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
          customizableRules: planData.customizableRules,
        });
      } catch (error) {
        console.error("Erro ao carregar plano:", error);
        toast.error("Erro ao carregar dados do plano");
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [planId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFixedItem = () => {
    setFormData((prev) => ({
      ...prev,
      fixedItems: [...prev.fixedItems, { productId: 0, quantity: 1 }],
    }));
  };

  const handleRemoveFixedItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fixedItems: prev.fixedItems.filter((_, i) => i !== index),
    }));
  };

  const handleFixedItemChange = (
    index: number,
    field: "productId" | "quantity",
    value: number
  ) => {
    setFormData((prev) => {
      const updatedItems = [...prev.fixedItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
      return {
        ...prev,
        fixedItems: updatedItems,
      };
    });
  };

  const handleCustomizableRuleChange = (
    type: "normal" | "exotic",
    field: "min" | "max",
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      customizableRules: {
        ...prev.customizableRules,
        [type]: {
          ...prev.customizableRules[type],
          [field]: value,
        },
      },
    }));
  };

  const handleImageUploaded = async (imageUrl: string) => {
    console.log("Imagem carregada:", imageUrl);
    setFormData((prev) => ({ ...prev, imageUrl }));
    setIsImageUploading(false);

    // Verificar se a URL da imagem é válida com uma requisição
    try {
      const response = await fetch(imageUrl, { method: "HEAD" });
      if (!response.ok) {
        console.error(
          "URL da imagem pode não ser acessível:",
          response.status,
          response.statusText
        );
        toast.warning(
          "A imagem foi carregada, mas pode haver problemas de permissão. Verifique após salvar."
        );
      }
    } catch (error) {
      console.error("Erro ao verificar URL da imagem:", error);
    }
  };

  const handleImageUploadStarted = () => {
    setIsImageUploading(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se existe um upload em andamento
    if (isImageUploading) {
      toast.error("Aguarde o upload da imagem ser concluído antes de salvar.");
      return;
    }

    // Validar os dados do formulário
    if (!formData.name) {
      toast.error("Nome do plano é obrigatório");
      return;
    }

    if (!formData.price || parseFloat(String(formData.price)) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    // Validar itens fixos
    if (
      formData.fixedItems.some((item) => !item.productId || item.quantity <= 0)
    ) {
      toast.error(
        "Todos os itens fixos devem ter um produto selecionado e quantidade maior que zero"
      );
      return;
    }

    try {
      setIsSaving(true);

      // Preparar payload
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl,
        fixedItems: formData.fixedItems,
        customizableRules: formData.customizableRules,
      };

      // Se a imagem estiver com a URL completa do R2,
      // vamos armazenar apenas o caminho relativo para o backend usar o client do lado do servidor
      if (
        payload.imageUrl &&
        payload.imageUrl.includes(
          process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""
        ) &&
        payload.imageUrl.includes("/")
      ) {
        try {
          // Extrair o caminho relativo da URL do R2
          const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
          const urlWithoutBase = payload.imageUrl.replace(`${baseUrl}/`, "");
          const pathParts = urlWithoutBase.split("/");

          if (pathParts.length > 1) {
            const bucket = pathParts[0];
            const filePath = pathParts.slice(1).join("/");

            // Adicionar metadados para o backend saber que precisa reconstruir a URL
            payload.imageUrl = `__r2_storage__:${bucket}:${filePath}`;
            console.log(
              "URL da imagem convertida para formato de storage:",
              payload.imageUrl
            );
          }
        } catch (err) {
          console.error("Erro ao processar URL da imagem:", err);
          // Manter a URL original em caso de erro
        }
      }

      // Enviar requisição
      console.log("Enviando payload:", JSON.stringify(payload, null, 2));
      const response = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Verificar resposta
      if (response.ok) {
        toast.success("Plano atualizado com sucesso!");
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(
          `Erro ao salvar plano: ${errorData.error || "Erro desconhecido"}`
        );
      }
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      toast.error("Ocorreu um erro ao salvar o plano");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir plano");
      }

      toast.success("Plano excluído com sucesso");
      router.push("/dashboard/admin/plans");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir plano"
      );
      console.error(error);
    } finally {
      setIsSaving(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleNextTab = () => {
    if (activeTab === "info") setActiveTab("fixed");
    else if (activeTab === "fixed") setActiveTab("customizable");
  };

  const handlePrevTab = () => {
    if (activeTab === "customizable") setActiveTab("fixed");
    else if (activeTab === "fixed") setActiveTab("info");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando plano...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Plano</h1>
          <p className="text-muted-foreground">
            Atualize as informações do plano
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/plans")}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Excluir
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações Básicas</TabsTrigger>
            <TabsTrigger value="fixed">Itens Fixos</TabsTrigger>
            <TabsTrigger value="customizable">
              Itens Personalizáveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Informe os detalhes principais do plano
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Nome do Plano
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: Plano Básico"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Descrição
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descreva o plano..."
                        rows={4}
                      />
                    </div>

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
                        placeholder="Ex: 99.90"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Imagem do Plano</CardTitle>
                    <CardDescription>
                      Faça upload de uma imagem para representar este plano
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      onImageUploaded={handleImageUploaded}
                      onUploadStarted={handleImageUploadStarted}
                      defaultImage={formData.imageUrl}
                      folder={STORAGE_BUCKETS.PLANS}
                      label="Imagem do Plano"
                      description="Uma imagem atraente para mostrar o plano aos clientes"
                      aspectRatio={16 / 9}
                    />
                    {isImageUploading && (
                      <p className="mt-2 text-sm text-orange-500">
                        Upload em andamento, aguarde antes de salvar...
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <div></div>
              <Button type="button" onClick={handleNextTab}>
                Próximo: Itens Fixos
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="fixed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Itens Fixos do Plano</CardTitle>
                <CardDescription>
                  Defina os produtos que serão incluídos em todas as entregas
                  deste plano
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.fixedItems.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhum item fixo adicionado. Clique em "Adicionar Item"
                      para incluir produtos fixos no plano.
                    </div>
                  ) : (
                    formData.fixedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 border p-4 rounded-md"
                      >
                        <div className="flex-1">
                          <label
                            htmlFor={`product-${index}`}
                            className="text-sm font-medium mb-1 block"
                          >
                            Produto
                          </label>
                          <Select
                            value={item.productId.toString()}
                            onValueChange={(value) =>
                              handleFixedItemChange(
                                index,
                                "productId",
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id.toString()}
                                >
                                  {product.name} - R${" "}
                                  {parseFloat(product.price).toFixed(2)} (
                                  {product.productType === "normal"
                                    ? "Normal"
                                    : "Exótico"}
                                  )
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-32">
                          <label
                            htmlFor={`quantity-${index}`}
                            className="text-sm font-medium mb-1 block"
                          >
                            Quantidade
                          </label>
                          <div className="flex items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() =>
                                handleFixedItemChange(
                                  index,
                                  "quantity",
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="1"
                              className="h-9 mx-1 text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                handleFixedItemChange(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() =>
                                handleFixedItemChange(
                                  index,
                                  "quantity",
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="mt-6"
                          onClick={() => handleRemoveFixedItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddFixedItem}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  Voltar: Informações Básicas
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Próximo: Itens Personalizáveis
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="customizable" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Itens Personalizáveis</CardTitle>
                <CardDescription>
                  Configure as regras para itens que o cliente poderá escolher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Frutas Normais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Quantidade Mínima
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.customizableRules.normal.min}
                          onChange={(e) =>
                            handleCustomizableRuleChange(
                              "normal",
                              "min",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Quantidade Máxima
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.customizableRules.normal.max}
                          onChange={(e) =>
                            handleCustomizableRuleChange(
                              "normal",
                              "max",
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Frutas Exóticas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Quantidade Mínima
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.customizableRules.exotic.min}
                          onChange={(e) =>
                            handleCustomizableRuleChange(
                              "exotic",
                              "min",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Quantidade Máxima
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.customizableRules.exotic.max}
                          onChange={(e) =>
                            handleCustomizableRuleChange(
                              "exotic",
                              "max",
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  Voltar: Itens Fixos
                </Button>
                <Button type="submit" disabled={isSaving || isImageUploading}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Plano
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Tem certeza que deseja excluir este plano? Esta ação não pode ser
            desfeita.
          </DialogDescription>
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
