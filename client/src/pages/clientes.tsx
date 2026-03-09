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
import { Plus, Search, Users, Edit2, Trash2 } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const [form, setForm] = useState({ name: "", nif: "", address: "", city: "", postalCode: "", phone: "", email: "" });

  const resetForm = () => { setForm({ name: "", nif: "", address: "", city: "", postalCode: "", phone: "", email: "" }); setEditCustomer(null); };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({ name: c.name, nif: c.nif, address: c.address || "", city: c.city || "", postalCode: c.postalCode || "", phone: c.phone || "", email: c.email || "" });
    setShowForm(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (editCustomer) await apiRequest("PATCH", `/api/customers/${editCustomer.id}`, form);
      else await apiRequest("POST", "/api/customers", form);
    },
    onSuccess: () => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["/api/customers"] }); toast({ title: editCustomer ? "Cliente atualizado" : "Cliente criado" }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/customers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/customers"] }); toast({ title: "Cliente eliminado" }); },
  });

  const filtered = customers.filter((c) =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.nif.includes(searchTerm)
  );

  const totalBalance = customers.reduce((sum, c) => sum + Number(c.balance || 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Clientes</h1>
          <p className="text-sm text-muted-foreground">Contas correntes de clientes</p>
        </div>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-customer"><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-customer-name" /></div>
                <div className="space-y-2"><Label>NIF</Label><Input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} data-testid="input-customer-nif" /></div>
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
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.nif} data-testid="button-save-customer">
                  {mutation.isPending ? "A guardar..." : editCustomer ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total de Clientes</p>
          <p className="text-2xl font-bold" data-testid="value-total-customers">{customers.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Saldo Total (Conta Corrente)</p>
          <p className={`text-2xl font-bold ${totalBalance > 0 ? "text-primary" : ""}`} data-testid="value-total-balance">{formatCurrency(totalBalance)}</p>
        </CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-testid="input-search-customers" />
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
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sem clientes</p>
                </TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} data-testid={`row-customer-${c.id}`}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-sm">{c.nif}</TableCell>
                  <TableCell>{c.city}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className={`text-right font-medium ${Number(c.balance || 0) > 0 ? "text-primary" : ""}`}>{formatCurrency(c.balance)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`button-edit-customer-${c.id}`}><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-customer-${c.id}`}><Trash2 className="w-4 h-4" /></Button>
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
