# CV HJP — DMS (mini-erp)

Sistem ERP internal **CV Harmonisindo Jaya Part** untuk mengelola alur dokumen
penjualan suku cadang alat berat, dari penawaran sampai pembayaran.

## Alur Dokumen

```
Quotation → Sales Order → Delivery Order → Invoice → Payment
```

Dilengkapi modul Customers (multi-alamat), Products, Target pelanggan &
perusahaan (KPI), Laporan keuangan, dan Tracking dokumen.

## Teknologi

- **Next.js 15** (App Router) + React 18 + TypeScript
- **Supabase** (PostgreSQL, Auth, Row Level Security)
- **Tailwind CSS** untuk UI
- Deployment: **Vercel**

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buat file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # hanya server, jangan diekspos
```

## Peran Pengguna

| Role      | Hak akses utama                                                        |
|-----------|------------------------------------------------------------------------|
| `admin`   | Mutasi operasional (buat/ubah/hapus dokumen, produk, pelanggan)        |
| `atasan`  | Pencatatan pembayaran, kelola pengguna, target, laporan, cancel invoice |

Penegakan ganda: guard di Server Actions (`lib/auth-guards.ts`) dan Row Level
Security di database.

## Pemeriksaan Kualitas

```bash
npx tsc --noEmit     # cek tipe
npx eslint app components lib
npm run build        # build produksi
```

CI (GitHub Actions) menjalankan ketiganya otomatis pada setiap pull request.

## Struktur Penting

- `app/dashboard/` — halaman & komponen per modul
- `lib/database.types.ts` — tipe hasil skema Supabase (regenerasi:
  `supabase gen types typescript --project-id <ref>`)
- `lib/format.ts` — formatter Rupiah/tanggal bersama
