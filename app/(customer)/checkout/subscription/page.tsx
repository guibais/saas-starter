// Esquema de validação para o formulário de checkout
const checkoutFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  address: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
  deliveryInstructions: z.string().optional(),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .optional(),
});

// ... existing code ...

// Verificar se o usuário está autenticado e se há um plano selecionado
useEffect(() => {
  setIsLoading(authLoading);

  if (!authLoading) {
    if (!selectedPlan) {
      toast.error("Nenhum plano selecionado");
      router.push("/plans");
      return;
    }

    if (!isCustomizationValid()) {
      toast.error("Sua personalização não está completa");
      router.push(`/plans/${selectedPlan.slug}`);
      return;
    }
  }
}, [authLoading, selectedPlan, router, isCustomizationValid]);

// ... existing code ...

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="seu@email.com" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <FormField
    control={form.control}
    name="phone"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Telefone</FormLabel>
        <FormControl>
          <Input placeholder="(00) 00000-0000" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>;

{
  !isAuthenticated && (
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Senha</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="Crie uma senha para sua conta"
              {...field}
            />
          </FormControl>
          <FormDescription>
            Crie uma senha para acessar sua conta e gerenciar sua assinatura.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

<FormField
  control={form.control}
  name="address"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Endereço</FormLabel>
      <FormControl>
        <Input placeholder="Rua, número, bairro, cidade, estado" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>;

// ... existing code ...
