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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Search, Receipt, FileText, AlertCircle, Printer } from "lucide-react";
import { printReceiptDocument } from "@/lib/print-utils";
import { EmailDialog } from "@/components/email-dialog";
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
  const { data: company } = useQuery<any>({ queryKey: ["/api/company"] });

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
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({ to: "", subject: "", body: "" });

  const resetForm = () => {
    setCustomerId(""); setSupplierId(""); setInvoiceId(""); setPurchaseId("");
    setBankAccountId(""); setAmount(""); setNotes("");
    setPaymentMethod("transferencia");
  };

  const selectedCustomer = customers.find(c => c.id === Number(customerId));
  const selectedSupplier = suppliers.find(s => s.id === Number(supplierId));
  const selectedInvoice = invoices.find(i => i.id === Number(invoiceId));
  const selectedPurchase = purchases.find(p => p.id === Number(purchaseId));

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

  const docPending = isClientDoc && selectedInvoice
    ? Number(selectedInvoice.pending) || 0
    : isSupplierDoc && selectedPurchase
      ? Number(selectedPurchase.pending) || 0
      : 0;

  const docTotal = isClientDoc && selectedInvoice
    ? Number(selectedInvoice.total) || 0
    : isSupplierDoc && selectedPurchase
      ? Number(selectedPurchase.total) || 0
      : 0;

  const docPaid = docTotal - docPending;
  const docPaidPercent = docTotal > 0 ? Math.min(100, (docPaid / docTotal) * 100) : 0;

  const amountNum = Number(amount) || 0;
  const isPartialPayment = (invoiceId || purchaseId) && amountNum > 0 && amountNum < docPending;
  const exceedsPending = (invoiceId || purchaseId) && amountNum > docPending && docPending > 0;

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

      const res = await apiRequest("POST", "/api/receipts", data);
      return res.json();
    },
    onSuccess: (receipt) => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      const docLabel = ccDocTypes.find(d => d.value === formType)?.label || formType;
      toast({ title: `${docLabel} criado com sucesso` });
      resetForm();
      if (receipt) {
        const isClient = receipt.customerId;
        const recipientEmail = isClient
          ? (queryClient.getQueryData<any[]>(["/api/customers"]) || []).find((c: any) => c.id === receipt.customerId)?.email || ""
          : (queryClient.getQueryData<any[]>(["/api/suppliers"]) || []).find((s: any) => s.id === receipt.supplierId)?.email || "";
        const entityName = isClient ? receipt.customerName : receipt.supplierName;
        setEmailData({
          to: recipientEmail,
          subject: `${docLabel} ${receipt.number} - ${company?.name || ""}`,
          body: `Exmo(a) Sr(a) ${entityName || ""},\n\nAnexamos o ${docLabel} n.º ${receipt.number} no valor de ${Number(receipt.amount).toFixed(2)} €.\n\nFico ao dispor para qualquer esclarecimento.\n\nCom os melhores cumprimentos,\n${company?.name || ""}`,
        });
        setEmailOpen(true);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar documento", description: error.message, variant: "destructive" });
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
    if (exceedsPending) return false;
    return true;
  };

  const getLinkedDocInfo = (r: ReceiptType) => {
    if (r.invoiceId) {
      const inv = invoices.find(i => i.id === r.invoiceId);
      return inv ? inv.number : null;
    }
    if (r.purchaseId) {
      const p = purchases.find(pu => pu.id === r.purchaseId);
      return p ? p.number : null;
    }
    return null;
  };

  const handlePrintReceipt = (r: ReceiptType) => {
    const invRef = r.invoiceId ? invoices.find(i => i.id === r.invoiceId)?.number : null;
    const purRef = r.purchaseId ? purchases.find(p => p.id === r.purchaseId)?.number : null;
    const bankName = (r as any).bankAccountId ? bankAccounts.find(b => b.id === (r as any).bankAccountId)?.name : null;
    printReceiptDocument({
      type: (r as any).type || "RC",
      number: r.number,
      date: r.date,
      customerName: r.customerName,
      supplierName: (r as any).supplierName,
      amount: r.amount,
      paymentMethod: r.paymentMethod,
      notes: (r as any).notes,
      invoiceRef: invRef,
      purchaseRef: purRef,
      bankAccountName: bankName,
    }, company || null);
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo {ccDocTypes.find(d => d.value === formType)?.label}</DialogTitle>
                <DialogDescription>{ccDocTypes.find(d => d.value === formType)?.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {isRegularization && (
                  <div className="space-y-2">
                    <Label>Entidade</Label>
                    <Select value={rgEntity} onValueChange={(v) => { setRgEntity(v as "cliente" | "fornecedor"); setCustomerId(""); setSupplierId(""); setInvoiceId(""); setPurchaseId(""); setAmount(""); }}>
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
                    <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setInvoiceId(""); setAmount(""); }}>
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
                    <Select value={supplierId} onValueChange={(v) => { setSupplierId(v); setPurchaseId(""); setAmount(""); }}>
                      <SelectTrigger data-testid="select-cc-supplier"><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name} (Saldo: {formatCurrency(s.balance)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isClientDoc && customerId && (
                  <div className="space-y-2">
                    <Label>Fatura a liquidar</Label>
                    {pendingInvoices.length > 0 ? (
                      <Select value={invoiceId} onValueChange={(v) => {
                        setInvoiceId(v);
                        const inv = invoices.find(i => i.id === Number(v));
                        if (inv) setAmount(String(inv.pending));
                      }}>
                        <SelectTrigger data-testid="select-cc-invoice"><SelectValue placeholder="Selecionar fatura pendente" /></SelectTrigger>
                        <SelectContent>
                          {pendingInvoices.map((inv) => (
                            <SelectItem key={inv.id} value={String(inv.id)}>
                              {inv.number} - {formatCurrency(inv.total)} (Pendente: {formatCurrency(inv.pending)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sem faturas pendentes para este cliente</p>
                    )}
                  </div>
                )}

                {isSupplierDoc && supplierId && (
                  <div className="space-y-2">
                    <Label>Documento de compra a liquidar</Label>
                    {pendingPurchases.length > 0 ? (
                      <Select value={purchaseId} onValueChange={(v) => {
                        setPurchaseId(v);
                        const p = purchases.find(pu => pu.id === Number(v));
                        if (p) setAmount(String(p.pending));
                      }}>
                        <SelectTrigger data-testid="select-cc-purchase"><SelectValue placeholder="Selecionar compra pendente" /></SelectTrigger>
                        <SelectContent>
                          {pendingPurchases.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.number} - {formatCurrency(p.total)} (Pendente: {formatCurrency(p.pending)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sem compras pendentes para este fornecedor</p>
                    )}
                  </div>
                )}

                {(invoiceId || purchaseId) && docPending > 0 && (
                  <div className="rounded-md border p-3 space-y-3 bg-accent/20" data-testid="section-doc-payment-info">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Informação do Documento</h4>
                      {isPartialPayment && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" data-testid="badge-partial-payment">
                          Pagamento Parcial
                        </Badge>
                      )}
                      {!isPartialPayment && amountNum > 0 && amountNum === docPending && (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" data-testid="badge-full-payment">
                          Liquidação Total
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Total</span>
                        <p className="font-medium">{formatCurrency(docTotal)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Já pago</span>
                        <p className="font-medium text-emerald-600">{formatCurrency(docPaid)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Pendente</span>
                        <p className="font-medium text-amber-600">{formatCurrency(docPending)}</p>
                      </div>
                    </div>
                    <Progress value={docPaidPercent} className="h-2" data-testid="progress-doc-payment" />
                    {amountNum > 0 && amountNum <= docPending && (
                      <div className="text-xs text-muted-foreground">
                        Após este pagamento: {formatCurrency(docPending - amountNum)} pendente
                        {amountNum === docPending && " (documento totalmente liquidado)"}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Montante</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      data-testid="input-cc-amount"
                    />
                    {exceedsPending && (
                      <p className="text-xs text-destructive flex items-center gap-1" data-testid="text-amount-error">
                        <AlertCircle className="w-3 h-3" />
                        O montante excede o valor pendente ({formatCurrency(docPending)})
                      </p>
                    )}
                    {(invoiceId || purchaseId) && docPending > 0 && !exceedsPending && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => setAmount(String(docPending))}
                          data-testid="button-pay-full"
                        >
                          Total ({formatCurrency(docPending)})
                        </Button>
                        {docPending > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => setAmount(String((docPending / 2).toFixed(2)))}
                            data-testid="button-pay-half"
                          >
                            50% ({formatCurrency(docPending / 2)})
                          </Button>
                        )}
                      </div>
                    )}
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
                  <TableHead>Doc. Origem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Montante</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
                    <TableCell>
                      {getLinkedDocInfo(r) ? (
                        <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-linked-doc-${r.id}`}>
                          {getLinkedDocInfo(r)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="capitalize">{r.paymentMethod}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(r.amount)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => handlePrintReceipt(r)} data-testid={`button-print-receipt-${r.id}`} title="Imprimir">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        defaultTo={emailData.to}
        defaultSubject={emailData.subject}
        defaultBody={emailData.body}
      />
    </div>
  );
}
