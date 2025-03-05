import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Product,
  SubscriptionPlan,
  PlanCustomizableItem,
  PlanFixedItem,
} from "@/lib/db/schema";

export type CustomizationItem = {
  product: Product;
  quantity: number;
};

// Extended SubscriptionPlan type with fixedItems
export type ExtendedSubscriptionPlan = SubscriptionPlan & {
  fixedItems?: Array<PlanFixedItem & { product: Product }>;
};

type SubscriptionState = {
  selectedPlan: ExtendedSubscriptionPlan | null;
  customizableItems: CustomizationItem[];
  customizationRules: PlanCustomizableItem[];
  setSelectedPlan: (plan: ExtendedSubscriptionPlan | null) => void;
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
        const { customizationRules, getCustomizationItemCount, selectedPlan } =
          get();

        // If there are no customization rules, the customization is valid
        if (!customizationRules.length) {
          return true;
        }

        for (const rule of customizationRules) {
          const count = getCustomizationItemCount(rule.productType);

          // Get fixed items count for this product type
          let fixedItemsCount = 0;
          if (selectedPlan?.fixedItems && selectedPlan.fixedItems.length > 0) {
            fixedItemsCount = selectedPlan.fixedItems
              .filter((item) => item.product.productType === rule.productType)
              .reduce((total, item) => total + item.quantity, 0);
          }

          // Total count is the sum of customizable items and fixed items
          const totalCount = count + fixedItemsCount;

          // Check if the total count meets the rule requirements
          if (totalCount < rule.minQuantity || totalCount > rule.maxQuantity) {
            return false;
          }
        }

        return true;
      },

      getValidationErrors: () => {
        const { customizationRules, getCustomizationItemCount, selectedPlan } =
          get();
        const errors: string[] = [];

        for (const rule of customizationRules) {
          const count = getCustomizationItemCount(rule.productType);

          // Get fixed items count for this product type
          let fixedItemsCount = 0;
          if (selectedPlan?.fixedItems && selectedPlan.fixedItems.length > 0) {
            fixedItemsCount = selectedPlan.fixedItems
              .filter((item) => item.product.productType === rule.productType)
              .reduce((total, item) => total + item.quantity, 0);
          }

          // Total count is the sum of customizable items and fixed items
          const totalCount = count + fixedItemsCount;

          if (totalCount < rule.minQuantity) {
            errors.push(
              `Você precisa selecionar pelo menos ${
                rule.minQuantity - fixedItemsCount
              } frutas adicionais do tipo ${
                rule.productType === "normal" ? "comum" : "exótica"
              }.`
            );
          }

          if (totalCount > rule.maxQuantity) {
            errors.push(
              `Você pode selecionar no máximo ${
                rule.maxQuantity - fixedItemsCount
              } frutas adicionais do tipo ${
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
