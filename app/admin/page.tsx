import { Suspense } from "react";
import Builder from "@/components/admin/Builder";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
