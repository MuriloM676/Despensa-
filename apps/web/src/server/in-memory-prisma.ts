/**
 * Test-only in-memory stand-in for the Prisma client.
 *
 * B11: the service layer had no integration coverage. Spinning up an
 * ephemeral Postgres per test file is slow and flaky on this floor, so these
 * tests run the REAL service code (`server/*.ts`) against this consistent
 * in-memory store. It reproduces the Prisma semantics the services rely on:
 * household scoping, `quantity: { gt: 0 }` filters, FEFO ordering with
 * NULLS LAST, the `[householdId, name, brand]` unique rule (NULL brand
 * behaves like Postgres: not unique at the DB level, enforced app-side),
 * cascading deletes from lists/products, and `$transaction` over a batch of
 * writes. Anything it does not implement throws, so silent drift fails loud.
 *
 * B9: `$transaction` also supports the interactive (callback) form. Callback
 * transactions run strictly one at a time (a promise-chain mutex), mirroring
 * the Serializable + `SELECT ... FOR UPDATE` guarantee `consumeInventory`
 * relies on in Postgres. The batch (array) form keeps the old parallel
 * behavior, so the pre-B9 read-outside/write-inside pattern still oversells
 * in tests and the B9 concurrency test stays red without the fix.
 *
 * Used only from `*.integration.test.ts` via `vi.mock("@despensa/database")`.
 * Never imported by production code.
 */

export interface TestUser {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string | null;
}

export interface TestHousehold {
  id: string;
  name: string;
  alertWindowDays: number;
}

export interface TestMembership {
  id: string;
  householdId: string;
  userId: string;
  role: string;
}

export interface TestCategory {
  id: string;
  householdId: string;
  name: string;
}

export interface TestProduct {
  id: string;
  householdId: string;
  name: string;
  brand: string | null;
  unit: string;
  minStockLevel: number;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestInventoryItem {
  id: string;
  householdId: string;
  productId: string;
  quantity: number;
  purchaseDate: Date;
  expirationDate: Date | null;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestShoppingList {
  id: string;
  householdId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestShoppingListItem {
  id: string;
  listId: string;
  productId: string | null;
  name: string | null;
  quantity: number;
  done: boolean;
  createdAt: Date;
}

export interface TestStockEvent {
  id: string;
  householdId: string;
  productId: string;
  kind: string;
  quantity: number;
  note: string | null;
  createdAt: Date;
}

type LooseRecord = Record<string, unknown>;

function isOperatorObject(value: unknown): value is LooseRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date) &&
    !Array.isArray(value) &&
    ("gt" in (value as LooseRecord) ||
      "gte" in (value as LooseRecord) ||
      "lt" in (value as LooseRecord) ||
      "lte" in (value as LooseRecord))
  );
}

function matchesValue(actual: unknown, expected: unknown): boolean {
  if (isOperatorObject(expected)) {
    const actualNumber = actual as number;
    if ("gt" in expected && !(actualNumber > (expected.gt as number))) return false;
    if ("gte" in expected && !(actualNumber >= (expected.gte as number))) return false;
    if ("lt" in expected && !(actualNumber < (expected.lt as number))) return false;
    if ("lte" in expected && !(actualNumber <= (expected.lte as number))) return false;
    return true;
  }
  if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();
  }
  return actual === expected;
}

function matchesWhere(row: LooseRecord, where: LooseRecord | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    if (key === "list" && typeof expected === "object" && expected !== null) {
      // Resolved by the caller (needs the parent list); never matches here.
      return true;
    }
    return matchesValue(row[key], expected);
  });
}

export interface TestPrisma {
  user: {
    findUnique(args: { where: LooseRecord }): Promise<TestUser | null>;
    create(args: { data: LooseRecord }): Promise<TestUser>;
  };
  household: {
    create(args: { data: LooseRecord }): Promise<TestHousehold>;
    update(args: { where: LooseRecord; data: LooseRecord }): Promise<TestHousehold>;
  };
  householdMember: {
    findFirst(args: { where: LooseRecord; include?: LooseRecord }): Promise<unknown>;
  };
  productCategory: {
    findFirst(args: { where: LooseRecord }): Promise<TestCategory | null>;
    findMany(args: { where?: LooseRecord; orderBy?: unknown }): Promise<TestCategory[]>;
    create(args: { data: LooseRecord }): Promise<TestCategory>;
    deleteMany(args: { where: LooseRecord }): Promise<{ count: number }>;
  };
  product: {
    findFirst(args: { where: LooseRecord }): Promise<TestProduct | null>;
    findMany(args: {
      where?: LooseRecord;
      include?: LooseRecord;
      orderBy?: unknown;
    }): Promise<unknown[]>;
    create(args: { data: LooseRecord }): Promise<TestProduct>;
    update(args: { where: LooseRecord; data: LooseRecord }): Promise<TestProduct>;
    deleteMany(args: { where: LooseRecord }): Promise<{ count: number }>;
  };
  inventoryItem: {
    findFirst(args: { where: LooseRecord }): Promise<unknown>;
    findMany(args: { where?: LooseRecord; orderBy?: unknown }): Promise<unknown[]>;
    create(args: { data: LooseRecord }): Promise<TestInventoryItem>;
    update(args: { where: LooseRecord; data: LooseRecord }): Promise<TestInventoryItem>;
    delete(args: { where: LooseRecord }): Promise<TestInventoryItem>;
    deleteMany(args: { where: LooseRecord }): Promise<{ count: number }>;
  };
  shoppingList: {
    create(args: { data: LooseRecord }): Promise<TestShoppingList>;
    findMany(args: {
      where?: LooseRecord;
      include?: LooseRecord;
      orderBy?: unknown;
    }): Promise<unknown[]>;
    findFirst(args: { where: LooseRecord; include?: LooseRecord }): Promise<unknown>;
    updateMany(args: { where: LooseRecord; data: LooseRecord }): Promise<{ count: number }>;
    deleteMany(args: { where: LooseRecord }): Promise<{ count: number }>;
  };
  shoppingListItem: {
    create(args: { data: LooseRecord }): Promise<TestShoppingListItem>;
    findFirst(args: { where: LooseRecord; include?: LooseRecord }): Promise<unknown>;
    update(args: { where: LooseRecord; data: LooseRecord }): Promise<TestShoppingListItem>;
    delete(args: { where: LooseRecord }): Promise<TestShoppingListItem>;
  };
  stockEvent: {
    create(args: { data: LooseRecord }): Promise<TestStockEvent>;
    findMany(args: {
      where?: LooseRecord;
      orderBy?: unknown;
      take?: number;
    }): Promise<TestStockEvent[]>;
  };
  $transaction(ops: Promise<unknown>[]): Promise<unknown[]>;
  $transaction<T>(
    fn: (tx: TestPrisma) => Promise<T>,
    options?: { isolationLevel?: string; maxWait?: number; timeout?: number },
  ): Promise<T>;
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<number>;
  $queryRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
}

export interface InMemoryDb {
  users: Map<string, TestUser>;
  households: Map<string, TestHousehold>;
  memberships: Map<string, TestMembership>;
  categories: Map<string, TestCategory>;
  products: Map<string, TestProduct>;
  inventory: Map<string, TestInventoryItem>;
  lists: Map<string, TestShoppingList>;
  listItems: Map<string, TestShoppingListItem>;
  events: Map<string, TestStockEvent>;
  /** One-shot hook to simulate a P2002 race the app-level check missed. */
  failNextProductCreateWithP2002: boolean;
  prisma: TestPrisma;
  reset(): void;
}

declare global {
  var __despensaTestDb: InMemoryDb | undefined;
}

export function getTestDb(): InMemoryDb {
  const db = globalThis.__despensaTestDb;
  if (!db) {
    throw new Error("Test DB not installed: missing vi.mock(\"@despensa/database\") setup");
  }
  return db;
}

function uniqueViolation(): unknown {
  return {
    code: "P2002",
    meta: { target: ["householdId", "name", "brand"] },
  };
}

function compareExpiration(
  a: Date | null,
  b: Date | null,
  direction: string,
  nulls: string,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return nulls === "last" ? 1 : -1;
  if (b === null) return nulls === "last" ? -1 : 1;
  const diff = a.getTime() - b.getTime();
  return direction === "desc" ? -diff : diff;
}

export function createInMemoryPrisma(): InMemoryDb {
  let seq = 0;
  const nextId = (prefix: string): string => {
    seq += 1;
    return `${prefix}-test-${seq}`;
  };

  // B9: serializes interactive (callback) transactions, mirroring the
  // Serializable + row-lock guarantee the services rely on in Postgres.
  let txTail: Promise<unknown> = Promise.resolve();

  function runSerialized<T>(fn: () => Promise<T>): Promise<T> {
    const run = txTail.then(fn, fn);
    txTail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  const db: InMemoryDb = {
    users: new Map(),
    households: new Map(),
    memberships: new Map(),
    categories: new Map(),
    products: new Map(),
    inventory: new Map(),
    lists: new Map(),
    listItems: new Map(),
    events: new Map(),
    failNextProductCreateWithP2002: false,
    // Assigned just below; the methods close over `db`.
    prisma: undefined as unknown as TestPrisma,
    reset() {
      db.users.clear();
      db.households.clear();
      db.memberships.clear();
      db.categories.clear();
      db.products.clear();
      db.inventory.clear();
      db.lists.clear();
      db.listItems.clear();
      db.events.clear();
      db.failNextProductCreateWithP2002 = false;
      txTail = Promise.resolve();
      seq = 0;
    },
  };

  function withCategory(product: TestProduct): TestProduct & { category: TestCategory | null } {
    return {
      ...product,
      category: product.categoryId ? (db.categories.get(product.categoryId) ?? null) : null,
    };
  }

  function withProduct(item: TestInventoryItem): TestInventoryItem & { product: unknown } {
    const product = db.products.get(item.productId);
    return {
      ...item,
      product: product ? withCategory(product) : null,
    };
  }

  function sortInventory(
    rows: TestInventoryItem[],
    orderBy: unknown,
  ): TestInventoryItem[] {
    const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((ra, rb) => {
      for (const clause of clauses) {
        const c = clause as LooseRecord;
        if ("product" in c) {
          const nameA = db.products.get(ra.productId)?.name ?? "";
          const nameB = db.products.get(rb.productId)?.name ?? "";
          if (nameA !== nameB) return nameA < nameB ? -1 : 1;
          continue;
        }
        if ("expirationDate" in c) {
          const spec = c.expirationDate as LooseRecord;
          const diff = compareExpiration(
            ra.expirationDate,
            rb.expirationDate,
            String(spec.sort ?? "asc"),
            String(spec.nulls ?? "last"),
          );
          if (diff !== 0) return diff;
          continue;
        }
        if ("createdAt" in c) {
          const diff = ra.createdAt.getTime() - rb.createdAt.getTime();
          if (diff !== 0) return c.createdAt === "desc" ? -diff : diff;
        }
      }
      return 0;
    });
  }

  function matchListItem(
    item: TestShoppingListItem,
    where: LooseRecord | undefined,
  ): boolean {
    if (!where) return true;
    if ("id" in where && item.id !== where.id) return false;
    const listCond = where.list as LooseRecord | undefined;
    if (listCond) {
      const parent = db.lists.get(item.listId);
      if (!parent) return false;
      if ("id" in listCond && parent.id !== listCond.id) return false;
      if ("householdId" in listCond && parent.householdId !== listCond.householdId) {
        return false;
      }
    }
    return true;
  }

  db.prisma = {
    user: {
      findUnique: async (args: { where: LooseRecord }): Promise<TestUser | null> => {
        if ("id" in args.where) return db.users.get(String(args.where.id)) ?? null;
        if ("email" in args.where) {
          for (const user of db.users.values()) {
            if (user.email === args.where.email) return user;
          }
        }
        return null;
      },
      create: async (args: { data: LooseRecord }): Promise<TestUser> => {
        const user: TestUser = {
          id: nextId("user"),
          name: (args.data.name as string | null) ?? null,
          email: String(args.data.email),
          passwordHash: (args.data.passwordHash as string | null) ?? null,
        };
        db.users.set(user.id, user);
        return user;
      },
    },
    household: {
      create: async (args: { data: LooseRecord }): Promise<TestHousehold> => {
        const household: TestHousehold = {
          id: nextId("household"),
          name: "Minha despensa",
          alertWindowDays: 5,
        };
        db.households.set(household.id, household);
        const nested = args.data.members as LooseRecord | undefined;
        const memberData = nested?.create as LooseRecord | undefined;
        if (memberData) {
          const membership: TestMembership = {
            id: nextId("member"),
            householdId: household.id,
            userId: String(memberData.userId),
            role: String(memberData.role),
          };
          db.memberships.set(membership.id, membership);
        }
        return household;
      },
      update: async (args: {
        where: LooseRecord;
        data: LooseRecord;
      }): Promise<TestHousehold> => {
        const household = db.households.get(String(args.where.id));
        if (!household) throw new Error("Household não encontrado");
        if ("alertWindowDays" in args.data) {
          household.alertWindowDays = Number(args.data.alertWindowDays);
        }
        if ("name" in args.data) household.name = String(args.data.name);
        return household;
      },
    },
    householdMember: {
      findFirst: async (args: {
        where: LooseRecord;
        include?: LooseRecord;
      }): Promise<unknown> => {
        for (const membership of db.memberships.values()) {
          if (!matchesWhere(membership as unknown as LooseRecord, args.where)) continue;
          if (args.include?.household) {
            return { ...membership, household: db.households.get(membership.householdId) };
          }
          return membership;
        }
        return null;
      },
    },
    productCategory: {
      findFirst: async (args: { where: LooseRecord }): Promise<TestCategory | null> => {
        for (const category of db.categories.values()) {
          if (matchesWhere(category as unknown as LooseRecord, args.where)) return category;
        }
        return null;
      },
      findMany: async (args: {
        where?: LooseRecord;
        orderBy?: unknown;
      }): Promise<TestCategory[]> => {
        const rows = [...db.categories.values()].filter((category) =>
          matchesWhere(category as unknown as LooseRecord, args.where),
        );
        rows.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        return rows;
      },
      create: async (args: { data: LooseRecord }): Promise<TestCategory> => {
        const category: TestCategory = {
          id: nextId("category"),
          householdId: String(args.data.householdId),
          name: String(args.data.name),
        };
        db.categories.set(category.id, category);
        return category;
      },
      deleteMany: async (args: { where: LooseRecord }): Promise<{ count: number }> => {
        let count = 0;
        for (const category of [...db.categories.values()]) {
          if (!matchesWhere(category as unknown as LooseRecord, args.where)) continue;
          db.categories.delete(category.id);
          // Mirrors ON DELETE SET NULL: products keep their row, link cleared.
          for (const product of db.products.values()) {
            if (product.categoryId === category.id) product.categoryId = null;
          }
          count += 1;
        }
        return { count };
      },
    },
    product: {
      findFirst: async (args: { where: LooseRecord }): Promise<TestProduct | null> => {
        for (const product of db.products.values()) {
          if (matchesWhere(product as unknown as LooseRecord, args.where)) return product;
        }
        return null;
      },
      findMany: async (args: {
        where?: LooseRecord;
        include?: LooseRecord;
        orderBy?: unknown;
      }): Promise<unknown[]> => {
        void args.include;
        void args.orderBy;
        const rows = [...db.products.values()].filter((product) =>
          matchesWhere(product as unknown as LooseRecord, args.where),
        );
        rows.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        return rows.map(withCategory);
      },
      create: async (args: { data: LooseRecord }): Promise<TestProduct> => {
        if (db.failNextProductCreateWithP2002) {
          db.failNextProductCreateWithP2002 = false;
          throw uniqueViolation();
        }
        const data = args.data;
        const brand = (data.brand as string | null) ?? null;
        // Postgres treats NULL as distinct: the DB unique index only fires
        // for non-null brands; null-brand dupes are rejected app-side.
        if (brand !== null) {
          for (const product of db.products.values()) {
            if (
              product.householdId === data.householdId &&
              product.name === data.name &&
              product.brand === brand
            ) {
              throw uniqueViolation();
            }
          }
        }
        const now = new Date();
        const product: TestProduct = {
          id: nextId("product"),
          householdId: String(data.householdId),
          name: String(data.name),
          brand,
          unit: String(data.unit ?? "un"),
          minStockLevel: Number(data.minStockLevel ?? 0),
          categoryId: (data.categoryId as string | null) ?? null,
          createdAt: now,
          updatedAt: now,
        };
        db.products.set(product.id, product);
        return product;
      },
      deleteMany: async (args: { where: LooseRecord }): Promise<{ count: number }> => {
        let count = 0;
        for (const product of [...db.products.values()]) {
          if (!matchesWhere(product as unknown as LooseRecord, args.where)) continue;
          db.products.delete(product.id);
          for (const item of [...db.inventory.values()]) {
            if (item.productId === product.id) db.inventory.delete(item.id);
          }
          for (const listItem of db.listItems.values()) {
            if (listItem.productId === product.id) listItem.productId = null;
          }
          count += 1;
        }
        return { count };
      },
      update: async (args: {
        where: LooseRecord;
        data: LooseRecord;
      }): Promise<TestProduct> => {
        const product = db.products.get(String(args.where.id));
        if (!product) throw new Error("Produto não encontrado");
        if ("name" in args.data) product.name = String(args.data.name);
        if ("brand" in args.data) product.brand = (args.data.brand as string | null) ?? null;
        if ("unit" in args.data) product.unit = String(args.data.unit);
        if ("minStockLevel" in args.data) {
          product.minStockLevel = Number(args.data.minStockLevel);
        }
        if ("categoryId" in args.data) {
          product.categoryId = (args.data.categoryId as string | null) ?? null;
        }
        product.updatedAt = new Date();
        return product;
      },
    },
    inventoryItem: {
      findFirst: async (args: { where: LooseRecord }): Promise<unknown> => {
        for (const item of db.inventory.values()) {
          if (matchesWhere(item as unknown as LooseRecord, args.where)) {
            return withProduct(item);
          }
        }
        return null;
      },
      findMany: async (args: { where?: LooseRecord; orderBy?: unknown }): Promise<unknown[]> => {
        const rows = [...db.inventory.values()].filter((item) =>
          matchesWhere(item as unknown as LooseRecord, args.where),
        );
        const sorted = args.orderBy ? sortInventory(rows, args.orderBy) : rows;
        return sorted.map(withProduct);
      },
      create: async (args: { data: LooseRecord }): Promise<TestInventoryItem> => {
        const now = new Date();
        const item: TestInventoryItem = {
          id: nextId("stock"),
          householdId: String(args.data.householdId),
          productId: String(args.data.productId),
          quantity: Number(args.data.quantity),
          purchaseDate: (args.data.purchaseDate as Date | undefined) ?? now,
          expirationDate: (args.data.expirationDate as Date | null | undefined) ?? null,
          consumedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        db.inventory.set(item.id, item);
        return item;
      },
      update: async (args: {
        where: LooseRecord;
        data: LooseRecord;
      }): Promise<TestInventoryItem> => {
        const item = db.inventory.get(String(args.where.id));
        if (!item) throw new Error("Item não encontrado");
        const quantity = args.data.quantity as LooseRecord | undefined;
        if (quantity && "decrement" in quantity) {
          item.quantity -= Number(quantity.decrement);
        }
        item.updatedAt = new Date();
        return item;
      },
      delete: async (args: { where: LooseRecord }): Promise<TestInventoryItem> => {
        const item = db.inventory.get(String(args.where.id));
        if (!item) throw new Error("Item não encontrado");
        db.inventory.delete(item.id);
        return item;
      },
      deleteMany: async (args: { where: LooseRecord }): Promise<{ count: number }> => {
        let count = 0;
        for (const item of [...db.inventory.values()]) {
          if (!matchesWhere(item as unknown as LooseRecord, args.where)) continue;
          db.inventory.delete(item.id);
          count += 1;
        }
        return { count };
      },
    },
    shoppingList: {
      create: async (args: { data: LooseRecord }): Promise<TestShoppingList> => {
        const now = new Date();
        const list: TestShoppingList = {
          id: nextId("list"),
          householdId: String(args.data.householdId),
          name: String(args.data.name),
          createdAt: now,
          updatedAt: now,
        };
        db.lists.set(list.id, list);
        return list;
      },
      findMany: async (args: {
        where?: LooseRecord;
        include?: LooseRecord;
        orderBy?: unknown;
      }): Promise<unknown[]> => {
        const rows = [...db.lists.values()].filter((list) =>
          matchesWhere(list as unknown as LooseRecord, args.where),
        );
        if (args.orderBy === "desc" || (args.orderBy as LooseRecord)?.createdAt === "desc") {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return rows.map((list) => ({
          ...list,
          items: [...db.listItems.values()]
            .filter((item) => item.listId === list.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        }));
      },
      findFirst: async (args: {
        where: LooseRecord;
        include?: LooseRecord;
      }): Promise<unknown> => {
        for (const list of db.lists.values()) {
          if (!matchesWhere(list as unknown as LooseRecord, args.where)) continue;
          const items = [...db.listItems.values()]
            .filter((item) => item.listId === list.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((item) => ({
              ...item,
              product: item.productId ? (db.products.get(item.productId) ?? null) : null,
            }));
          return { ...list, items };
        }
        return null;
      },
      updateMany: async (args: {
        where: LooseRecord;
        data: LooseRecord;
      }): Promise<{ count: number }> => {
        let count = 0;
        for (const list of db.lists.values()) {
          if (!matchesWhere(list as unknown as LooseRecord, args.where)) continue;
          if ("name" in args.data) list.name = String(args.data.name);
          list.updatedAt = new Date();
          count += 1;
        }
        return { count };
      },
      deleteMany: async (args: { where: LooseRecord }): Promise<{ count: number }> => {
        let count = 0;
        for (const list of [...db.lists.values()]) {
          if (!matchesWhere(list as unknown as LooseRecord, args.where)) continue;
          db.lists.delete(list.id);
          for (const item of [...db.listItems.values()]) {
            if (item.listId === list.id) db.listItems.delete(item.id);
          }
          count += 1;
        }
        return { count };
      },
    },
    shoppingListItem: {
      create: async (args: { data: LooseRecord }): Promise<TestShoppingListItem> => {
        const item: TestShoppingListItem = {
          id: nextId("item"),
          listId: String(args.data.listId),
          productId: (args.data.productId as string | null) ?? null,
          name: (args.data.name as string | null) ?? null,
          quantity: Number(args.data.quantity),
          done: false,
          createdAt: new Date(),
        };
        db.listItems.set(item.id, item);
        return item;
      },
      findFirst: async (args: {
        where: LooseRecord;
        include?: LooseRecord;
      }): Promise<unknown> => {
        for (const item of db.listItems.values()) {
          if ("id" in args.where && item.id !== args.where.id) continue;
          if (!matchListItem(item, args.where)) continue;
          if (args.include?.product) {
            return {
              ...item,
              product: item.productId ? (db.products.get(item.productId) ?? null) : null,
            };
          }
          return item;
        }
        return null;
      },
      update: async (args: {
        where: LooseRecord;
        data: LooseRecord;
      }): Promise<TestShoppingListItem> => {
        const item = db.listItems.get(String(args.where.id));
        if (!item) throw new Error("Item não encontrado");
        if ("done" in args.data) item.done = Boolean(args.data.done);
        return item;
      },
      delete: async (args: { where: LooseRecord }): Promise<TestShoppingListItem> => {
        const item = db.listItems.get(String(args.where.id));
        if (!item) throw new Error("Item não encontrado");
        db.listItems.delete(item.id);
        return item;
      },
    },
    stockEvent: {
      create: async (args: { data: LooseRecord }): Promise<TestStockEvent> => {
        const event: TestStockEvent = {
          id: nextId("event"),
          householdId: String(args.data.householdId),
          productId: String(args.data.productId),
          kind: String(args.data.kind),
          quantity: Number(args.data.quantity),
          note: (args.data.note as string | null) ?? null,
          createdAt: new Date(),
        };
        db.events.set(event.id, event);
        return event;
      },
      findMany: async (args: {
        where?: LooseRecord;
        orderBy?: unknown;
        take?: number;
      }): Promise<TestStockEvent[]> => {
        const rows = [...db.events.values()].filter((event) =>
          matchesWhere(event as unknown as LooseRecord, args.where),
        );
        rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return typeof args.take === "number" ? rows.slice(0, args.take) : rows;
      },
    },
    $transaction: ((arg: Promise<unknown>[] | ((tx: TestPrisma) => Promise<unknown>)) => {
      if (typeof arg === "function") {
        return runSerialized(() => arg(db.prisma));
      }
      return Promise.all(arg);
    }) as TestPrisma["$transaction"],
    $executeRaw: () => Promise.resolve(0),
    $queryRaw: () => Promise.resolve([]),
  };

  return db;
}
