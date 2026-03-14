import { Fragment, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { VAT_RATES, VAT_EXEMPTION_REASONS, normalizeVatRate } from "@/lib/vat";
import type { Customer, Product } from "@shared/schema";

interface InvoiceFormProps {
  type: string;
  onSuccess: (invoice?: any) => void;
}

interface LineItem {
  productId: number | null;
  productCode: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  vatRate: string;
  vatExemptionReason: string;
}

export default function InvoiceForm({ type, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { productId: null, productCode: "", description: "", quantity: "1", unitPrice: "0", discount: "0", vatRate: "23", vatExemptionReason: "" },
  ]);

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const selectedCustomer = customers.find((c) => c.id === Number(customerId));

  const calcItemTotal = (item: LineItem) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return qty * price * (1 - disc / 100);
  };

  const subtotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0);
  const vatTotal = items.reduce((sum, item) => {
    const lineTotal = calcItemTotal(item);
    return sum + lineTotal * (Number(item.vatRate) / 100);
  }, 0);
  const total = subtotal + vatTotal;

  const addItem = () => {
    setItems([...items, { productId: null, productCode: "", description: "", quantity: "1", unitPrice: "0", discount: "0", vatRate: "23", vatExemptionReason: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;

    if (field === "productId" && value) {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        newItems[index].productCode = product.code;
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.salePrice || "0";
        newItems[index].vatRate = normalizeVatRate(product.vatRate);
        newItems[index].vatExemptionReason = product.vatExemptionReason || "";
        newItems[index].productId = product.id;
      }
    }

    if (field === "vatRate" && value !== "0") {
      newItems[index].vatExemptionReason = "";
    }

    setItems(newItems);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const invoiceData = {
        type,
        series: "2026",
        date: new Date(date),
        dueDate: new Date(date),
        customerId: Number(customerId) || null,
        customerName: selectedCustomer?.name || "",
        customerNif: selectedCustomer?.nif || "",
        subtotal: subtotal.toFixed(2),
        vatTotal: vatTotal.toFixed(2),
        total: total.toFixed(2),
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          vatRate: item.vatRate,
          vatExemptionReason: item.vatRate === "0" ? item.vatExemptionReason : null,
          total: calcItemTotal(item).toFixed(2),
        })),
      };
      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return res.json();
    },
    onSuccess: (invoice) => {
      onSuccess(invoice);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao guardar documento", description: error.message, variant: "destructive" });
    },
  });

  const hasExemptItems = items.some(item => item.vatRate === "0" && !item.vatExemptionReason);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger data-testid="select-customer">
              <SelectValue placeholder="Selecionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-date" />
        </div>
      </div>

      {selectedCustomer && (
        <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-md">
          <p>NIF: {selectedCustomer.nif}</p>
          <p>{selectedCustomer.address}, {selectedCustomer.postalCode} {selectedCustomer.city}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Linhas do documento</Label>
          <Button variant="secondary" size="sm" onClick={addItem} data-testid="button-add-line">
            <Plus className="w-3 h-3 mr-1" /> Adicionar linha
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Produto</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[70px]">Qtd</TableHead>
                <TableHead className="w-[90px]">Preço</TableHead>
                <TableHead className="w-[110px]">IVA</TableHead>
                <TableHead className="w-[65px]">Desc %</TableHead>
                <TableHead className="w-[90px] text-right">Total</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <Fragment key={idx}>
                  <TableRow>
                    <TableCell>
                      <Select value={item.productId ? String(item.productId) : ""} onValueChange={(v) => updateItem(idx, "productId", v)}>
                        <SelectTrigger className="h-8" data-testid={`select-product-${idx}`}>
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.code} - {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} data-testid={`input-desc-${idx}`} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} data-testid={`input-qty-${idx}`} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} data-testid={`input-price-${idx}`} />
                    </TableCell>
                    <TableCell>
                      <Select value={item.vatRate} onValueChange={(v) => updateItem(idx, "vatRate", v)}>
                        <SelectTrigger className="h-8" data-testid={`select-vat-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VAT_RATES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.value}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" type="number" value={item.discount} onChange={(e) => updateItem(idx, "discount", e.target.value)} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calcItemTotal(item))}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} disabled={items.length === 1} data-testid={`button-remove-${idx}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {item.vatRate === "0" && (
                    <TableRow>
                      <TableCell colSpan={8} className="pt-0 pb-2">
                        <div className="flex items-center gap-2 pl-2">
                          <Label className="text-xs text-amber-600 whitespace-nowrap">Motivo de isenção:</Label>
                          <Select value={item.vatExemptionReason} onValueChange={(v) => updateItem(idx, "vatExemptionReason", v)}>
                            <SelectTrigger className="h-7 text-xs" data-testid={`select-exemption-${idx}`}>
                              <SelectValue placeholder="Selecionar motivo de isenção" />
                            </SelectTrigger>
                            <SelectContent>
                              {VAT_EXEMPTION_REASONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1 max-w-xs">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" data-testid="input-notes" />
        </div>
        <div className="text-right space-y-1 min-w-[200px]">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span data-testid="value-subtotal">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA:</span>
            <span data-testid="value-vat">{formatCurrency(vatTotal)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-1">
            <span>Total:</span>
            <span data-testid="value-total">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onSuccess()} data-testid="button-cancel">Cancelar</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !customerId || hasExemptItems} data-testid="button-save">
          {mutation.isPending ? "A guardar..." : "Guardar Documento"}
        </Button>
      </div>
    </div>
  );
}
