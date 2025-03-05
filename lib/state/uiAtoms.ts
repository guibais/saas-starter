import { atom } from "jotai";

// Modal atoms
export const isModalOpenAtom = atom<boolean>(false);
export const modalContentAtom = atom<React.ReactNode | null>(null);
export const modalTitleAtom = atom<string>("");

// Combined modal control atom
export const modalAtom = atom(
  (get) => ({
    isOpen: get(isModalOpenAtom),
    title: get(modalTitleAtom),
    content: get(modalContentAtom),
  }),
  (
    get,
    set,
    {
      isOpen,
      title,
      content,
    }: { isOpen: boolean; title?: string; content?: React.ReactNode }
  ) => {
    set(isModalOpenAtom, isOpen);
    if (title !== undefined) set(modalTitleAtom, title);
    if (content !== undefined) set(modalContentAtom, content);
  }
);

// Toast atoms
export type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
};

export const toastsAtom = atom<Toast[]>([]);

export const addToastAtom = atom(null, (get, set, toast: Omit<Toast, "id">) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { ...toast, id };
  set(toastsAtom, [...get(toastsAtom), newToast]);

  // Auto-remove toast after duration
  setTimeout(() => {
    set(
      toastsAtom,
      get(toastsAtom).filter((t) => t.id !== id)
    );
  }, toast.duration || 5000);
});

export const removeToastAtom = atom(null, (get, set, id: string) => {
  set(
    toastsAtom,
    get(toastsAtom).filter((toast) => toast.id !== id)
  );
});

// Sidebar/navigation atoms
export const isSidebarOpenAtom = atom<boolean>(false);
export const toggleSidebarAtom = atom(null, (get, set) =>
  set(isSidebarOpenAtom, !get(isSidebarOpenAtom))
);

// Theme atoms
export const isDarkModeAtom = atom<boolean>(false);
export const toggleDarkModeAtom = atom(null, (get, set) =>
  set(isDarkModeAtom, !get(isDarkModeAtom))
);

// Loading state atoms
export const isLoadingAtom = atom<boolean>(false);
export const loadingMessageAtom = atom<string>("");

// Combined loading control atom
export const loadingAtom = atom(
  (get) => ({
    isLoading: get(isLoadingAtom),
    message: get(loadingMessageAtom),
  }),
  (
    get,
    set,
    { isLoading, message }: { isLoading: boolean; message?: string }
  ) => {
    set(isLoadingAtom, isLoading);
    if (message !== undefined) set(loadingMessageAtom, message);
  }
);
