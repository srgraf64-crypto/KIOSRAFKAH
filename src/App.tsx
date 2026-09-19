import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3, Boxes, Calculator, Camera, ChevronRight, CircleDollarSign,
  ClipboardList, CreditCard, FileText, LayoutDashboard, PackagePlus,
  Search, Settings as SettingsIcon, ShoppingCart, Store, Trash2, Users,
  WalletCards, X, Plus, Minus, ScanBarcode, RefreshCw
} from "lucide-react";
import { Product, CartItem, Sale, Settings } from "./types";
import { db } from "./storage";
import { scanWithCamera, startHardwareScanner } from "./scanner";

type Page = "dashboard" | "pos" | "products" | "inventory" | "reports" | "finance" | "customers" | "settings";

const money = (n:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);

function App() {
  const [page, setPage] = useState<Page>("pos");
  const [products, setProducts] = useState<Product[]>(db.products());
  const [sales, setSales] = useState<Sale[]>(db.sales());
  const [settings, setSettings] = useState<Settings>(db.settings());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("Cash");
  const [paid, setPaid] = useState(0);
  const [toast, setToast] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopCamera = useRef<null | (() => void)>(null);

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map(p=>p.category)))], [products]);
  const filtered = products.filter(p => p.active && (category==="Semua" || p.category===category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase())));

  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const tax = settings.taxEnabled ? Math.round(Math.max(0, subtotal-discount)*settings.taxRate/100) : 0;
  const total = Math.max(0, subtotal-discount)+tax;
  const change = Math.max(0, paid-total);

  useEffect(() => {
    if (settings.scannerMode === "camera") return;
    return startHardwareScanner((barcode) => findAndAdd(barcode));
  }, [products, settings.scannerMode]);

  useEffect(() => {
    if (toast) {
      const t=setTimeout(()=>setToast(""),2200);
      return ()=>clearTimeout(t);
    }
  }, [toast]);

  function findAndAdd(barcode:string) {
    const product = products.find(p=>p.barcode===barcode && p.active);
    if (!product) { setToast(`Barcode ${barcode}: produk tidak ditemukan`); return; }
    if (product.stock <= 0) { setToast("Stok produk habis"); return; }
    setCart(c => {
      const existing=c.find(i=>i.id===product.id);
      if (existing) {
        if (existing.qty >= product.stock) return c;
        return c.map(i=>i.id===product.id?{...i,qty:i.qty+1}:i);
      }
      return [...c,{...product,qty:1}];
    });
    setToast(`${product.name} ditambahkan`);
  }

  function addProduct(p:Product) { findAndAdd(p.barcode); }

  async function openCamera() {
    setCameraOpen(true);
    setTimeout(async()=>{
      if (!videoRef.current) return;
      try {
        stopCamera.current = await scanWithCamera(videoRef.current, barcode => {
          findAndAdd(barcode);
          setCameraOpen(false);
          stopCamera.current?.();
          stopCamera.current=null;
        });
      } catch(e) {
        setToast(e instanceof Error ? e.message : "Kamera tidak dapat dibuka");
        setCameraOpen(false);
      }
    },50);
  }

  function closeCamera() {
    stopCamera.current?.(); stopCamera.current=null; setCameraOpen(false);
  }

  function updateQty(id:string, delta:number) {
    setCart(c => c.map(i => {
      if(i.id!==id) return i;
      const next=i.qty+delta;
      return next<=0 ? null : {...i, qty:Math.min(next,i.stock)};
    }).filter(Boolean) as CartItem[]);
  }

  function checkout() {
    if(!cart.length) return setToast("Keranjang masih kosong");
    if(payment==="Cash" && paid<total) return setToast("Uang pembayaran belum cukup");
    const sale:Sale={id:`TRX-${Date.now()}`,createdAt:new Date().toISOString(),items:cart,subtotal,discount,tax,total,paymentMethod:payment,paid:payment==="Cash"?paid:total,change};
    const nextSales=[sale,...sales]; db.saveSales(nextSales); setSales(nextSales);
    const nextProducts=products.map(p=> {
      const item=cart.find(i=>i.id===p.id);
      return item ? {...p,stock:p.stock-item.qty} : p;
    });
    db.saveProducts(nextProducts); setProducts(nextProducts);
    setCart([]); setDiscount(0); setPaid(0);
    setToast(`Transaksi berhasil • ${sale.id}`);
  }

  const nav = [
    ["pos","Kasir",ShoppingCart],["dashboard","Dashboard",LayoutDashboard],["products","Produk",Boxes],
    ["inventory","Inventory",PackagePlus],["reports","Laporan",BarChart3],["finance","Keuangan",WalletCards],
    ["customers","Pelanggan",Users],["settings","Pengaturan",SettingsIcon]
  ] as const;

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Store size={21}/></div><div><b>{settings.storeName}</b><small>POS SYSTEM</small></div></div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="side-footer"><div className="status-dot"/> Sistem siap digunakan</div>
    </aside>

    <main className="main">
      <header className="topbar"><div><h1>{nav.find(n=>n[0]===page)?.[1]}</h1><p>{page==="pos"?"Transaksi penjualan":"Kelola operasional toko Anda"}</p></div><div className="top-actions"><span className="connection">● Online</span><button className="icon-btn" onClick={()=>setPage("settings")}><SettingsIcon size={19}/></button></div></header>

      {page==="pos" && <POS filtered={filtered} categories={categories} category={category} setCategory={setCategory} search={search} setSearch={setSearch}
        addProduct={addProduct} openCamera={openCamera} cart={cart} updateQty={updateQty} subtotal={subtotal} discount={discount} setDiscount={setDiscount}
        tax={tax} total={total} payment={payment} setPayment={setPayment} paid={paid} setPaid={setPaid} change={change} checkout={checkout}/>}
      {page==="dashboard" && <Dashboard sales={sales} products={products}/>}
      {page==="products" && <Products products={products} setProducts={setProducts} setToast={setToast}/>}
      {page==="inventory" && <Inventory products={products}/>}
      {page==="reports" && <Reports sales={sales}/>}
      {page==="finance" && <Finance sales={sales}/>}
      {page==="customers" && <Customers/>}
      {page==="settings" && <SettingsPage settings={settings} setSettings={s=>{setSettings(s);db.saveSettings(s)}} setToast={setToast}/>}

      {cameraOpen && <div className="modal-backdrop"><div className="scanner-modal"><button className="close" onClick={closeCamera}><X/></button><div className="scanner-head"><ScanBarcode/><div><b>Scan Barcode</b><small>Arahkan kamera ke barcode</small></div></div><div className="video-wrap"><video ref={videoRef} muted playsInline/><div className="scan-line"/></div><p>Pastikan barcode berada di dalam area pemindaian.</p></div></div>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  </div>
}

function POS({filtered,categories,category,setCategory,search,setSearch,addProduct,openCamera,cart,updateQty,subtotal,discount,setDiscount,tax,total,payment,setPayment,paid,setPaid,change,checkout}:any){
  return <section className="pos-grid">
    <div className="products-panel">
      <div className="toolbar"><div className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, SKU, barcode..."/></div><button className="scan-btn" onClick={openCamera}><Camera size={18}/> Scan Kamera</button></div>
      <div className="chips">{categories.map((c:string)=><button className={category===c?"chip active":"chip"} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <div className="product-grid">{filtered.map((p:Product)=><button className="product-card" key={p.id} onClick={()=>addProduct(p)}><div className="product-thumb">{p.name.charAt(0)}</div><div className="product-info"><b>{p.name}</b><small>{p.barcode}</small><div><strong>{money(p.price)}</strong><span className={p.stock<=p.minStock?"low":""}>Stok {p.stock}</span></div></div></button>)}</div>
    </div>
    <aside className="cart-panel">
      <div className="cart-title"><div><b>Keranjang</b><small>{cart.reduce((a: number,i:CartItem)=>a+i.qty,0)} item</small></div><button className="clear" onClick={()=>cart.length&&confirm("Kosongkan keranjang?")&&location.reload()}>Kosongkan</button></div>
      <div className="cart-items">{cart.length===0?<div className="empty"><ShoppingCart size={35}/><b>Keranjang kosong</b><span>Scan atau pilih produk untuk memulai</span></div>:cart.map((i:CartItem)=><div className="cart-item" key={i.id}><div className="mini">{i.name.charAt(0)}</div><div className="cart-name"><b>{i.name}</b><small>{money(i.price)}</small></div><div className="qty"><button onClick={()=>updateQty(i.id,-1)}><Minus size={13}/></button><b>{i.qty}</b><button onClick={()=>updateQty(i.id,1)}><Plus size={13}/></button></div><strong>{money(i.price*i.qty)}</strong></div>)}</div>
      <div className="checkout">
        <div className="line"><span>Subtotal</span><b>{money(subtotal)}</b></div>
        <div className="line"><span>Diskon</span><input className="small-input" type="number" min="0" value={discount} onChange={e=>setDiscount(Number(e.target.value)||0)}/></div>
        <div className="line"><span>Pajak</span><b>{money(tax)}</b></div>
        <div className="total-line"><span>Total</span><strong>{money(total)}</strong></div>
        <div className="payment-tabs">{["Cash","QRIS","Transfer","E-Wallet","Kartu"].map((p)=><button className={payment===p?"selected":""} key={p} onClick={()=>setPayment(p)}>{p}</button>)}</div>
        {payment==="Cash" && <div className="cash-row"><label>Uang diterima<input type="number" value={paid||""} onChange={e=>setPaid(Number(e.target.value)||0)} placeholder="0"/></label><label>Kembalian<div className="change">{money(change)}</div></label></div>}
        <button className="pay-btn" disabled={!cart.length} onClick={checkout}><CreditCard size={19}/> Bayar {money(total)}</button>
      </div>
    </aside>
  </section>
}

function Dashboard({sales,products}:{sales:Sale[],products:Product[]}) {
  const today=new Date().toDateString(); const todaySales=sales.filter(s=>new Date(s.createdAt).toDateString()===today);
  const revenue=todaySales.reduce((a,s)=>a+s.total,0); const low=products.filter(p=>p.stock<=p.minStock);
  return <div className="content"><div className="stats">{[
    ["Omzet hari ini",money(revenue),CircleDollarSign],["Transaksi",todaySales.length.toString(),ClipboardList],["Rata-rata transaksi",money(todaySales.length?revenue/todaySales.length:0),Calculator],["Stok menipis",low.length.toString(),Boxes]
  ].map(([label,value,Icon])=><div className="stat" key={label as string}><div className="stat-icon"><Icon size={20}/></div><div><small>{label}</small><strong>{value}</strong></div></div>)}</div><div className="two-col"><div className="card"><div className="card-head"><b>Transaksi terbaru</b><span>{sales.length} total</span></div>{sales.slice(0,6).map(s=><div className="sale-row" key={s.id}><div><b>{s.id}</b><small>{new Date(s.createdAt).toLocaleString("id-ID")}</small></div><span>{s.paymentMethod}</span><strong>{money(s.total)}</strong></div>)}{!sales.length&&<div className="empty compact">Belum ada transaksi.</div>}</div><div className="card"><div className="card-head"><b>Stok perlu diperhatikan</b></div>{low.map(p=><div className="sale-row" key={p.id}><div><b>{p.name}</b><small>Minimum {p.minStock}</small></div><strong className="low">{p.stock} {p.unit}</strong></div>)}{!low.length&&<div className="empty compact">Semua stok aman.</div>}</div></div></div>
}

function Products({products,setProducts,setToast}:{products:Product[],setProducts:(p:Product[])=>void,setToast:(s:string)=>void}) {
  const [q,setQ]=useState(""); const [open,setOpen]=useState(false); const [draft,setDraft]=useState<Partial<Product>>({});
  const list=products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||p.barcode.includes(q)||p.sku.toLowerCase().includes(q.toLowerCase()));
  function save(){ if(!draft.name||!draft.barcode||!draft.price) return setToast("Nama, barcode, dan harga wajib diisi"); const p:Product={id:crypto.randomUUID(),name:draft.name,barcode:draft.barcode,sku:draft.sku||"",category:draft.category||"Umum",price:Number(draft.price),cost:Number(draft.cost||0),stock:Number(draft.stock||0),minStock:Number(draft.minStock||5),unit:draft.unit||"pcs",active:true}; const next=[...products,p];setProducts(next);db.saveProducts(next);setOpen(false);setDraft({});setToast("Produk ditambahkan");}
  return <div className="content"><div className="page-toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari produk..."/></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={18}/> Tambah Produk</button></div><div className="table-card"><table><thead><tr><th>Produk</th><th>Barcode</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th></tr></thead><tbody>{list.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.sku}</small></td><td>{p.barcode}</td><td>{p.category}</td><td>{money(p.price)}</td><td className={p.stock<=p.minStock?"low":""}>{p.stock} {p.unit}</td><td><span className="badge">{p.active?"Aktif":"Nonaktif"}</span></td></tr>)}</tbody></table></div>{open&&<div className="modal-backdrop"><div className="form-modal"><button className="close" onClick={()=>setOpen(false)}><X/></button><h2>Tambah Produk</h2>{[["name","Nama produk"],["barcode","Barcode"],["sku","SKU"],["category","Kategori"],["price","Harga jual"],["cost","Harga beli"],["stock","Stok awal"],["minStock","Stok minimum"],["unit","Satuan"]].map(([k,l])=><label key={k}>{l}<input type={["price","cost","stock","minStock"].includes(k)?"number":"text"} value={(draft as any)[k]||""} onChange={e=>setDraft({...draft,[k]:e.target.value})}/></label>)}<button className="primary full" onClick={save}>Simpan Produk</button></div></div>}</div>
}

function Inventory({products}:{products:Product[]}){return <div className="content"><div className="stats"><div className="stat"><div className="stat-icon"><Boxes/></div><div><small>Total SKU</small><strong>{products.length}</strong></div></div><div className="stat"><div className="stat-icon"><RefreshCw/></div><div><small>Total unit stok</small><strong>{products.reduce((a,p)=>a+p.stock,0)}</strong></div></div><div className="stat"><div className="stat-icon"><PackagePlus/></div><div><small>Stok menipis</small><strong>{products.filter(p=>p.stock<=p.minStock).length}</strong></div></div></div><div className="table-card"><table><thead><tr><th>Produk</th><th>Stok</th><th>Minimum</th><th>Status</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.stock}</td><td>{p.minStock}</td><td><span className={p.stock<=p.minStock?"badge danger":"badge"}>{p.stock<=p.minStock?"Perlu restock":"Aman"}</span></td></tr>)}</tbody></table></div></div>}

function Reports({sales}:{sales:Sale[]}){const revenue=sales.reduce((a,s)=>a+s.total,0);return <div className="content"><div className="stats"><div className="stat"><div className="stat-icon"><BarChart3/></div><div><small>Total penjualan</small><strong>{money(revenue)}</strong></div></div><div className="stat"><div className="stat-icon"><ClipboardList/></div><div><small>Total transaksi</small><strong>{sales.length}</strong></div></div></div><div className="card"><div className="card-head"><b>Riwayat transaksi</b><span>Data lokal</span></div>{sales.map(s=><div className="sale-row" key={s.id}><div><b>{s.id}</b><small>{new Date(s.createdAt).toLocaleString("id-ID")}</small></div><span>{s.items.reduce((a,i)=>a+i.qty,0)} item • {s.paymentMethod}</span><strong>{money(s.total)}</strong></div>)}</div></div>}

function Finance({sales}:{sales:Sale[]}){const revenue=sales.reduce((a,s)=>a+s.total,0);const gross=sales.reduce((a,s)=>a+s.items.reduce((x,i)=>x+(i.price-i.cost)*i.qty,0),0);return <div className="content"><div className="stats"><div className="stat"><div className="stat-icon"><CircleDollarSign/></div><div><small>Pendapatan</small><strong>{money(revenue)}</strong></div></div><div className="stat"><div className="stat-icon"><WalletCards/></div><div><small>Estimasi laba kotor</small><strong>{money(gross)}</strong></div></div></div><div className="card"><div className="card-head"><b>Ringkasan pembayaran</b></div>{["Cash","QRIS","Transfer","E-Wallet","Kartu"].map(m=><div className="sale-row" key={m}><div><b>{m}</b></div><strong>{money(sales.filter(s=>s.paymentMethod===m).reduce((a,s)=>a+s.total,0))}</strong></div>)}</div></div>}

function Customers(){return <div className="content"><div className="empty-page"><Users size={42}/><h2>Member & Pelanggan</h2><p>Struktur halaman siap dikembangkan ke database pelanggan, poin, dan riwayat pembelian.</p></div></div>}

function SettingsPage({settings,setSettings,setToast}:{settings:Settings,setSettings:(s:Settings)=>void,setToast:(s:string)=>void}) {
  const update=(k:keyof Settings,v:any)=>setSettings({...settings,[k]:v});
  return <div className="content"><div className="settings-grid"><div className="card"><div className="card-head"><b>Toko</b></div><label>Nama toko<input value={settings.storeName} onChange={e=>update("storeName",e.target.value)}/></label><label>Alamat<textarea value={settings.address} onChange={e=>update("address",e.target.value)}/></label><label>Nomor telepon<input value={settings.phone} onChange={e=>update("phone",e.target.value)}/></label></div><div className="card"><div className="card-head"><b>Scanner</b></div><p className="hint">Hardware HID bekerja seperti keyboard. Web tidak perlu driver khusus.</p><label>Mode scanner<select value={settings.scannerMode} onChange={e=>update("scannerMode",e.target.value)}><option value="auto">Otomatis</option><option value="hardware">Hardware Scanner</option><option value="camera">Camera Scanner</option></select></label><button className="secondary" onClick={()=>setToast("Scanner hardware aktif: coba scan barcode dengan scanner.")}><ScanBarcode size={17}/> Tes scanner hardware</button></div><div className="card"><div className="card-head"><b>Pajak</b></div><label className="switch-row"><span>Aktifkan pajak</span><input type="checkbox" checked={settings.taxEnabled} onChange={e=>update("taxEnabled",e.target.checked)}/></label><label>Tarif pajak (%)<input type="number" value={settings.taxRate} onChange={e=>update("taxRate",Number(e.target.value))}/></label></div><div className="card"><div className="card-head"><b>Catatan implementasi</b></div><p className="hint">Versi ini menyimpan data demo di localStorage agar langsung bisa dijalankan. Untuk produksi, pindahkan autentikasi, database, laporan, sinkronisasi offline, dan permission ke backend PostgreSQL.</p></div></div></div>
}

export default App;