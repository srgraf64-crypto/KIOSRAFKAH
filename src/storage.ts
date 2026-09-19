import { Product, Sale, Settings } from "./types";
import { defaultProducts, defaultSettings } from "./data";

const read = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
};

export const db = {
  products: (): Product[] => read("pos_products", defaultProducts),
  sales: (): Sale[] => read("pos_sales", []),
  settings: (): Settings => read("pos_settings", defaultSettings),
  saveProducts: (v: Product[]) => localStorage.setItem("pos_products", JSON.stringify(v)),
  saveSales: (v: Sale[]) => localStorage.setItem("pos_sales", JSON.stringify(v)),
  saveSettings: (v: Settings) => localStorage.setItem("pos_settings", JSON.stringify(v))
};