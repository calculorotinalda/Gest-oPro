import logoUrl from "@assets/logo_calculorotina.png";

const BRAND_COLOR = "#1e3a5f";
const BRAND_LIGHT = "#e8edf5";
const ACCENT = "#2563eb";

const previewToolbarStyles = `
  /* ── Preview toolbar (hidden when printing) ── */
  #preview-toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #1e3a5f; color: white;
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    font-family: Arial, Helvetica, sans-serif; font-size: 13px;
    gap: 16px;
  }
  #preview-toolbar .toolbar-left { display: flex; flex-direction: column; gap: 2px; }
  #preview-toolbar .doc-title { font-size: 14px; font-weight: 700; color: #fff; }
  #preview-toolbar .doc-hint { font-size: 11px; color: #93c5fd; }
  #preview-toolbar .toolbar-right { display: flex; gap: 10px; align-items: center; }
  #preview-toolbar button {
    padding: 7px 18px; border-radius: 5px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: opacity 0.15s;
  }
  #preview-toolbar button:hover { opacity: 0.88; }
  #preview-toolbar .btn-print {
    background: #2563eb; color: white;
  }
  #preview-toolbar .btn-close {
    background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3);
  }
  @media screen {
    body { background: #64748b !important; padding-top: 56px !important; padding-bottom: 32px !important; }
    .page-wrapper {
      background: white;
      width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      padding: 14mm 16mm;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25);
      border-radius: 2px;
    }
  }
  @media print {
    #preview-toolbar { display: none !important; }
    body { background: white !important; padding: 0 !important; }
    .page-wrapper { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: auto !important; }
  }
`;

const baseStyles = `
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #1a1a1a; }
  .page { width: 100%; min-height: 267mm; display: flex; flex-direction: column; }

  /* ── Header ── */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 3px solid ${BRAND_COLOR}; margin-bottom: 14px; }
  .company-block {}
  .company-name { font-size: 17pt; font-weight: 700; color: ${BRAND_COLOR}; line-height: 1.1; }
  .company-sub { font-size: 7.5pt; color: #666; margin-top: 3px; line-height: 1.5; }
  .doc-block { text-align: right; }
  .doc-type-label { font-size: 14pt; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: 0.5px; }
  .doc-number { font-size: 11pt; font-weight: 700; color: #222; margin-top: 2px; }
  .doc-meta { font-size: 8pt; color: #666; margin-top: 3px; line-height: 1.6; }
  .doc-status { display: inline-block; margin-top: 4px; padding: 2px 8px; border-radius: 3px; font-size: 7.5pt; font-weight: 700; }
  .status-emitida { background: #dbeafe; color: #1d4ed8; }
  .status-paga { background: #d1fae5; color: #065f46; }
  .status-anulada { background: #fee2e2; color: #991b1b; }
  .status-registada { background: #f3f4f6; color: #374151; }

  /* ── Party boxes ── */
  .parties { display: flex; gap: 12px; margin-bottom: 14px; }
  .party-box { flex: 1; padding: 9px 11px; background: ${BRAND_LIGHT}; border-left: 3px solid ${BRAND_COLOR}; border-radius: 0 4px 4px 0; }
  .party-label { font-size: 7pt; font-weight: 700; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .party-name { font-size: 10pt; font-weight: 700; color: #111; }
  .party-detail { font-size: 8pt; color: #555; margin-top: 2px; line-height: 1.5; }

  /* ── Items table ── */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .items-table thead tr { background: ${BRAND_COLOR}; }
  .items-table th { color: white; padding: 5px 7px; font-size: 8pt; font-weight: 600; text-align: left; white-space: nowrap; }
  .items-table th.num { text-align: right; }
  .items-table tbody tr:nth-child(even) { background: #f8fafc; }
  .items-table tbody tr:hover { background: #f0f4f8; }
  .items-table td { padding: 5px 7px; font-size: 8.5pt; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
  .items-table td.num { text-align: right; white-space: nowrap; }
  .items-table td.code { font-family: monospace; font-size: 8pt; color: #555; }
  .exemption-note { font-size: 7pt; color: #b45309; margin-top: 1px; }

  /* ── Bottom section ── */
  .bottom-section { display: flex; gap: 16px; margin-top: auto; }
  .vat-section { flex: 1; }
  .vat-title { font-size: 7.5pt; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
  .vat-table { width: 100%; border-collapse: collapse; }
  .vat-table th { font-size: 7.5pt; background: #f1f5f9; padding: 4px 6px; text-align: right; font-weight: 600; color: #444; border: 1px solid #e2e8f0; }
  .vat-table th:first-child { text-align: left; }
  .vat-table td { font-size: 8pt; padding: 4px 6px; text-align: right; border: 1px solid #e2e8f0; }
  .vat-table td:first-child { text-align: left; }

  .totals-section { width: 240px; flex-shrink: 0; }
  .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 9pt; border-bottom: 1px solid #f0f0f0; }
  .totals-row:last-child { border-bottom: none; }
  .totals-label { color: #666; }
  .totals-value { font-weight: 500; color: #111; }
  .totals-row.grand-total { font-size: 11pt; font-weight: 700; padding-top: 7px; border-top: 2.5px solid ${BRAND_COLOR}; margin-top: 5px; color: ${BRAND_COLOR}; border-bottom: none; }
  .totals-row.grand-total .totals-label { color: ${BRAND_COLOR}; }
  .totals-row.grand-total .totals-value { color: ${BRAND_COLOR}; }

  /* ── Notes & footer ── */
  .notes-section { margin-top: 12px; padding: 8px 10px; background: #fffbeb; border-left: 3px solid #fbbf24; border-radius: 0 4px 4px 0; }
  .notes-label { font-size: 7.5pt; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .notes-text { font-size: 8.5pt; color: #44403c; }

  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }

  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 7pt; color: #aaa; line-height: 1.5; }
  .footer-right { font-size: 7pt; color: #aaa; text-align: right; line-height: 1.5; }

  /* ── Receipt-specific ── */
  .receipt-amounts { display: flex; gap: 12px; margin-bottom: 14px; }
  .amount-box { flex: 1; padding: 10px 12px; border-radius: 5px; text-align: center; }
  .amount-box.total-box { background: #f0fdf4; border: 1.5px solid #86efac; }
  .amount-box.paid-box { background: #eff6ff; border: 1.5px solid #93c5fd; }
  .amount-box.pending-box { background: #fff7ed; border: 1.5px solid #fdba74; }
  .amount-box-label { font-size: 7.5pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .amount-box-value { font-size: 13pt; font-weight: 700; }
  .amount-box.total-box .amount-box-value { color: #15803d; }
  .amount-box.paid-box .amount-box-value { color: #1d4ed8; }
  .amount-box.pending-box .amount-box-value { color: #c2410c; }

  .payment-detail-table { width: 100%; border-collapse: collapse; }
  .payment-detail-table td { padding: 5px 8px; font-size: 9pt; border-bottom: 1px solid #f0f0f0; }
  .payment-detail-table td:first-child { color: #666; font-size: 8.5pt; width: 40%; }
  .payment-detail-table td:last-child { font-weight: 600; }
  .payment-detail-table tr:last-child td { border-bottom: none; }

  .section-heading { font-size: 8pt; font-weight: 700; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 7px; padding-bottom: 3px; border-bottom: 1.5px solid ${BRAND_LIGHT}; }
`;

function eur(val: string | number | null | undefined): string {
  const n = Number(val) || 0;
  return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString("pt-PT");
}

function nowFmt(): string {
  return new Date().toLocaleString("pt-PT");
}

function html(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${previewToolbarStyles}${baseStyles}</style>
</head>
<body>
  <div id="preview-toolbar">
    <div class="toolbar-left">
      <span class="doc-title">${title}</span>
      <span class="doc-hint">Pré-visualização do documento · Sales-Rotina</span>
    </div>
    <div class="toolbar-right">
      <button class="btn-close" onclick="window.close()">✕ Fechar</button>
      <button class="btn-print" onclick="window.print()">🖨 Imprimir</button>
    </div>
  </div>
  <div class="page-wrapper">
    <div class="page">${body}</div>
  </div>
</body>
</html>`;
}

interface Company {
  name?: string | null;
  nif?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
}

function companyBlock(company: Company | null): string {
  const name = company?.name || "A Minha Empresa";
  const nif = company?.nif ? `NIF: ${company.nif}` : "";
  const addr = [company?.address, company?.postalCode && company?.city ? `${company.postalCode} ${company.city}` : company?.city].filter(Boolean).join(" · ");
  const contact = [company?.phone, company?.email].filter(Boolean).join(" · ");
  const sub = [nif, addr, contact].filter(Boolean).join("<br>");
  const activeLogo = company?.logo || logoUrl;
  return `<div class="company-block">
    <img src="${activeLogo}" alt="Logótipo" style="height:40px;max-width:200px;object-fit:contain;display:block;margin-bottom:6px;" />
    <div class="company-name">${name}</div>
    <div class="company-sub">${sub}</div>
  </div>`;
}

const typeLabels: Record<string, string> = {
  FT: "Fatura",
  FS: "Fatura Simplificada",
  FR: "Fatura-Recibo",
  NC: "Nota de Crédito",
  ND: "Nota de Débito",
  VFT: "V/Fatura",
  VFS: "V/Fatura Simplificada",
  VFR: "V/Fatura-Recibo",
  VNC: "V/Nota de Crédito",
  VND: "V/Nota de Débito",
  RC: "Recibo",
  NP: "Nota de Pagamento",
  RG: "Regularização",
};

const statusLabels: Record<string, string> = {
  emitida: "Emitida",
  paga: "Paga",
  anulada: "Anulada",
  registada: "Registada",
};

interface InvoiceItem {
  productCode?: string | null;
  description?: string | null;
  quantity?: string | number | null;
  unitPrice?: string | number | null;
  discount?: string | number | null;
  vatRate?: string | number | null;
  vatExemptionReason?: string | null;
  total?: string | number | null;
}

interface InvoiceDoc {
  type?: string | null;
  number?: string | null;
  date?: string | Date | null;
  dueDate?: string | Date | null;
  status?: string | null;
  customerName?: string | null;
  customerNif?: string | null;
  supplierName?: string | null;
  supplierNif?: string | null;
  subtotal?: string | number | null;
  vatTotal?: string | number | null;
  total?: string | number | null;
  pending?: string | number | null;
  notes?: string | null;
  items?: InvoiceItem[];
}

interface ReceiptDoc {
  type?: string | null;
  number?: string | null;
  date?: string | Date | null;
  customerName?: string | null;
  supplierName?: string | null;
  amount?: string | number | null;
  paymentMethod?: string | null;
  notes?: string | null;
  invoiceRef?: string | null;
  purchaseRef?: string | null;
  bankAccountName?: string | null;
}

function buildVatBreakdown(items: InvoiceItem[]): { rate: string; incidencia: number; iva: number }[] {
  const map: Record<string, { incidencia: number; iva: number }> = {};
  for (const item of items) {
    const rate = String(item.vatRate || "0").replace(".00", "");
    const lineTotal = Number(item.total) || 0;
    const vatRate = Number(rate) / 100;
    const incidencia = vatRate > 0 ? lineTotal / (1 + vatRate) : lineTotal;
    const iva = lineTotal - incidencia;
    if (!map[rate]) map[rate] = { incidencia: 0, iva: 0 };
    map[rate].incidencia += incidencia;
    map[rate].iva += iva;
  }
  return Object.entries(map).sort((a, b) => Number(a[0]) - Number(b[0])).map(([rate, v]) => ({ rate, ...v }));
}

function paymentMethodLabel(m: string | null | undefined): string {
  const map: Record<string, string> = {
    transferencia: "Transferência Bancária",
    numerario: "Numerário",
    cheque: "Cheque",
    multibanco: "Multibanco / TPA",
    mbway: "MB WAY",
  };
  return map[m || ""] || m || "-";
}

export function printInvoiceDocument(doc: InvoiceDoc, company: Company | null): void {
  const items = doc.items || [];
  const isSale = !doc.type?.startsWith("V");
  const entityLabel = isSale ? "CLIENTE" : "FORNECEDOR";
  const entityName = isSale ? doc.customerName : doc.supplierName;
  const entityNif = isSale ? doc.customerNif : doc.supplierNif;
  const typeLabel = typeLabels[doc.type || "FT"] || doc.type || "Documento";
  const statusKey = doc.status || "emitida";
  const statusLabel = statusLabels[statusKey] || statusKey;
  const vatBreakdown = buildVatBreakdown(items);
  const subtotal = Number(doc.subtotal) || 0;
  const vatTotal = Number(doc.vatTotal) || 0;
  const total = Number(doc.total) || 0;
  const pending = Number(doc.pending) ?? total;
  const paid = total - pending;

  const itemRows = items.map((item) => {
    const rate = String(item.vatRate || "0").replace(".00", "");
    const exemption = item.vatExemptionReason ? `<div class="exemption-note">Isenção: ${item.vatExemptionReason}</div>` : "";
    const discPct = Number(item.discount) || 0;
    const discCell = discPct > 0
      ? `<span style="color:#c2410c;font-weight:700">${discPct}%</span>`
      : `<span style="color:#9ca3af">—</span>`;
    return `<tr>
      <td class="code">${item.productCode || "-"}</td>
      <td>${item.description || ""}${exemption}</td>
      <td class="num">${Number(item.quantity || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</td>
      <td class="num">${eur(item.unitPrice)}</td>
      <td class="num">${discCell}</td>
      <td class="num">${rate}%</td>
      <td class="num" style="font-weight:600">${eur(item.total)}</td>
    </tr>`;
  }).join("");

  const vatRows = vatBreakdown.map(v =>
    `<tr><td>${v.rate}%</td><td>${eur(v.incidencia)}</td><td>${eur(v.iva)}</td><td>${eur(v.incidencia + v.iva)}</td></tr>`
  ).join("");

  const notesHtml = doc.notes ? `
    <div class="notes-section">
      <div class="notes-label">Observações</div>
      <div class="notes-text">${doc.notes}</div>
    </div>` : "";

  const paymentSection = (statusKey !== "anulada" && doc.type !== "NC") ? `
    <div class="totals-row">
      <span class="totals-label">Pago</span>
      <span class="totals-value" style="color:#15803d">${eur(paid)}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Pendente</span>
      <span class="totals-value" style="color:${pending > 0 ? "#c2410c" : "#15803d"}">${eur(pending)}</span>
    </div>` : "";

  const body = `
    <div class="header">
      ${companyBlock(company)}
      <div class="doc-block">
        <div class="doc-type-label">${typeLabel}</div>
        <div class="doc-number">${doc.number || ""}</div>
        <div class="doc-meta">
          Data: <strong>${fmtDate(doc.date)}</strong><br>
          ${doc.dueDate ? `Vencimento: <strong>${fmtDate(doc.dueDate)}</strong>` : ""}
        </div>
        <div class="doc-status status-${statusKey}">${statusLabel}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party-box">
        <div class="party-label">${entityLabel}</div>
        <div class="party-name">${entityName || "—"}</div>
        ${entityNif ? `<div class="party-detail">NIF: ${entityNif}</div>` : ""}
      </div>
      ${company ? `<div class="party-box" style="background:#f8fafc;border-left-color:#94a3b8">
        <div class="party-label" style="color:#64748b">EMITENTE</div>
        <div class="party-name" style="font-size:9pt">${company.name || ""}</div>
        ${company.nif ? `<div class="party-detail">NIF: ${company.nif}</div>` : ""}
      </div>` : ""}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width:70px">Código</th>
          <th>Descrição</th>
          <th class="num" style="width:55px">Qtd</th>
          <th class="num" style="width:75px">P. Unit.</th>
          <th class="num" style="width:45px">Desc.</th>
          <th class="num" style="width:45px">IVA</th>
          <th class="num" style="width:75px">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows || '<tr><td colspan="7" style="text-align:center;color:#999;padding:16px">Sem linhas</td></tr>'}</tbody>
    </table>

    <div class="bottom-section">
      <div class="vat-section">
        <div class="vat-title">Resumo de IVA</div>
        <table class="vat-table">
          <thead><tr><th>Taxa</th><th>Incidência</th><th>IVA</th><th>Total</th></tr></thead>
          <tbody>${vatRows || '<tr><td colspan="4" style="text-align:center;color:#999">—</td></tr>'}</tbody>
        </table>
      </div>
      <div class="totals-section">
        <div class="totals-row">
          <span class="totals-label">Subtotal (sem IVA)</span>
          <span class="totals-value">${eur(subtotal)}</span>
        </div>
        <div class="totals-row">
          <span class="totals-label">IVA</span>
          <span class="totals-value">${eur(vatTotal)}</span>
        </div>
        <div class="totals-row grand-total">
          <span class="totals-label">TOTAL</span>
          <span class="totals-value">${eur(total)}</span>
        </div>
        ${paymentSection}
      </div>
    </div>

    ${notesHtml}

    <div class="footer">
      <div class="footer-left">
        Processado por computador<br>
        Sales-Rotina – Software de Gestão Comercial
      </div>
      <div class="footer-right">
        Impresso em: ${nowFmt()}<br>
        ${doc.number || ""}
      </div>
    </div>
  `;

  openPrintWindow(html(`${typeLabel} ${doc.number || ""}`, body), `${typeLabel} ${doc.number || ""}`);
}

export function printReceiptDocument(doc: ReceiptDoc, company: Company | null): void {
  const typeLabel = typeLabels[doc.type || "RC"] || "Recibo";
  const entityName = doc.customerName || doc.supplierName || "—";
  const entitySection = doc.type === "NP" ? "FORNECEDOR" : "CLIENTE";
  const amount = Number(doc.amount) || 0;
  const originDoc = doc.invoiceRef || doc.purchaseRef || "—";

  const body = `
    <div class="header">
      ${companyBlock(company)}
      <div class="doc-block">
        <div class="doc-type-label">${typeLabel}</div>
        <div class="doc-number">${doc.number || ""}</div>
        <div class="doc-meta">Data: <strong>${fmtDate(doc.date)}</strong></div>
        <div class="doc-status status-paga">Emitido</div>
      </div>
    </div>

    <div class="parties">
      <div class="party-box">
        <div class="party-label">${entitySection}</div>
        <div class="party-name">${entityName}</div>
      </div>
    </div>

    <div style="margin-bottom:14px">
      <div class="section-heading">Detalhe do Pagamento</div>
      <table class="payment-detail-table">
        <tbody>
          <tr><td>Documento de Origem</td><td>${originDoc}</td></tr>
          <tr><td>Método de Pagamento</td><td>${paymentMethodLabel(doc.paymentMethod)}</td></tr>
          ${doc.bankAccountName ? `<tr><td>Conta Bancária</td><td>${doc.bankAccountName}</td></tr>` : ""}
          <tr><td>Data de Emissão</td><td>${fmtDate(doc.date)}</td></tr>
        </tbody>
      </table>
    </div>

    <div style="padding:16px;background:#f0fdf4;border:2px solid #86efac;border-radius:6px;text-align:center;margin-bottom:14px">
      <div style="font-size:9pt;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Montante ${typeLabel === "Nota de Pagamento" ? "Pago" : "Recebido"}</div>
      <div style="font-size:22pt;font-weight:700;color:#15803d">${eur(amount)}</div>
    </div>

    ${doc.notes ? `
    <div class="notes-section">
      <div class="notes-label">Observações</div>
      <div class="notes-text">${doc.notes}</div>
    </div>` : ""}

    <div class="footer">
      <div class="footer-left">
        Processado por computador<br>
        Sales-Rotina – Software de Gestão Comercial
      </div>
      <div class="footer-right">
        Impresso em: ${nowFmt()}<br>
        ${doc.number || ""}
      </div>
    </div>
  `;

  openPrintWindow(html(`${typeLabel} ${doc.number || ""}`, body), `${typeLabel} ${doc.number || ""}`);
}

interface BankTransactionRow {
  date?: string | Date | null;
  description?: string | null;
  reference?: string | null;
  notes?: string | null;
  type?: string | null;
  amount?: string | number | null;
  runningBalance?: number | null;
}

interface BankDoc {
  accountName?: string | null;
  bank?: string | null;
  iban?: string | null;
  openingBalance?: number | null;
  closingBalance?: number | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  transactions?: BankTransactionRow[];
  notes?: string | null;
}

export function printBankDocument(doc: BankDoc, company: Company | null): void {
  const transactions = doc.transactions || [];
  const openingBalance = doc.openingBalance ?? 0;

  let running = openingBalance;
  const rows = transactions.map((t) => {
    const amt = Number(t.amount) || 0;
    const isCredit = t.type === "credit";
    running = running + (isCredit ? amt : -amt);
    const notesHtml = t.notes ? `<div style="font-size:7pt;color:#6b7280;margin-top:2px">${t.notes}</div>` : "";
    return `<tr>
      <td>${fmtDate(t.date)}</td>
      <td>${t.description || ""}${notesHtml}</td>
      <td class="num" style="font-family:monospace;font-size:8pt">${t.reference || "—"}</td>
      <td class="num" style="color:${isCredit ? "#15803d" : "#9ca3af"}">${isCredit ? eur(amt) : "—"}</td>
      <td class="num" style="color:${!isCredit ? "#c2410c" : "#9ca3af"}">${!isCredit ? eur(amt) : "—"}</td>
      <td class="num" style="font-weight:700;color:${running >= 0 ? "#15803d" : "#c2410c"}">${eur(running)}</td>
    </tr>`;
  }).join("");

  const totalCredit = transactions.filter(t => t.type === "credit").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalDebit = transactions.filter(t => t.type !== "credit").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const closingBalance = doc.closingBalance ?? running;

  const notesHtml = doc.notes ? `
    <div class="notes-section">
      <div class="notes-label">Observações</div>
      <div class="notes-text">${doc.notes}</div>
    </div>` : "";

  const body = `
    <div class="header">
      ${companyBlock(company)}
      <div class="doc-block">
        <div class="doc-type-label">Extrato Bancário</div>
        <div class="doc-number">${doc.accountName || ""}</div>
        <div class="doc-meta">
          ${doc.bank ? `Banco: <strong>${doc.bank}</strong><br>` : ""}
          ${doc.iban ? `IBAN: <strong>${doc.iban}</strong><br>` : ""}
          ${doc.periodStart ? `Período: <strong>${fmtDate(doc.periodStart)} a ${fmtDate(doc.periodEnd)}</strong>` : ""}
        </div>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:14px">
      <div class="party-box" style="flex:1">
        <div class="party-label">Saldo Inicial</div>
        <div class="party-name" style="color:${openingBalance >= 0 ? "#15803d" : "#c2410c"}">${eur(openingBalance)}</div>
      </div>
      <div class="party-box" style="flex:1;background:#f0fdf4;border-left-color:#16a34a">
        <div class="party-label" style="color:#15803d">Total Entradas</div>
        <div class="party-name" style="color:#15803d">${eur(totalCredit)}</div>
      </div>
      <div class="party-box" style="flex:1;background:#fff7ed;border-left-color:#ea580c">
        <div class="party-label" style="color:#c2410c">Total Saídas</div>
        <div class="party-name" style="color:#c2410c">${eur(totalDebit)}</div>
      </div>
      <div class="party-box" style="flex:1;background:#eff6ff;border-left-color:#2563eb">
        <div class="party-label" style="color:#1d4ed8">Saldo Final</div>
        <div class="party-name" style="color:${closingBalance >= 0 ? "#1d4ed8" : "#c2410c"}">${eur(closingBalance)}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width:70px">Data</th>
          <th>Descrição / Observações</th>
          <th class="num" style="width:90px">Referência</th>
          <th class="num" style="width:75px">Entradas</th>
          <th class="num" style="width:75px">Saídas</th>
          <th class="num" style="width:85px">Saldo</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f1f5f9">
          <td colspan="5" style="font-size:8pt;color:#64748b;font-style:italic">Saldo inicial</td>
          <td class="num" style="font-weight:700;color:${openingBalance >= 0 ? "#15803d" : "#c2410c"}">${eur(openingBalance)}</td>
        </tr>
        ${rows || '<tr><td colspan="6" style="text-align:center;color:#999;padding:16px">Sem movimentos</td></tr>'}
      </tbody>
    </table>

    ${notesHtml}

    <div class="footer">
      <div class="footer-left">
        Processado por computador<br>
        Sales-Rotina – Software de Gestão Comercial
      </div>
      <div class="footer-right">
        Impresso em: ${nowFmt()}<br>
        ${doc.accountName || ""}
      </div>
    </div>
  `;

  openPrintWindow(html(`Extrato ${doc.accountName || ""}`, body), `Extrato ${doc.accountName || ""}`);
}

function openPrintWindow(htmlContent: string, title: string): void {
  const pw = window.open("", `print_${Date.now()}`, "width=900,height=1000,scrollbars=yes,resizable=yes");
  if (!pw) {
    alert("Bloqueio de pop-up detectado. Por favor, permita pop-ups para este site para usar a pré-visualização.");
    return;
  }
  pw.document.open();
  pw.document.write(htmlContent);
  pw.document.close();
  pw.document.title = title;
  pw.focus();
}
