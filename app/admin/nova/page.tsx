import { Suspense } from "react";
import Builder from "@/components/admin/Builder";

export const metadata = { title: "Nova vaquinha — Painel da Oxente" };

export default function AdminNovaPage() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
