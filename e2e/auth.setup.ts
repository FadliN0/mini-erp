import { test as setup, expect } from "@playwright/test";

// Login sekali lewat UI, lalu simpan sesi (cookie) agar dipakai semua test.
// Kredensial TIDAK ditulis di kode — dibaca dari environment variable:
//   E2E_USERNAME  (username atau email akun yang sudah ada)
//   E2E_PASSWORD
const authFile = "e2e/.auth/user.json";

setup("login dan simpan sesi", async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "E2E_USERNAME dan E2E_PASSWORD wajib diisi. Lihat e2e/README.md.",
    );
  }

  await page.goto("/login");
  await page.locator('form input[type="text"]').fill(username);
  await page.locator('form input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: authFile });
});
