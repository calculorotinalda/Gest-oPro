import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Plus, Search, Building2, Edit2, Trash2 } from "lucide-react";
import type { Supplier } from "@shared/schema";

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });

  const [form, setForm] = useState({ name: "", nif: "", address: "", city: "", postalCode: "", phone: "", email: "" });

  const resetForm = () => { setForm({ name: "", nif: "", address: "", city: "", postalCode: "", phone: "", email: "" }); setEditSupplier(null); };

  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setForm({ name: s.name, nif: s.nif, address: s.address || "", city: s.city || "", postalCode: s.postalCode || "", phone: s.phone || "", email: s.email || "" });
    setShowForm(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (editSupplier) await apiRequest("PATCH", `/api/suppliers/${editSupplier.id}`, form);
      else await apiRequest("POST", "/api/suppliers", form);
    },
    onSuccess: () => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] }); toast({ title: editSupplier ? "Fornecedor atualizado" : "Fornecedor criado" }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/suppliers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] }); toast({ title: "Fornecedor eliminado" }); },
  });

  const filtered = suppliers.filter((s) =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nif.includes(searchTerm)
  );

  const totalBalance = suppliers.reduce((sum, s) => sum + Number(s.balance || 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Contas correntes de fornecedores</p>
        </div>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-supplier"><Plus className="w-4 h-4 mr-2" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-supplier-name" /></div>
                <div className="space-y-2"><Label>NIF</Label><Input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} data-testid="input-supplier-nif" /></div>
              </div>
              <div className="space-y-2"><Label>Morada</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div className="space-y-2"><Label>Código Postal</Label><Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.nif} data-testid="button-save-supplier">
                  {mutation.isPending ? "A guardar..." : editSupplier ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total de Fornecedores</p>
          <p className="text-2xl font-bold">{suppliers.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Saldo Total (Conta Corrente)</p>
          <p className={`text-2xl font-bold ${totalBalance > 0 ? "text-destructive" : ""}`}>{formatCurrency(totalBalance)}</p>
        </CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar fornecedores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="input-search-suppliers" />
      </div>

      <Card><CardContent className="p-0">
        {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sem fornecedores</p>
                </TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-sm">{s.nif}</TableCell>
                  <TableCell>{s.city}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell className={`text-right font-medium ${Number(s.balance || 0) > 0 ? "text-destructive" : ""}`}>{formatCurrency(s.balance)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
