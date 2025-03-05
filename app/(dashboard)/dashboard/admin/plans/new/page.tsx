"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Loader2, Plus, Minus, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

interface FixedItem {
  productId: number;
  quantity: number;
}

interface CustomizableRule {
  min: number;
  max: number;
}

interface Product {
  id: number;
  name: string;
  price: string;
  productType: string;
}

export default function NewPlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    fixedItems: [{ productId: 0, quantity: 1 }],
    customizableRules: {
      normal: { min: 3, max: 5 },
      exotic: { min: 1, max: 2 },
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
        // Verificar se a resposta contém a propriedade 'products' ou se é um array diretamente
        const productsData = data.products || data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        toast.error("Erro ao carregar produtos");
        console.error(error);
      }
    };

    fetchProducts();
  }, []);

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
    setFormData((prev) => ({
      ...prev,
      fixedItems: prev.fixedItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
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
    setIsSubmitting(true);

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
        customizableRules: [
          {
            productType: "normal",
            minQuantity: formData.customizableRules.normal.min,
            maxQuantity: formData.customizableRules.normal.max,
          },
          {
            productType: "exotic",
            minQuantity: formData.customizableRules.exotic.min,
            maxQuantity: formData.customizableRules.exotic.max,
          },
        ],
      };

      // Enviar para a API
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          JSON.stringify(errorData.error) || "Erro ao criar plano"
        );
      }

      toast.success("Plano criado com sucesso");
      router.push("/dashboard/admin/plans");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar plano"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/plans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Novo Plano de Assinatura
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="fixed">Itens Fixos</TabsTrigger>
            <TabsTrigger value="customizable">Itens Customizáveis</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Defina as informações principais do plano de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Plano</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ex: Plano Familiar"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Preço Mensal (R$)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 149.90"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descreva o plano..."
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Plano</Label>
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    bucket="plans"
                    label="Imagem do Plano"
                    description="Faça upload de uma imagem para representar o plano"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="button" onClick={handleNextTab}>
                  Próximo: Itens Fixos
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="fixed" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Itens Fixos</CardTitle>
                <CardDescription>
                  Defina os produtos que serão incluídos em todas as entregas
                  deste plano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.fixedItems.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum item fixo adicionado. Clique em "Adicionar Item" para
                    incluir produtos fixos no plano.
                  </div>
                ) : (
                  formData.fixedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 border p-4 rounded-md"
                    >
                      <div className="flex-1">
                        <Label
                          htmlFor={`product-${index}`}
                          className="mb-1 block"
                        >
                          Produto
                        </Label>
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
                        <Label
                          htmlFor={`quantity-${index}`}
                          className="mb-1 block"
                        >
                          Quantidade
                        </Label>
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
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  Voltar: Informações Básicas
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Próximo: Itens Customizáveis
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="customizable" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Itens Customizáveis</CardTitle>
                <CardDescription>
                  Configure as regras para itens que o cliente poderá escolher
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium mb-4">Frutas Normais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade Mínima</Label>
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
                      <Label>Quantidade Máxima</Label>
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
                      <Label>Quantidade Mínima</Label>
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
                      <Label>Quantidade Máxima</Label>
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
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  Voltar: Itens Fixos
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Plano
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
