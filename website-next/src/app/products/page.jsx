import { Suspense } from "react";
import Products from "@/site-pages/Products";

function ProductsFallback() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ProductsRoutePage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <Products />
    </Suspense>
  );
}
