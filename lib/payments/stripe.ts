import Stripe from "stripe";
import { redirect } from "next/navigation";
import { Team } from "@/lib/db/schema";
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription,
} from "@/lib/db/queries";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

// Função para criar sessão de checkout para assinaturas
export async function createSubscriptionCheckoutSession({
  team,
  priceId,
  planId,
  customItems = [],
}: {
  team: Team | null;
  priceId: string;
  planId: number;
  customItems?: Array<{ productId: number; quantity: number }>;
}) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/subscription?canceled=true`,
      metadata: {
        planId: planId.toString(),
        customItems: JSON.stringify(customItems),
      },
    });

    return session;
  } catch (error) {
    console.error("Erro ao criar sessão de checkout para assinatura:", error);
    throw error;
  }
}

// Função para criar sessão de checkout para compras únicas
export async function createOneTimeCheckoutSession({
  userId,
  cartItems,
  customerEmail,
}: {
  userId: number;
  cartItems: Array<{ price: string; quantity: number }>;
  customerEmail?: string;
}) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cartItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        userId: userId.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    throw error;
  }
}

// Função para gerenciar portal do cliente
export async function createCustomerPortalSession(team: Team) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Verificar se o time tem um customerId do Stripe
  if (!team.stripeCustomerId) {
    throw new Error("Time sem ID de cliente do Stripe");
  }

  // Criar configuração do portal
  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Tudo Fresco - Gerenciamento de Assinatura",
    },
    features: {
      subscription_update: {
        enabled: true,
        proration_behavior: "create_prorations",
        default_allowed_updates: ["price"],
      },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
      },
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address", "shipping", "phone", "tax_id"],
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
    },
  });

  // Criar sessão do portal
  const session = await stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    configuration: configuration.id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
  });

  return session;
}

// Função para atualizar assinatura (upgrade/downgrade)
export async function updateSubscription({
  subscriptionId,
  newPriceId,
}: {
  subscriptionId: string;
  newPriceId: string;
}) {
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0]
          .id,
        price: newPriceId,
      },
    ],
  });
}

// Função para pausar assinatura
export async function pauseSubscription(subscriptionId: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  return await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: "void",
    },
  });
}

// Função para retomar assinatura pausada
export async function resumeSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: "",
  });
}

// Função para cancelar assinatura
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

// Função para lidar com mudanças na assinatura
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error("Team not found for Stripe customer:", customerId);
    return;
  }

  if (status === "active" || status === "trialing") {
    const plan = subscription.items.data[0]?.plan;
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status,
    });
  } else if (
    status === "canceled" ||
    status === "unpaid" ||
    status === "paused"
  ) {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status,
    });
  }
}

// Função para obter preços do Stripe
export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ["data.product"],
    active: true,
    type: "recurring",
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
  }));
}

// Função para obter produtos do Stripe
export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === "string"
        ? product.default_price
        : product.default_price?.id,
  }));
}

// Função para criar produto no Stripe
export async function createStripeProduct(
  name: string,
  description: string,
  price: number
) {
  const product = await stripe.products.create({
    name,
    description,
    active: true,
  });

  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: price * 100, // Stripe usa centavos
    currency: "brl",
  });

  return {
    productId: product.id,
    priceId: stripePrice.id,
  };
}

// Função para criar produto de assinatura no Stripe
export async function createStripeSubscriptionProduct(
  name: string,
  description: string,
  price: number,
  interval: "day" | "week" | "month" | "year" = "month"
) {
  const product = await stripe.products.create({
    name,
    description,
    active: true,
  });

  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: price * 100, // Stripe usa centavos
    currency: "brl",
    recurring: {
      interval,
      interval_count: 1,
    },
  });

  return {
    productId: product.id,
    priceId: stripePrice.id,
  };
}
