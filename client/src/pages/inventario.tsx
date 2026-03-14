import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package, Edit2 } from "lucide-react";
import { VAT_RATES, VAT_EXEMPTION_REASONS, normalizeVatRate } from "@/lib/vat";
import type { Product } from "@shared/schema";

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const [form, setForm] = useState({
    code: "", name: "", description: "", unit: "un", purchasePrice: "0", salePrice: "0", vatRate: "23", vatExemptionReason: "", stock: "0", minStock: "0", category: "",
  });

  const resetForm = () => {
    setForm({ code: "", name: "", description: "", unit: "un", purchasePrice: "0", salePrice: "0", vatRate: "23", vatExemptionReason: "", stock: "0", minStock: "0", category: "" });
    setEditProduct(null);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      code: product.code, name: product.name, description: product.description || "",
      unit: product.unit || "un", purchasePrice: product.purchasePrice || "0",
      salePrice: product.salePrice || "0", vatRate: normalizeVatRate(product.vatRate), vatExemptionReason: product.vatExemptionReason || "",
      stock: product.stock || "0", minStock: product.minStock || "0", category: product.category || "",
    });
    setShowForm(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (editProduct) {
        await apiRequest("PATCH", `/api/products/${editProduct.id}`, form);
      } else {
        await apiRequest("POST", "/api/products", form);
      }
    },
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: editProduct ? "Produto atualizado" : "Produto criado com sucesso" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao guardar produto", description: error.message, variant: "destructive" });
    },
  });

  const filtered = products.filter((p) =>
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockValue = products.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.purchasePrice || 0), 0);
  const lowStockCount = products.filter((p) => Number(p.stock || 0) <= Number(p.minStock || 0) && Number(p.minStock || 0) > 0).length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Inventário</h1>
          <p className="text-sm text-muted-foreground">Gestão de produtos e stock</p>
        </div>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-product"><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} data-testid="input-product-code" /></div>
                <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="input-product-category" /></div>
              </div>
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-product-name" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                <div className="space-y-2"><Label>Preço Compra</Label><Input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} data-testid="input-purchase-price" /></div>
                <div className="space-y-2"><Label>Preço Venda</Label><Input type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} data-testid="input-sale-price" /></div>
                <div className="space-y-2">
                  <Label>IVA</Label>
                  <Select value={form.vatRate} onValueChange={(v) => setForm({ ...form, vatRate: v, vatExemptionReason: v !== "0" ? "" : form.vatExemptionReason })}>
                    <SelectTrigger data-testid="select-product-vat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_RATES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.vatRate === "0" && (
                  <div className="space-y-2 col-span-2">
                    <Label className="text-amber-600">Motivo de isenção</Label>
                    <Select value={form.vatExemptionReason} onValueChange={(v) => setForm({ ...form, vatExemptionReason: v })}>
                      <SelectTrigger data-testid="select-product-exemption">
                        <SelectValue placeholder="Selecionar motivo de isenção" />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_EXEMPTION_REASONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} data-testid="input-stock" /></div>
                <div className="space-y-2"><Label>Stock Mínimo</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.code || !form.name || (form.vatRate === "0" && !form.vatExemptionReason)} data-testid="button-save-product">
                  {mutation.isPending ? "A guardar..." : editProduct ? "Atualizar" : "Criar Produto"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total de Produtos</p>
          <p className="text-2xl font-bold" data-testid="value-total-products">{products.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Valor Total em Stock</p>
          <p className="text-2xl font-bold text-primary" data-testid="value-stock-value">{formatCurrency(totalStockValue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Produtos Abaixo Stock Mínimo</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`} data-testid="value-low-stock">{lowStockCount}</p>
        </CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="input-search-products" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Preço Compra</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sem produtos</p>
                  </TableCell></TableRow>
                ) : filtered.map((p) => {
                  const isLow = Number(p.stock || 0) <= Number(p.minStock || 0) && Number(p.minStock || 0) > 0;
                  return (
                    <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                      <TableCell className="font-mono text-sm">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="secondary">{p.category || "-"}</Badge></TableCell>
                      <TableCell className={`text-right ${isLow ? "text-destructive font-bold" : ""}`}>
                        {formatNumber(p.stock, 0)} {p.unit}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(p.purchasePrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.salePrice)}</TableCell>
                      <TableCell className="text-right">{p.vatRate}%</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
