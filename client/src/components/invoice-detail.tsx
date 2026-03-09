import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { X, FileText, Printer, Download, Mail } from "lucide-react";
import type { Invoice, InvoiceItem } from "@shared/schema";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoiceDetail({ invoice, onClose }: InvoiceDetailProps) {
  const { data: detail, isLoading } = useQuery<Invoice & { items: InvoiceItem[] }>({
    queryKey: ["/api/invoices", invoice.id],
  });

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
              {Number(detail.pending) > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Pendente</span>
                  <span>{formatCurrency(detail.pending)}</span>
                </div>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
