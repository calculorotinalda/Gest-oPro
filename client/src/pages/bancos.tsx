import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Landmark, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react";
import { printBankDocument } from "@/lib/print-utils";
import type { BankAccount, BankTransaction } from "@shared/schema";

export default function Bancos() {
  const [showForm, setShowForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({ queryKey: ["/api/bank-accounts"] });
  const { data: company } = useQuery<any>({ queryKey: ["/api/company"] });

  const transactionsUrl = selectedAccount
    ? `/api/bank-transactions?bankAccountId=${selectedAccount}`
    : "/api/bank-transactions";

  const { data: transactions = [] } = useQuery<BankTransaction[]>({
    queryKey: [transactionsUrl],
  });

  const [accountForm, setAccountForm] = useState({ name: "", bank: "", iban: "", balance: "0" });
  const [transForm, setTransForm] = useState({ bankAccountId: "", description: "", type: "credit", amount: "0", reference: "", notes: "" });

  const accountMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/bank-accounts", accountForm); },
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Conta criada com sucesso" });
      setAccountForm({ name: "", bank: "", iban: "", balance: "0" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    },
  });

  const transMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bank-transactions", {
        ...transForm,
        bankAccountId: Number(transForm.bankAccountId),
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setShowTransForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: [transactionsUrl] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({ title: "Movimento registado com sucesso" });
      setTransForm({ bankAccountId: "", description: "", type: "credit", amount: "0", reference: "", notes: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registar movimento", description: error.message, variant: "destructive" });
    },
  });

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

  function handlePrintExtrato() {
    const account = selectedAccount ? accounts.find(a => a.id === selectedAccount) : null;
    const filtered = transactions;
    const dates = filtered.map(t => new Date(t.date)).filter(d => !isNaN(d.getTime()));
    const periodStart = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
    const periodEnd = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;
    const openingBalance = account ? Number(account.balance) - filtered.reduce((s, t) => s + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0) : 0;

    printBankDocument({
      accountName: account?.name || "Todas as Contas",
      bank: account?.bank,
      iban: account?.iban,
      openingBalance,
      closingBalance: account ? Number(account.balance) : undefined,
      periodStart,
      periodEnd,
      transactions: filtered.map(t => ({
        date: t.date,
        description: t.description,
        reference: t.reference,
        notes: (t as any).notes,
        type: t.type,
        amount: t.amount,
      })),
    }, company || null);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Bancos</h1>
          <p className="text-sm text-muted-foreground">Gestão de contas bancárias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintExtrato} data-testid="button-print-extrato">
            <Printer className="w-4 h-4 mr-2" />Extrato
          </Button>
          <Dialog open={showTransForm} onOpenChange={setShowTransForm}>
            <DialogTrigger asChild>
              <Button variant="secondary" data-testid="button-new-transaction"><Plus className="w-4 h-4 mr-2" />Movimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Movimento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm" value={transForm.bankAccountId} onChange={(e) => setTransForm({ ...transForm, bankAccountId: e.target.value })} data-testid="select-bank-account">
                    <option value="">Selecionar conta</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} - {a.bank}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={transForm.description} onChange={(e) => setTransForm({ ...transForm, description: e.target.value })} data-testid="input-trans-desc" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select className="w-full h-9 rounded-md border px-3 text-sm" value={transForm.type} onChange={(e) => setTransForm({ ...transForm, type: e.target.value })} data-testid="select-trans-type">
                      <option value="credit">Crédito (Entrada)</option>
                      <option value="debit">Débito (Saída)</option>
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Montante</Label><Input type="number" step="0.01" value={transForm.amount} onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })} data-testid="input-trans-amount" /></div>
                </div>
                <div className="space-y-2"><Label>Referência</Label><Input value={transForm.reference} onChange={(e) => setTransForm({ ...transForm, reference: e.target.value })} /></div>
                <div className="space-y-2"><Label>Observações</Label><Textarea rows={2} placeholder="Notas adicionais..." value={transForm.notes} onChange={(e) => setTransForm({ ...transForm, notes: e.target.value })} data-testid="input-trans-notes" /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowTransForm(false)}>Cancelar</Button>
                  <Button onClick={() => transMutation.mutate()} disabled={transMutation.isPending || !transForm.bankAccountId || !transForm.description} data-testid="button-save-transaction">
                    {transMutation.isPending ? "A guardar..." : "Registar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-account"><Plus className="w-4 h-4 mr-2" />Nova Conta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome da Conta</Label><Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} data-testid="input-account-name" /></div>
                <div className="space-y-2"><Label>Banco</Label><Input value={accountForm.bank} onChange={(e) => setAccountForm({ ...accountForm, bank: e.target.value })} data-testid="input-bank-name" /></div>
                <div className="space-y-2"><Label>IBAN</Label><Input value={accountForm.iban} onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })} /></div>
                <div className="space-y-2"><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button onClick={() => accountMutation.mutate()} disabled={accountMutation.isPending || !accountForm.name || !accountForm.bank} data-testid="button-save-account">
                    {accountMutation.isPending ? "A guardar..." : "Criar Conta"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card><CardContent className="p-4">
        <p className="text-sm text-muted-foreground">Saldo Total</p>
        <p className={`text-3xl font-bold ${totalBalance >= 0 ? "text-primary" : "text-destructive"}`} data-testid="value-total-bank-balance">
          {formatCurrency(totalBalance)}
        </p>
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? [1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>) :
          accounts.map((account) => (
            <Card key={account.id} className={`cursor-pointer ${selectedAccount === account.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedAccount(selectedAccount === account.id ? null : account.id)} data-testid={`card-account-${account.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.bank}</p>
                    {account.iban && <p className="text-xs text-muted-foreground font-mono mt-1">{account.iban}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${Number(account.balance) >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Movimentos Bancários
              {selectedAccount && <span className="text-sm font-normal text-muted-foreground ml-2">— {accounts.find(a => a.id === selectedAccount)?.name}</span>}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição / Observações</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="text-right">Montante</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Landmark className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sem movimentos</p>
                </TableCell></TableRow>
              ) : transactions.map((t) => (
                <TableRow key={t.id} data-testid={`row-transaction-${t.id}`}>
                  <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{t.description}</div>
                    {(t as any).notes && <div className="text-xs text-muted-foreground mt-0.5">{(t as any).notes}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{t.reference}</TableCell>
                  <TableCell className={`text-right font-medium ${t.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "-"} {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>
                    {t.type === "credit" ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        <ArrowUpRight className="w-3 h-3 mr-1" />Crédito
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ArrowDownRight className="w-3 h-3 mr-1" />Débito
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
