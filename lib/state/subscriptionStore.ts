import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Product,
  SubscriptionPlan,
  PlanCustomizableItem,
} from "@/lib/db/schema";

export type CustomizationItem = {
  product: Product;
  quantity: number;
};

type SubscriptionState = {
  selectedPlan: SubscriptionPlan | null;
  customizableItems: CustomizationItem[];
  customizationRules: PlanCustomizableItem[];
  setSelectedPlan: (plan: SubscriptionPlan | null) => void;
  setCustomizationRules: (rules: PlanCustomizableItem[]) => void;
  addCustomizationItem: (product: Product, quantity: number) => void;
  removeCustomizationItem: (productId: number) => void;
  updateCustomizationQuantity: (productId: number, quantity: number) => void;
  clearCustomization: () => void;
  getCustomizationTotal: () => number;
  getCustomizationItemsByType: (productType: string) => CustomizationItem[];
  getCustomizationItemCount: (productType: string) => number;
  isCustomizationValid: () => boolean;
  getValidationErrors: () => string[];
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      selectedPlan: null,
      customizableItems: [],
      customizationRules: [],

      setSelectedPlan: (plan) =>
        set({
          selectedPlan: plan,
          customizableItems: [],
        }),

      setCustomizationRules: (rules) => set({ customizationRules: rules }),

      addCustomizationItem: (product, quantity) => {
        const { customizableItems } = get();
        const existingItem = customizableItems.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          set({
            customizableItems: customizableItems.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            customizableItems: [...customizableItems, { product, quantity }],
          });
        }
      },

      removeCustomizationItem: (productId) => {
        const { customizableItems } = get();
        set({
          customizableItems: customizableItems.filter(
            (item) => item.product.id !== productId
          ),
        });
      },

      updateCustomizationQuantity: (productId, quantity) => {
        const { customizableItems } = get();
        if (quantity <= 0) {
          set({
            customizableItems: customizableItems.filter(
              (item) => item.product.id !== productId
            ),
          });
        } else {
          set({
            customizableItems: customizableItems.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          });
        }
      },

      clearCustomization: () => set({ customizableItems: [] }),

      getCustomizationTotal: () => {
        const { customizableItems } = get();
        return customizableItems.reduce(
          (total, item) => total + Number(item.product.price) * item.quantity,
          0
        );
      },

      getCustomizationItemsByType: (productType) => {
        const { customizableItems } = get();
        return customizableItems.filter(
          (item) => item.product.productType === productType
        );
      },

      getCustomizationItemCount: (productType) => {
        const { customizableItems } = get();
        return customizableItems
          .filter((item) => item.product.productType === productType)
          .reduce((total, item) => total + item.quantity, 0);
      },

      isCustomizationValid: () => {
        const { customizationRules, getCustomizationItemCount } = get();

        for (const rule of customizationRules) {
          const count = getCustomizationItemCount(rule.productType);
          if (count < rule.minQuantity || count > rule.maxQuantity) {
            return false;
          }
        }

        return true;
      },

      getValidationErrors: () => {
        const { customizationRules, getCustomizationItemCount } = get();
        const errors: string[] = [];

        for (const rule of customizationRules) {
          const count = getCustomizationItemCount(rule.productType);

          if (count < rule.minQuantity) {
            errors.push(
              `Você precisa selecionar pelo menos ${
                rule.minQuantity
              } frutas do tipo ${
                rule.productType === "normal" ? "comum" : "exótica"
              }.`
            );
          }

          if (count > rule.maxQuantity) {
            errors.push(
              `Você pode selecionar no máximo ${
                rule.maxQuantity
              } frutas do tipo ${
                rule.productType === "normal" ? "comum" : "exótica"
              }.`
            );
          }
        }

        return errors;
      },
    }),
    {
      name: "subscription-storage",
    }
  )
);
