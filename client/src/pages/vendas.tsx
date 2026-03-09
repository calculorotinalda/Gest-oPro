import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Search, FileText, X, Eye } from "lucide-react";
import type { Invoice, Customer, Product } from "@shared/schema";
import InvoiceForm from "@/components/invoice-form";
import InvoiceDetail from "@/components/invoice-detail";

const docTypes = [
  { value: "all", label: "Todos" },
  { value: "FT", label: "Fatura" },
  { value: "FS", label: "Fatura Simplificada" },
  { value: "FR", label: "Fatura-Recibo" },
  { value: "NC", label: "Nota de Crédito" },
  { value: "ND", label: "Nota de Débito" },
];

export default function Vendas() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("FT");
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const filtered = invoices.filter((inv) => {
    const matchesType = typeFilter === "all" || inv.type === typeFilter;
    const matchesSearch = !searchTerm ||
      inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const statusBadge = (inv: Invoice) => {
    if (inv.status === "paga") return <Badge variant="default" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Paga</Badge>;
    if (inv.status === "anulada") return <Badge variant="destructive">Anulada</Badge>;
    const pendingVal = Number(inv.pending || 0);
    const totalVal = Number(inv.total || 0);
    if (totalVal > 0 && pendingVal < totalVal && pendingVal > 0) {
      return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Parcial</Badge>;
    }
    return <Badge variant="secondary">Emitida</Badge>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Vendas</h1>
            <p className="text-sm text-muted-foreground">Documentos de venda</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger className="w-[200px]" data-testid="select-new-doc-type">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.filter(d => d.value !== "all").map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-invoice" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova {docTypes.find(d => d.value === formType)?.label}</DialogTitle>
                </DialogHeader>
                <InvoiceForm type={formType} onSuccess={() => {
                  setShowForm(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                  toast({ title: "Documento criado com sucesso" });
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar resultados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-type-filter">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {docTypes.map((dt) => (
                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {typeFilter !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setTypeFilter("all")}>
              {docTypes.find(d => d.value === typeFilter)?.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          <span className="text-sm text-muted-foreground" data-testid="text-count">
            {filtered.length} documento(s)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="flex gap-4 h-full">
          <div className="flex-1 overflow-auto">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Número</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead className="w-[120px] text-right">Pendente</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                        <TableHead className="w-[100px]">Estado</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Sem documentos de venda</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((inv) => (
                          <TableRow
                            key={inv.id}
                            className={`cursor-pointer ${selectedInvoice?.id === inv.id ? "bg-accent" : ""}`}
                            onClick={() => setSelectedInvoice(inv)}
                            data-testid={`row-invoice-${inv.id}`}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                {inv.number}
                              </div>
                            </TableCell>
                            <TableCell>{inv.customerName}</TableCell>
                            <TableCell>{formatDate(inv.date)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(inv.pending)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                            <TableCell>{statusBadge(inv)}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }} data-testid={`button-view-${inv.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          {selectedInvoice && (
            <div className="w-[400px] shrink-0">
              <InvoiceDetail invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
