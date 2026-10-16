"use client";

import type { ReactNode } from "react";
import { useToast } from "@/components/fx/ToastProvider";

/** Botões "decorativos" do protótipo — anunciam que não fazem parte dele. */
export default function DummyButton({
  children,
  ...rest
}: {
  children: ReactNode;
  className?: string;
}) {
  const toast = useToast();
  return (
    <button
      onClick={() => toast("Esta seção não faz parte do protótipo visual.", "info")}
      {...rest}
    >
      {children}
    </button>
  );
}
