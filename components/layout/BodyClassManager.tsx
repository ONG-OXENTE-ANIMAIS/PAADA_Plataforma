"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** body.is-admin esconde navbar/footer e mostra a adminbar (regras originais do CSS). */
export default function BodyClassManager() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdmin = pathname.startsWith("/admin");
    document.body.classList.toggle("is-admin", isAdmin);
    document.body.classList.remove("nav-open");
    return () => {
      document.body.classList.remove("is-admin");
      document.body.classList.remove("nav-open");
    };
  }, [pathname]);

  return null;
}
