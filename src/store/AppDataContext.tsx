import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { products as initialProducts } from "../mock/products";
import { categories as initialCategories } from "../mock/categories";
import { sales as initialSales } from "../mock/sales";
import { purchases as initialPurchases } from "../mock/purchases";
import { debts as initialDebts } from "../mock/debts";
import { loadState, saveState, clearAllState } from "../utils/storage";
import { migrateProducts } from "../services/migrations";
import { applyPurchaseLines, applySaleDeduction, applyAdjustment, applyLoss } from "../services/inventoryService";
import { createBackup } from "../services/backupService";
import { generateNotificationCandidates } from "../services/notificationService";
import type {
  Product,
  Category,
  Sale,
  SaleItem,
  Purchase,
  Debt,
  PaymentMethod,
  StockMovement,
  Supplier,
  Expense,
  ExpenseCategory,
  BackupPayload,
  LossReason,
  AppNotification,
} from "../types";
import { LOSS_REASON_LABELS } from "../types";

interface CartLine {
  productId: string;
  quantity: number;
  /** Có giá trị khi dòng này được thêm bằng cách quét đúng mã vạch của 1 lô cụ thể. */
  batchId?: string;
}

interface AppDataContextValue {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  purchases: Purchase[];
  debts: Debt[];
  units: string[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  expenses: Expense[];
  notifications: AppNotification[];

  addProduct: (p: Omit<Product, "id">) => string;
  updateProduct: (id: string, p: Omit<Product, "id">) => void;
  deleteProduct: (id: string) => void;

  addCategory: (name: string) => string;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  /** Thêm 1 đơn vị mới vào danh sách gợi ý (gói, chai, vỉ...) nếu chưa có. */
  addUnit: (name: string) => void;

  addPurchase: (
    items: {
      productId: string;
      quantity: number;
      purchasePrice: number;
      expiryDate?: string;
      barcode?: string;
    }[],
    supplierId?: string
  ) => void;

  checkout: (cart: CartLine[], paymentMethod: PaymentMethod) => Sale;

  /** Điều chỉnh tồn kho thủ công (kiểm kho, sửa sai...) - luôn tạo StockMovement kèm lý do. */
  adjustStock: (productId: string, newStock: number, reason?: string) => void;

  payDebt: (debtId: string, amount: number, note?: string) => void;

  addDebt: (customerName: string, phone: string | undefined, totalPurchase: number) => void;
  updateDebt: (
    id: string,
    changes: { customerName: string; phone?: string; totalPurchase: number }
  ) => void;

  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => string;
  updateSupplier: (id: string, s: Omit<Supplier, "id" | "createdAt">) => void;
  deleteSupplier: (id: string) => void;

  addExpense: (e: { category: ExpenseCategory; amount: number; note?: string }) => void;
  updateExpense: (id: string, e: { category: ExpenseCategory; amount: number; note?: string }) => void;
  deleteExpense: (id: string) => void;


  /** Ghi nhận hàng bị mất khỏi tồn kho (hư hỏng/hết hạn/thất thoát/khác) - luôn tạo StockMovement. */
  recordLoss: (productId: string, reason: LossReason, quantity: number, note?: string) => void;


  /** Quét dữ liệu hiện tại, tạo thông báo mới cho rule nào đang thỏa mà CHƯA có thông báo cùng
   *  dedupKey (tránh spam trùng lặp). Gọi khi mở Trang chủ / Trung tâm thông báo. */
  syncNotifications: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  /** Đóng gói toàn bộ dữ liệu nghiệp vụ hiện tại thành 1 backup (dùng để export JSON). */
  exportBackup: () => BackupPayload;

  /** Ghi đè TOÀN BỘ dữ liệu hiện tại bằng dữ liệu trong backup (đã validate ở nơi gọi). */
  restoreBackup: (backup: BackupPayload) => void;

  /** Xóa hết dữ liệu đã lưu, khôi phục lại dữ liệu mẫu ban đầu. */
  resetToSampleData: () => void;

  /** Xóa trắng toàn bộ dữ liệu (không khôi phục mẫu) - dùng khi bắt đầu dùng thật. */
  resetAllData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const STORAGE_KEYS = [
  "products",
  "categories",
  "sales",
  "purchases",
  "debts",
  "units",
  "idCounter",
  "stockMovements",
  "suppliers",
  "expenses",
  "notifications",
];

const DEFAULT_UNITS = [
  "gói", "chai", "lon", "hộp", "vỉ", "thùng", "kg", "cái", "chiếc", "bao", "túi", "hủ", "lốc",
];

let idCounter = loadState<number>("idCounter", 1000);
function nextId(prefix: string) {
  idCounter += 1;
  saveState("idCounter", idCounter);
  return `${prefix}${idCounter}`;
}

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() =>
    migrateProducts(loadState("products", initialProducts))
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadState("categories", initialCategories)
  );
  const [sales, setSales] = useState<Sale[]>(() => loadState("sales", initialSales));
  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    loadState("purchases", initialPurchases)
  );
  const [debts, setDebts] = useState<Debt[]>(() => loadState("debts", initialDebts));
  const [units, setUnits] = useState<string[]>(() => loadState("units", DEFAULT_UNITS));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadState("stockMovements", [] as StockMovement[])
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadState("suppliers", [] as Supplier[]));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadState("expenses", [] as Expense[]));
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadState("notifications", [] as AppNotification[])
  );

  // Mỗi khi 1 phần dữ liệu thay đổi, tự lưu xuống localStorage để không mất
  // khi tắt app / đóng trình duyệt / restart điện thoại.
  useEffect(() => saveState("products", products), [products]);
  useEffect(() => saveState("categories", categories), [categories]);
  useEffect(() => saveState("sales", sales), [sales]);
  useEffect(() => saveState("purchases", purchases), [purchases]);
  useEffect(() => saveState("debts", debts), [debts]);
  useEffect(() => saveState("units", units), [units]);
  useEffect(() => saveState("stockMovements", stockMovements), [stockMovements]);
  useEffect(() => saveState("suppliers", suppliers), [suppliers]);
  useEffect(() => saveState("expenses", expenses), [expenses]);
  useEffect(() => saveState("notifications", notifications), [notifications]);

  /** Ghi thêm 1 (hoặc nhiều) StockMovement mới vào sổ kho - luôn gán id + createdAt tại đây. */
  const pushMovements = (movements: Omit<StockMovement, "id" | "createdAt">[]) => {
    if (movements.length === 0) return;
    const createdAt = dayjs().toISOString();
    setStockMovements((prev) => [
      ...movements.map((m) => ({ ...m, id: nextId("mv"), createdAt })),
      ...prev,
    ]);
  };

  const value = useMemo<AppDataContextValue>(
    () => ({
      products,
      categories,
      sales,
      purchases,
      debts,
      units,
      stockMovements,
      suppliers,
      expenses,
      notifications,

      addProduct: (p) => {
        const id = nextId("p");
        setProducts((prev) => [...prev, { ...p, id }]);
        return id;
      },
      updateProduct: (id, p) =>
        setProducts((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  // QUAN TRỌNG: merge với dữ liệu CŨ trước, rồi mới ghi đè bằng giá trị mới (p).
                  // Form "Sửa sản phẩm" KHÔNG quản lý batches/expiryDate (2 trường này chỉ được
                  // tạo/cập nhật qua Nhập hàng và khi bán hàng) - nếu ghi đè toàn bộ bằng {...p}
                  // như trước đây, mọi lần bấm "Lưu" ở form Sửa sản phẩm (kể cả không đổi gì)
                  // sẽ XÓA SẠCH toàn bộ lô hàng/mã vạch/HSD đã có, dù người dùng không cố ý.
                  ...item,
                  ...p,
                  id,
                }
              : item
          )
        ),
      deleteProduct: (id) => setProducts((prev) => prev.filter((item) => item.id !== id)),

      addCategory: (name) => {
        const id = nextId("cat");
        setCategories((prev) => [...prev, { id, name }]);
        return id;
      },
      updateCategory: (id, name) =>
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c))),
      deleteCategory: (id) => setCategories((prev) => prev.filter((c) => c.id !== id)),

      addUnit: (name) =>
        setUnits((prev) => (prev.includes(name) ? prev : [...prev, name])),

      addPurchase: (items, supplierId) => {
        const total = items.reduce((sum, it) => sum + it.quantity * it.purchasePrice, 0);
        const purchaseId = nextId("pu");
        const purchase: Purchase = {
          id: purchaseId,
          code: `PN${String(purchases.length + 1).padStart(4, "0")}`,
          date: dayjs().toISOString(),
          items: items.map(({ productId, quantity, purchasePrice }) => ({
            productId,
            quantity,
            purchasePrice,
          })),
          total,
          supplierId,
        };
        setPurchases((prev) => [purchase, ...prev]);

        const newMovements: Omit<StockMovement, "id" | "createdAt">[] = [];
        setProducts((prev) =>
          prev.map((prod) => {
            // QUAN TRỌNG: 1 phiếu nhập có thể có NHIỀU dòng cùng 1 sản phẩm (ví dụ 2 mã vạch
            // khác nhau của cùng 1 mặt hàng) -> phải lấy TẤT CẢ các dòng khớp (filter), không
            // chỉ dòng đầu tiên (find) - nếu không sẽ mất số lượng + lô hàng của các dòng sau.
            const lines = items.filter((it) => it.productId === prod.id);
            if (lines.length === 0) return prod;
            // Mỗi dòng nhập hàng tạo ra 1 LÔ HÀNG MỚI (mã vạch + HSD + giá vốn riêng của lô đó),
            // để bán hàng có thể trừ đúng lô theo mã vạch quét được / FEFO, và tính COGS đúng.
            const { product: updated, movement } = applyPurchaseLines(
              prod,
              lines.map((l) => ({
                quantity: l.quantity,
                unitCost: l.purchasePrice,
                expiryDate: l.expiryDate,
                barcode: l.barcode,
                supplierId,
              })),
              () => nextId("batch")
            );
            newMovements.push({ ...movement, referenceId: purchaseId });
            return updated;
          })
        );
        pushMovements(newMovements);
      },

      checkout: (cart, paymentMethod) => {
        const saleId = nextId("s");
        const items: SaleItem[] = [];
        const newMovements: Omit<StockMovement, "id" | "createdAt">[] = [];

        setProducts((prev) =>
          prev.map((prod) => {
            const line = cart.find((l) => l.productId === prod.id);
            if (!line) return prod;
            const { product: updated, movement, costInfo } = applySaleDeduction(
              prod,
              line.quantity,
              line.batchId
            );
            items.push({
              productId: prod.id,
              quantity: line.quantity,
              sellingPrice: prod.sellingPrice,
              batchId: costInfo.batchId,
              unitCost: costInfo.unitCost,
              costOfGoodsSold: costInfo.costOfGoodsSold,
            });
            newMovements.push({ ...movement, referenceId: saleId });
            return updated;
          })
        );

        const total = items.reduce((sum, it) => sum + it.quantity * it.sellingPrice, 0);
        const sale: Sale = {
          id: saleId,
          code: `HD${String(sales.length + 1).padStart(4, "0")}`,
          date: dayjs().toISOString(),
          items,
          total,
          paymentMethod,
        };
        setSales((prev) => [sale, ...prev]);
        pushMovements(newMovements);
        return sale;
      },

      adjustStock: (productId, newStock, reason) => {
        const newMovements: Omit<StockMovement, "id" | "createdAt">[] = [];
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            const { product: updated, movement } = applyAdjustment(p, newStock, reason);
            newMovements.push(movement);
            return updated;
          })
        );
        pushMovements(newMovements);
      },

      payDebt: (debtId, amount, note) =>
        setDebts((prev) =>
          prev.map((d) =>
            d.id === debtId
              ? {
                  ...d,
                  totalPaid: d.totalPaid + amount,
                  history: [
                    { id: nextId("h"), date: dayjs().toISOString(), amount, note },
                    ...d.history,
                  ],
                }
              : d
          )
        ),

      addDebt: (customerName, phone, totalPurchase) =>
        setDebts((prev) => [
          { id: nextId("d"), customerName, phone, totalPurchase, totalPaid: 0, history: [] },
          ...prev,
        ]),

      updateDebt: (id, changes) =>
        setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d))),

      addSupplier: (s) => {
        const id = nextId("sup");
        setSuppliers((prev) => [{ ...s, id, createdAt: dayjs().toISOString() }, ...prev]);
        return id;
      },
      updateSupplier: (id, s) =>
        setSuppliers((prev) => prev.map((item) => (item.id === id ? { ...item, ...s, id } : item))),
      deleteSupplier: (id) => setSuppliers((prev) => prev.filter((item) => item.id !== id)),

      addExpense: (e) =>
        setExpenses((prev) => [{ ...e, id: nextId("exp"), createdAt: dayjs().toISOString() }, ...prev]),
      updateExpense: (id, e) =>
        setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...e, id } : item))),
      deleteExpense: (id) => setExpenses((prev) => prev.filter((item) => item.id !== id)),

      recordLoss: (productId, reason, quantity, note) => {
        const movementType = reason === "DAMAGED" ? "DAMAGE" : reason === "EXPIRED" ? "EXPIRED" : "ADJUSTMENT";
        const reasonText = `${LOSS_REASON_LABELS[reason]}${note ? `: ${note}` : ""}`;
        const newMovements: Omit<StockMovement, "id" | "createdAt">[] = [];
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            const { product: updated, movement } = applyLoss(p, quantity, movementType, reasonText);
            newMovements.push(movement);
            return updated;
          })
        );
        pushMovements(newMovements);
      },

      syncNotifications: () => {
        const candidates = generateNotificationCandidates(products, sales, debts);
        setNotifications((prev) => {
          const existingKeys = new Set(prev.map((n) => n.dedupKey));
          const toAdd = candidates
            .filter((c) => !existingKeys.has(c.dedupKey))
            .map((c) => ({ ...c, id: nextId("ntf"), createdAt: dayjs().toISOString(), read: false }));
          return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
        });
      },
      markNotificationRead: (id) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllNotificationsRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
      dismissNotification: (id) => setNotifications((prev) => prev.filter((n) => n.id !== id)),

      exportBackup: () =>
        createBackup({
          products,
          categories,
          sales,
          purchases,
          debts,
          units,
          stockMovements,
          suppliers,
          expenses,
        }),

      // QUAN TRỌNG: restore là hành động GHI ĐÈ TOÀN BỘ dữ liệu hiện tại - nơi gọi (UI) chịu
      // trách nhiệm validate file + hỏi xác nhận người dùng TRƯỚC KHI gọi hàm này. Ở đây chỉ lo
      // phần ghi dữ liệu, không hỏi lại lần nữa để tránh 2 lớp confirm chồng chéo.
      restoreBackup: (backup) => {
        const d = backup.data;
        setProducts(migrateProducts(d.products));
        setCategories(d.categories);
        setSales(d.sales);
        setPurchases(d.purchases);
        setDebts(d.debts);
        setUnits(d.units.length > 0 ? d.units : DEFAULT_UNITS);
        setStockMovements(d.stockMovements);
        setSuppliers(d.suppliers);
        setExpenses(d.expenses);
      },

      resetToSampleData: () => {
        clearAllState(STORAGE_KEYS);
        setProducts(migrateProducts(initialProducts));
        setCategories(initialCategories);
        setSales(initialSales);
        setPurchases(initialPurchases);
        setDebts(initialDebts);
        setUnits(DEFAULT_UNITS);
        setStockMovements([]);
        setSuppliers([]);
        setExpenses([]);
        setNotifications([]);
      },

      resetAllData: () => {
        clearAllState(STORAGE_KEYS);
        setProducts([]);
        setCategories([]);
        setSales([]);
        setPurchases([]);
        setDebts([]);
        setUnits(DEFAULT_UNITS);
        setStockMovements([]);
        setSuppliers([]);
        setExpenses([]);
        setNotifications([]);
      },
    }),
    [
      products,
      categories,
      sales,
      purchases,
      debts,
      units,
      stockMovements,
      suppliers,
      expenses,
      notifications,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
