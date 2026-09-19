import { Product, Settings } from "./types";

export const defaultProducts: Product[] = [
  { id:"p1", name:"Air Mineral 600ml", barcode:"8999990000011", sku:"AM600", category:"Minuman", price:4000, cost:2500, stock:35, minStock:10, unit:"pcs", active:true },
  { id:"p2", name:"Teh Botol 350ml", barcode:"8999990000028", sku:"TB350", category:"Minuman", price:5000, cost:3200, stock:18, minStock:8, unit:"pcs", active:true },
  { id:"p3", name:"Indomie Goreng", barcode:"8999990000035", sku:"IMGOR", category:"Makanan", price:3500, cost:2200, stock:42, minStock:10, unit:"pcs", active:true },
  { id:"p4", name:"Roti Cokelat", barcode:"8999990000042", sku:"RTCOK", category:"Makanan", price:7000, cost:4500, stock:9, minStock:10, unit:"pcs", active:true },
  { id:"p5", name:"Kopi Sachet", barcode:"8999990000059", sku:"KPSCH", category:"Minuman", price:2500, cost:1500, stock:50, minStock:10, unit:"pcs", active:true },
  { id:"p6", name:"Sabun Mandi", barcode:"8999990000066", sku:"SBMND", category:"Kebutuhan", price:6500, cost:4200, stock:14, minStock:5, unit:"pcs", active:true }
];

export const defaultSettings: Settings = {
  storeName: "Toko Kita",
  address: "Alamat toko",
  phone: "",
  scannerMode: "auto",
  taxEnabled: false,
  taxRate: 11
};