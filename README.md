# Kasir POS

Starter POS web app yang bisa langsung dijalankan dengan Vite.

## Menjalankan

```bash
npm install
npm run dev
```

Lalu buka alamat Vite yang tampil di terminal.

## Fitur yang sudah berjalan

- POS / keranjang
- Pencarian produk
- Kategori
- Hardware barcode scanner HID/keyboard
- Camera scanner via BarcodeDetector jika browser mendukung
- Cash, QRIS, Transfer, E-Wallet, Kartu
- Hitung kembalian
- Checkout dan pengurangan stok
- Riwayat transaksi
- Dashboard
- Produk
- Inventory
- Laporan dasar
- Keuangan dasar
- Pengaturan toko/scanner/pajak
- Responsive tablet/HP/desktop
- Penyimpanan demo via localStorage

## Catatan produksi

Versi ini sengaja dibuat sebagai fondasi frontend yang langsung dapat dijalankan. Untuk produksi, backend Node.js + PostgreSQL perlu ditambahkan untuk:

- Authentication/session
- Role & permission server-side
- Database transaksi
- Inventory atomic transaction
- Supplier/purchase
- Customer/member
- Refund
- Audit log
- Offline sync/idempotency
- Backup
- Multi-device
- AI Assistant

Scanner USB/OTG yang bekerja sebagai HID biasanya mengirim karakter seperti keyboard sehingga browser dapat menangkap hasil scan. Browser tidak dapat menjamin akses langsung ke semua perangkat USB; scanner HID adalah pendekatan paling kompatibel.

## Contoh barcode demo

- 8999990000011 — Air Mineral 600ml
- 8999990000028 — Teh Botol 350ml
- 8999990000035 — Indomie Goreng
- 8999990000042 — Roti Cokelat
- 8999990000059 — Kopi Sachet
- 8999990000066 — Sabun Mandi
