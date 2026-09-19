export type Product = {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
};

export type CartItem = Product & { qty: number };

export type Sale = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paid: number;
  change: number;
};

export type Settings = {
  storeName: string;
  address: string;
  phone: string;
  scannerMode: "hardware" | "camera" | "auto";
  taxEnabled: boolean;
  taxRate: number;
};