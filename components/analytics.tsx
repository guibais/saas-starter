"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Aqui você pode adicionar seu código de analytics
      // Por exemplo, Google Analytics, Plausible, etc.
      console.log(`Página visualizada: ${pathname}`);
    }
  }, [pathname, searchParams]);

  return null;
}
