import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import type { Purchase, Supplier, Product } from "@shared/schema";

const purchaseDocTypes = [
  { value: "all", label: "Todos" },
  { value: "VFT", label: "V/Fatura" },
  { value: "VFR", label: "V/Fatura-Recibo" },
  { value: "VNC", label: "V/Nota de Crédito" },
  { value: "VND", label: "V/Nota de Débito" },
];

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("VFT");
  const { toast } = useToast();

  const { data: purchases = [], isLoading } = useQuery<Purchase[]>({ queryKey: ["/api/purchases"] });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { productId: null as number | null, productCode: "", description: "", quantity: "1", unitPrice: "0", vatRate: "23" },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === Number(supplierId));

  const calcItemTotal = (item: any) => {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  };

  const subtotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0);
  const vatTotal = items.reduce((sum, item) => sum + calcItemTotal(item) * (Number(item.vatRate) / 100), 0);
  const total = subtotal + vatTotal;

  const addItem = () => setItems([...items, { productId: null, productCode: "", description: "", quantity: "1", unitPrice: "0", vatRate: "23" }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        newItems[index].productCode = product.code;
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.purchasePrice || "0";
        newItems[index].vatRate = product.vatRate || "23";
        newItems[index].productId = product.id;
      }
    }
    setItems(newItems);
  };

  const resetForm = () => {
    setSupplierId(""); setNotes("");
    setItems([{ productId: null, productCode: "", description: "", quantity: "1", unitPrice: "0", vatRate: "23" }]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/purchases", {
        type: formType,
        date: new Date(date),
        supplierId: Number(supplierId) || null,
        supplierName: selectedSupplier?.name || "",
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
          vatRate: item.vatRate,
          total: calcItemTotal(item).toFixed(2),
        })),
      });
    },
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Documento de compra criado com sucesso" });
      resetForm();
    },
  });

  const filtered = purchases.filter((p) => {
    const matchesType = typeFilter === "all" || (p as any).type === typeFilter;
    const matchesSearch = !searchTerm ||
      p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "paga": return <Badge variant="default" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Paga</Badge>;
      default: return <Badge variant="secondary">Registada</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Compras</h1>
          <p className="text-sm text-muted-foreground">Documentos de compra a fornecedores</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={formType} onValueChange={setFormType}>
            <SelectTrigger className="w-[200px]" data-testid="select-new-purchase-type">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {purchaseDocTypes.filter(d => d.value !== "all").map((dt) => (
                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-purchase"><Plus className="w-4 h-4 mr-2" />Novo Documento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nova {purchaseDocTypes.find(d => d.value === formType)?.label}</DialogTitle></DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger data-testid="select-supplier"><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-purchase-date" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Linhas</Label>
                    <Button variant="secondary" size="sm" onClick={addItem} data-testid="button-add-purchase-line"><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[80px]">Qtd</TableHead>
                        <TableHead className="w-[100px]">Preço</TableHead>
                        <TableHead className="w-[70px]">IVA %</TableHead>
                        <TableHead className="w-[100px] text-right">Total</TableHead>
                        <TableHead className="w-[40px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Select value={item.productId ? String(item.productId) : ""} onValueChange={(v) => updateItem(idx, "productId", v)}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Produto" /></SelectTrigger>
                              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.code}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><Input className="h-8" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8" type="number" value={item.vatRate} onChange={(e) => updateItem(idx, "vatRate", e.target.value)} /></TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(calcItemTotal(item))}</TableCell>
                          <TableCell><Button size="icon" variant="ghost" onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 className="w-3 h-3" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1 max-w-xs"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" /></div>
                  <div className="text-right space-y-1 min-w-[200px]">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">IVA:</span><span>{formatCurrency(vatTotal)}</span></div>
                    <div className="flex justify-between text-base font-bold border-t pt-1"><span>Total:</span><span>{formatCurrency(total)}</span></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !supplierId} data-testid="button-save-purchase">
                    {mutation.isPending ? "A guardar..." : "Registar Documento"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Filtrar compras..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="input-search-purchases" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-purchase-type-filter">
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            {purchaseDocTypes.map((dt) => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {typeFilter !== "all" && (
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setTypeFilter("all")}>
            {purchaseDocTypes.find(d => d.value === typeFilter)?.label}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">{filtered.length} documento(s)</span>
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sem compras registadas</p>
                  </TableCell></TableRow>
                ) : filtered.map((p) => (
                  <TableRow key={p.id} data-testid={`row-purchase-${p.id}`}>
                    <TableCell className="font-medium">{p.number}</TableCell>
                    <TableCell>{p.supplierName}</TableCell>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.pending)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.total)}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
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
