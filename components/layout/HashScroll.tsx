"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Após trocar de rota, rola suavemente até a âncora da URL (ex.: /#vaquinhas). */
export default function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" }));
  }, [pathname]);

  return null;
}
