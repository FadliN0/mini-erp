import { test, expect } from "@playwright/test";

// Smoke test baca-saja: memastikan halaman-halaman utama bisa dibuka setelah
// login dan judulnya tampil. Tidak membuat/mengubah data apa pun.

const pages: { path: string; heading: string | RegExp }[] = [
  { path: "/dashboard", heading: /selamat/i },
  { path: "/dashboard/quotations", heading: "Dokumen Quotation" },
  { path: "/dashboard/sales-orders", heading: "Sales Order (SO)" },
  { path: "/dashboard/delivery-orders", heading: "Surat Jalan (Delivery Order)" },
  { path: "/dashboard/invoices", heading: "Tagihan (Invoices)" },
  { path: "/dashboard/products", heading: "Master Data Produk" },
  { path: "/dashboard/customers", heading: "Master Pelanggan" },
  { path: "/dashboard/reports", heading: "Pusat Laporan Eksekutif" },
  { path: "/dashboard/tracking", heading: "Tracking Dokumen Operasional" },
];

test.describe("halaman utama (sudah login)", () => {
  for (const { path, heading } of pages) {
    test(`membuka ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    });
  }
});

test.describe("tanpa login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("dashboard mengarahkan ke halaman login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Masuk ke Dashboard" }),
    ).toBeVisible();
  });
});
