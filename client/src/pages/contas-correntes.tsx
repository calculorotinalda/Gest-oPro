import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Search, Receipt, FileText } from "lucide-react";
import type { Customer, Supplier, Invoice, Purchase, BankAccount, Receipt as ReceiptType } from "@shared/schema";

const ccDocTypes = [
  { value: "RC", label: "Recibo", description: "Recebimento de cliente" },
  { value: "NP", label: "Nota de Pagamento", description: "Pagamento a fornecedor" },
  { value: "RG", label: "Regularização", description: "Regularização de conta corrente (cliente ou fornecedor)" },
];

export default function ContasCorrente() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("RC");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const { data: receipts = [], isLoading } = useQuery<ReceiptType[]>({ queryKey: ["/api/receipts"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: purchases = [] } = useQuery<Purchase[]>({ queryKey: ["/api/purchases"] });
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({ queryKey: ["/api/bank-accounts"] });

  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [notes, setNotes] = useState("");
  const [rgEntity, setRgEntity] = useState<"cliente" | "fornecedor">("cliente");

  const resetForm = () => {
    setCustomerId(""); setSupplierId(""); setInvoiceId(""); setPurchaseId("");
    setBankAccountId(""); setAmount(""); setNotes("");
    setPaymentMethod("transferencia");
  };

  const selectedCustomer = customers.find(c => c.id === Number(customerId));
  const selectedSupplier = suppliers.find(s => s.id === Number(supplierId));

  const pendingInvoices = invoices.filter(inv =>
    inv.status !== "paga" && inv.status !== "anulada" &&
    Number(inv.pending) > 0 &&
    (!customerId || inv.customerId === Number(customerId))
  );

  const pendingPurchases = purchases.filter(p =>
    p.status !== "paga" &&
    Number(p.pending) > 0 &&
    (!supplierId || p.supplierId === Number(supplierId))
  );

  const isClientDoc = formType === "RC" || (formType === "RG" && rgEntity === "cliente");
  const isSupplierDoc = formType === "NP" || (formType === "RG" && rgEntity === "fornecedor");
  const isRegularization = formType === "RG";

  const mutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        type: formType,
        date: new Date(date),
        amount,
        bankAccountId: bankAccountId ? Number(bankAccountId) : null,
        paymentMethod,
        notes,
      };

      if (isClientDoc) {
        data.customerId = customerId ? Number(customerId) : null;
        data.customerName = selectedCustomer?.name || "";
        data.invoiceId = invoiceId ? Number(invoiceId) : null;
      }

      if (isSupplierDoc) {
        data.supplierId = supplierId ? Number(supplierId) : null;
        data.supplierName = selectedSupplier?.name || "";
        data.purchaseId = purchaseId ? Number(purchaseId) : null;
      }

      await apiRequest("POST", "/api/receipts", data);
    },
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: `${ccDocTypes.find(d => d.value === formType)?.label} criado com sucesso` });
      resetForm();
    },
  });

  const filtered = receipts.filter((r) => {
    const matchesTab = activeTab === "all" || (r as any).type === activeTab;
    const matchesSearch = !searchTerm ||
      r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r as any).supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTypeLabel = (type: string) => {
    return ccDocTypes.find(d => d.value === type)?.label || type;
  };

  const canSubmit = () => {
    if (!amount || Number(amount) <= 0) return false;
    if (isClientDoc && !customerId) return false;
    if (isSupplierDoc && !supplierId) return false;
    return true;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Contas Correntes</h1>
          <p className="text-sm text-muted-foreground">Recibos, notas de pagamento e regularizações</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={formType} onValueChange={setFormType}>
            <SelectTrigger className="w-[220px]" data-testid="select-cc-doc-type">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {ccDocTypes.map((dt) => (
                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-cc-doc"><Plus className="w-4 h-4 mr-2" />Novo Documento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo {ccDocTypes.find(d => d.value === formType)?.label}</DialogTitle>
                <DialogDescription>{ccDocTypes.find(d => d.value === formType)?.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {isRegularization && (
                  <div className="space-y-2">
                    <Label>Entidade</Label>
                    <Select value={rgEntity} onValueChange={(v) => { setRgEntity(v as "cliente" | "fornecedor"); setCustomerId(""); setSupplierId(""); setInvoiceId(""); setPurchaseId(""); }}>
                      <SelectTrigger data-testid="select-rg-entity"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isClientDoc && (
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setInvoiceId(""); }}>
                      <SelectTrigger data-testid="select-cc-customer"><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name} (Saldo: {formatCurrency(c.balance)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isSupplierDoc && (
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={supplierId} onValueChange={(v) => { setSupplierId(v); setPurchaseId(""); }}>
                      <SelectTrigger data-testid="select-cc-supplier"><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name} (Saldo: {formatCurrency(s.balance)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isClientDoc && pendingInvoices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Fatura (opcional)</Label>
                    <Select value={invoiceId} onValueChange={(v) => {
                      setInvoiceId(v);
                      const inv = invoices.find(i => i.id === Number(v));
                      if (inv) setAmount(String(inv.pending));
                    }}>
                      <SelectTrigger data-testid="select-cc-invoice"><SelectValue placeholder="Selecionar fatura pendente" /></SelectTrigger>
                      <SelectContent>
                        {pendingInvoices.map((inv) => (
                          <SelectItem key={inv.id} value={String(inv.id)}>
                            {inv.number} - {formatCurrency(inv.pending)} pendente
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isSupplierDoc && pendingPurchases.length > 0 && (
                  <div className="space-y-2">
                    <Label>Compra (opcional)</Label>
                    <Select value={purchaseId} onValueChange={(v) => {
                      setPurchaseId(v);
                      const p = purchases.find(pu => pu.id === Number(v));
                      if (p) setAmount(String(p.pending));
                    }}>
                      <SelectTrigger data-testid="select-cc-purchase"><SelectValue placeholder="Selecionar compra pendente" /></SelectTrigger>
                      <SelectContent>
                        {pendingPurchases.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.number} - {formatCurrency(p.pending)} pendente
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Montante</Label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-cc-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-cc-date" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Método de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger data-testid="select-cc-payment-method"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="numerario">Numerário</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="multibanco">Multibanco</SelectItem>
                        <SelectItem value="mbway">MB WAY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Conta Bancária (opcional)</Label>
                    <Select value={bankAccountId} onValueChange={setBankAccountId}>
                      <SelectTrigger data-testid="select-cc-bank"><SelectValue placeholder="Sem conta" /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((ba) => <SelectItem key={ba.id} value={String(ba.id)}>{ba.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-cc-notes" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
                  <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit()} data-testid="button-save-cc-doc">
                    {mutation.isPending ? "A guardar..." : `Criar ${getTypeLabel(formType)}`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-cc-type">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="RC">Recibos</TabsTrigger>
          <TabsTrigger value="NP">Notas de Pagamento</TabsTrigger>
          <TabsTrigger value="RG">Regularizações</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar documentos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="input-search-cc" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Montante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sem documentos de conta corrente</p>
                  </TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.id} data-testid={`row-receipt-${r.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {r.number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel((r as any).type || "RC")}</Badge>
                    </TableCell>
                    <TableCell>{r.customerName || (r as any).supplierName || "-"}</TableCell>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="capitalize">{r.paymentMethod}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
