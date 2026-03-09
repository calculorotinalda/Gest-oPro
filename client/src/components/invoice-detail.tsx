import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { X, FileText, Printer, Download, Receipt } from "lucide-react";
import type { Invoice, InvoiceItem, Receipt as ReceiptType } from "@shared/schema";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoiceDetail({ invoice, onClose }: InvoiceDetailProps) {
  const { data: detail, isLoading } = useQuery<Invoice & { items: InvoiceItem[] }>({
    queryKey: ["/api/invoices", invoice.id],
  });

  const { data: allReceipts = [] } = useQuery<ReceiptType[]>({
    queryKey: ["/api/receipts"],
  });

  const linkedReceipts = allReceipts.filter(r => r.invoiceId === invoice.id);

  const currentInvoice = detail || invoice;
  const total = Number(currentInvoice.total) || 0;
  const pending = Number(currentInvoice.pending) || 0;
  const paid = total - pending;
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  const typeLabels: Record<string, string> = {
    FT: "Fatura",
    FS: "Fatura Simplificada",
    FR: "Fatura-Recibo",
    NC: "Nota de Crédito",
    ND: "Nota de Débito",
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-1">
        <div>
          <CardTitle className="text-base" data-testid="text-invoice-number">{invoice.number}</CardTitle>
          <p className="text-sm text-muted-foreground">{typeLabels[invoice.type] || invoice.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" data-testid="button-print">
            <Printer className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" data-testid="button-download">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-detail">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : detail ? (
          <>
            <div className="bg-accent/30 rounded-md p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{typeLabels[detail.type] || detail.type}</span>
                <Badge variant={detail.status === "paga" ? "default" : detail.status === "anulada" ? "destructive" : "secondary"}>
                  {detail.status === "paga" ? "Paga" : detail.status === "anulada" ? "Anulada" : "Emitida"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium" data-testid="text-detail-date">{formatDate(detail.date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencimento:</span>
                  <p className="font-medium">{formatDate(detail.dueDate)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Cliente</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium" data-testid="text-detail-customer">{detail.customerName}</p>
                <p className="text-muted-foreground">NIF: {detail.customerNif}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Linhas</h3>
              <div className="space-y-2">
                {detail.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm p-2 bg-accent/20 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatNumber(item.quantity)} x {formatCurrency(item.unitPrice)} | IVA {item.vatRate}%
                        {Number(item.discount) > 0 ? ` | Desc. ${item.discount}%` : ""}
                      </p>
                    </div>
                    <span className="font-medium ml-2">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA</span>
                <span>{formatCurrency(detail.vatTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total</span>
                <span data-testid="text-detail-total">{formatCurrency(detail.total)}</span>
              </div>
            </div>

            {invoice.type !== "NC" && (
              <>
                <Separator />
                <div className="space-y-3" data-testid="section-payment-status">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Estado de Pagamento
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pago</span>
                      <span className="text-emerald-600 font-medium">{formatCurrency(paid)}</span>
                    </div>
                    {pending > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pendente</span>
                        <span className="text-amber-600 font-medium">{formatCurrency(pending)}</span>
                      </div>
                    )}
                    <Progress value={paidPercent} className="h-2" data-testid="progress-payment" />
                    <p className="text-xs text-muted-foreground text-right">{paidPercent.toFixed(0)}% liquidado</p>
                  </div>

                  {linkedReceipts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pagamentos Recebidos</h4>
                      {linkedReceipts.map((r) => (
                        <div key={r.id} className="flex justify-between items-center text-sm p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200/50 dark:border-emerald-800/30" data-testid={`payment-receipt-${r.id}`}>
                          <div>
                            <p className="font-medium">{r.number}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(r.date)} • {r.paymentMethod}</p>
                          </div>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatCurrency(r.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {linkedReceipts.length === 0 && pending > 0 && (
                    <p className="text-xs text-muted-foreground italic">Sem pagamentos registados</p>
                  )}
                </div>
              </>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
