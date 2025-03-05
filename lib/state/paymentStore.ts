import { create } from "zustand";
import { persist } from "zustand/middleware";

type PaymentMethod = "credit_card" | "pix" | "boleto";

type PaymentState = {
  // Payment method selection
  selectedPaymentMethod: PaymentMethod | null;
  setPaymentMethod: (method: PaymentMethod) => void;

  // Payment processing state
  isProcessing: boolean;
  setProcessing: (isProcessing: boolean) => void;

  // Payment error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Payment success state
  isSuccess: boolean;
  setSuccess: (isSuccess: boolean) => void;

  // Payment session ID (for Stripe)
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;

  // Reset payment state
  resetPaymentState: () => void;
};

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      // Initial state
      selectedPaymentMethod: null,
      isProcessing: false,
      error: null,
      isSuccess: false,
      sessionId: null,

      // Actions
      setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
      setProcessing: (isProcessing) => set({ isProcessing }),
      setError: (error) => set({ error }),
      setSuccess: (isSuccess) => set({ isSuccess }),
      setSessionId: (sessionId) => set({ sessionId }),

      // Reset state
      resetPaymentState: () =>
        set({
          selectedPaymentMethod: null,
          isProcessing: false,
          error: null,
          isSuccess: false,
          sessionId: null,
        }),
    }),
    {
      name: "payment-storage",
    }
  )
);
