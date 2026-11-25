// Badge status per domain dokumen. Tiap dokumen punya bahasa statusnya sendiri
// (quotation: Draft/Sent/Approved/Rejected; SO: matriks kirim x tagih; DO: Partial/Completed;
// invoice: Lunas/Parsial/Belum Bayar), jadi komponennya terpisah — yang disatukan
// di sini adalah tempatnya, memakai kelas badge-* bersama dari globals.css.

export function QuotationStatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'Draft':
      return <span className="badge-neutral">Draft</span>;
    case 'Sent':
      return (
        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block">
          Dikirim
        </span>
      );
    case 'Approved':
      return <span className="badge-success">Disetujui</span>;
    case 'Rejected':
      return <span className="badge-danger">Ditolak</span>;
    default:
      return <span className="badge-neutral">{status}</span>;
  }
}

export function SalesOrderStatusBadge({ status, hasInvoice }: { status: string | null; hasInvoice: boolean }) {
  const base =
    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block border";

  if (status === 'Cancelled')
    return <span className="badge-danger">Batal</span>;

  // Tentukan level pengiriman
  const delivery =
    status === 'Completed' ? 'full'
    : status === 'Partial' ? 'partial'
    : 'none';

  // === SUDAH ada invoice ===
  if (hasInvoice) {
    if (delivery === 'full')
      return <span className={`${base} bg-purple-100 text-purple-700 border-purple-200`}>Terkirim &amp; Ditagih</span>;
    if (delivery === 'partial')
      return <span className={`${base} bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200`}>Parsial &amp; Ditagih</span>;
    // belum kirim tapi sudah ditagih
    return <span className={`${base} bg-indigo-100 text-indigo-700 border-indigo-200`}>Ditagih</span>;
  }

  // === BELUM ada invoice ===
  if (delivery === 'full')
    return <span className={`${base} bg-teal-100 text-teal-700 border-teal-200`}>Terkirim</span>;
  if (delivery === 'partial')
    return <span className={`${base} bg-blue-100 text-blue-700 border-blue-200`}>Parsial</span>;
  // belum apa-apa
  return <span className="badge-neutral">Open</span>;
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  if (status === "Partial")
    return (
      <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
        ⏳ Partial (Sebagian)
      </span>
    );
  if (status === "Completed")
    return (
      <span className="bg-teal-100 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
        ✅ Selesai (Full)
      </span>
    );
  return (
    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
      {status}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status?.toLowerCase()) {
    case "paid":
      return <span className="badge-success">Lunas</span>;
    case "partial":
      return (
        <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block">
          Parsial
        </span>
      );
    case "cancelled":
    case "canceled":
      return (
        <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block">
          Dibatalkan
        </span>
      );
    case "unpaid":
    default:
      return <span className="badge-danger">Belum Bayar</span>;
  }
}
