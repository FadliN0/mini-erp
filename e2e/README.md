# E2E Smoke Test (Playwright)

Test baca-saja: login, lalu membuka dashboard dan halaman daftar utama
(quotation, sales order, delivery order, invoice, produk, pelanggan,
laporan, tracking) dan memastikan judul tiap halaman tampil. Tidak ada
data yang dibuat/diubah/dihapus oleh test ini.

## Persiapan (sekali saja)

```bash
npx playwright install chromium
```

## Menjalankan

Kredensial dibaca dari environment variable — pakai akun yang sudah ada
(username atau email). Jangan pernah menulis password di kode/commit.

```bash
# Windows PowerShell:
#   $env:E2E_USERNAME="admin"; $env:E2E_PASSWORD="..."; npm run test:e2e
# macOS/Linux:
E2E_USERNAME=admin E2E_PASSWORD='...' npm run test:e2e
```

Secara default test menyalakan `npm run dev` sendiri dan menguji
`http://localhost:3000`. Untuk menguji deployment yang sudah jadi
(preview/production), arahkan targetnya:

```bash
E2E_BASE_URL=https://<alamat-deployment> E2E_USERNAME=... E2E_PASSWORD='...' npm run test:e2e
```

Sesi login disimpan di `e2e/.auth/user.json` (sudah di-.gitignore, jangan
di-commit — isinya cookie sesi aktif).
