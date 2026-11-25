// Ambil pesan yang bisa ditampilkan dari nilai error tak dikenal (hasil catch).
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Terjadi kesalahan tak terduga";
}
