import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { listProducts, listCategories } from "@/server/product";
import { ProductForm } from "@/components/product-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteProductAction } from "@/server/actions/product";

export const metadata: Metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const [products, categories] = await Promise.all([
    listProducts(household.id),
    listCategories(household.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre os produtos da sua casa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Novo produto</h2>
          <ProductForm categories={categories} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Produtos ({products.length})
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum produto cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {products.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">
                      {product.brand ?? "Sem marca"} · {product.unit}
                      {product.category ? ` · ${product.category.name}` : ""}
                    </p>
                  </div>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <ConfirmSubmitButton
                      message={`Excluir o produto "${product.name}"?`}
                      className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
