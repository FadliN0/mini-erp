// Formatter bersama untuk seluruh dashboard (sebelumnya fmtRp disalin di 10+ file).

// "Rp 1.234.567"
export function fmtRp(num: number): string {
  return `Rp ${Number(num).toLocaleString("id-ID")}`;
}

// Bentuk ringkas untuk kartu target: "Rp 1,5 Jt" / "Rp 2,0M", penuh di bawah Rp 1 jt.
export function fmtRpCompact(num: number): string {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Number(num).toLocaleString("id-ID")}`;
}

// "02 Jan 2026" (gaya en-GB, dipakai di lembar cetak invoice)
export function fmtDateGB(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// "02/01/2026" (Asia/Jakarta, dipakai di laporan); null → "-"
export function fmtDateID(date: string | Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
