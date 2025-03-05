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
  const [activeTab, setActiveTab] = useState("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
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
        setProducts(data);
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
      try {
        setIsLoading(true);
        const response = await fetch(`/api/plans/${params.id}`);

        if (!response.ok) {
          throw new Error("Falha ao carregar plano");
        }

        const plan = await response.json();

        setFormData({
          name: plan.name,
          description: plan.description || "",
          price: plan.price,
          imageUrl: plan.imageUrl || "",
          fixedItems: plan.fixedItems || [],
          customizableRules: plan.customizableRules || {
            normal: { min: 0, max: 0 },
            exotic: { min: 0, max: 0 },
          },
        });
      } catch (error) {
        toast.error("Erro ao carregar plano");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [params.id]);

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

  const handleImageUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validar dados
      if (!formData.name || !formData.price) {
        throw new Error("Nome e preço são obrigatórios");
      }

      // Converter preço para número
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Preço deve ser um número positivo");
      }

      // Validar itens fixos
      for (const item of formData.fixedItems) {
        if (!item.productId || item.productId <= 0) {
          throw new Error("Selecione um produto válido para cada item fixo");
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(
            "Quantidade deve ser maior que zero para cada item fixo"
          );
        }
      }

      // Preparar dados para envio
      const payload = {
        name: formData.name,
        description: formData.description,
        price: priceValue,
        imageUrl: formData.imageUrl,
        fixedItems: formData.fixedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customizableRules: formData.customizableRules,
      };

      // Enviar para a API
      const response = await fetch(`/api/plans/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar plano");
      }

      toast.success("Plano atualizado com sucesso");
      router.push("/dashboard/admin/plans");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar plano"
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/plans/${params.id}`, {
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
    if (activeTab === "basic") setActiveTab("fixed");
    else if (activeTab === "fixed") setActiveTab("customizable");
  };

  const handlePrevTab = () => {
    if (activeTab === "customizable") setActiveTab("fixed");
    else if (activeTab === "fixed") setActiveTab("basic");
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar Plano: {formData.name}
          </h1>
        </div>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isSaving}
        >
          <Trash className="mr-2 h-4 w-4" />
          Excluir Plano
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="fixed">Itens Fixos</TabsTrigger>
            <TabsTrigger value="customizable">
              Itens Personalizáveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Plano</CardTitle>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Imagem do Plano</CardTitle>
                    <CardDescription>
                      Faça upload de uma imagem para representar o plano
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      onImageUploaded={handleImageUploaded}
                      defaultImage={formData.imageUrl}
                      bucket="plans"
                      label="Imagem do Plano"
                      description="Faça upload de uma imagem para representar o plano"
                    />
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
                <Button type="submit" disabled={isSaving}>
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
