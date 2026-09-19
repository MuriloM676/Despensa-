import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { requireHousehold } from "@/server/household";
import { countInventoryEntries, listCategories, listProducts } from "@/server/product";
import { getStockTotals, findLowStock } from "@/server/stock-alerts";
import { quantityToNumber, formatQuantity } from "@/lib/quantity";
import { Badge } from "@despensa/ui";
import { ProductForm } from "@/components/product-form";
import { ProductEditForm } from "@/components/product-edit-form";
import { CategoryForm } from "@/components/category-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteCategoryAction, deleteProductAction } from "@/server/actions/product";

export const metadata: Metadata = {
  title: "Produtos",
};

function deleteProductMessage(productName: string, entryCount: number): string {
  if (entryCount <= 0) {
    return `Excluir o produto "${productName}"?`;
  }
  const records =
    entryCount === 1 ? "1 registro de estoque" : `${entryCount} registros de estoque`;
  return (
    `Excluir "${productName}"? Isso apaga também ${records} deste produto. ` +
    "Itens de lista mantêm o nome, sem vínculo."
  );
}

export default async function ProductsPage() {
  const user = await requireUser();
  const household = await requireHousehold(user.id);
  const [products, categories, inventoryCounts, totals] = await Promise.all([
    listProducts(household.id),
    listCategories(household.id),
    countInventoryEntries(household.id),
    getStockTotals(household.id),
  ]);

  const lowStockIds = new Set(
    findLowStock(
      products.map((product) => ({
        id: product.id,
        minStockLevel: quantityToNumber(product.minStockLevel),
      })),
      totals,
    ).map((entry) => entry.productId),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre os produtos da sua casa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Novo produto</h2>
            <ProductForm categories={categories} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Categorias ({categories.length})
            </h2>
            <CategoryForm />
            {categories.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {categories.map((category) => (
                  <li key={category.id} className="flex items-center justify-between gap-4 py-2">
                    <p className="text-sm text-slate-900">{category.name}</p>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <ConfirmSubmitButton
                        message={`Excluir a categoria "${category.name}"? Os produtos continuam cadastrados, sem categoria.`}
                        className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
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
                <li key={product.id} className="gap-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {product.name}{" "}
                        {lowStockIds.has(product.id) ? (
                          <Badge tone="amber">Estoque baixo</Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.brand ?? "Sem marca"} · {product.unit}
                        {product.category ? ` · ${product.category.name}` : ""}
                        {quantityToNumber(product.minStockLevel) > 0
                          ? ` · Mín. ${formatQuantity(product.minStockLevel)}`
                          : ""}
                      </p>
                    </div>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <ConfirmSubmitButton
                        message={deleteProductMessage(
                          product.name,
                          inventoryCounts.get(product.id) ?? 0,
                        )}
                        className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                      Editar
                    </summary>
                    <ProductEditForm
                      product={{
                        id: product.id,
                        name: product.name,
                        brand: product.brand,
                        unit: product.unit,
                        minStockLevel: quantityToNumber(product.minStockLevel),
                        categoryId: product.categoryId,
                      }}
                      categories={categories}
                    />
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
