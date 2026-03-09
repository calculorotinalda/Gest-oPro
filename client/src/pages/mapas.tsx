import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Invoice, Product, Customer } from "@shared/schema";

const COLORS = ["hsl(217, 91%, 45%)", "hsl(173, 58%, 39%)", "hsl(43, 74%, 49%)", "hsl(27, 87%, 50%)", "hsl(197, 37%, 24%)"];

export default function Mapas() {
  const { data: invoices = [], isLoading: loadingInv } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: products = [], isLoading: loadingProd } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: customers = [], isLoading: loadingCust } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard"] });

  const isLoading = loadingInv || loadingProd || loadingCust;

  const topCustomers = [...customers]
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
    .slice(0, 5)
    .map((c) => ({ name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name, value: Number(c.balance || 0) }));

  const salesByType = invoices.reduce((acc: Record<string, number>, inv) => {
    const labels: Record<string, string> = { FT: "Fatura", FS: "Fat. Simplificada", FR: "Fatura-Recibo", NC: "Nota Crédito", ND: "Nota Débito" };
    const key = labels[inv.type] || inv.type;
    acc[key] = (acc[key] || 0) + Number(inv.total || 0);
    return acc;
  }, {});

  const salesByTypeData = Object.entries(salesByType).map(([name, value]) => ({ name, value }));

  const productCategories = products.reduce((acc: Record<string, { count: number; value: number }>, p) => {
    const cat = p.category || "Sem categoria";
    if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
    acc[cat].count++;
    acc[cat].value += Number(p.stock || 0) * Number(p.purchasePrice || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(productCategories).map(([name, data]) => ({ name, ...data }));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Mapas de Exploração</h1>
        <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-[250px] w-full" /></CardContent></Card>)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Mapas de Exploração</h1>
        <p className="text-sm text-muted-foreground">Análise e relatórios do negócio</p>
      </div>

      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas" data-testid="tab-vendas">Vendas</TabsTrigger>
          <TabsTrigger value="clientes" data-testid="tab-clientes">Clientes</TabsTrigger>
          <TabsTrigger value="inventario" data-testid="tab-inventario">Inventário</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Mês</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]" data-testid="chart-sales-monthly">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "6px", border: "1px solid hsl(220, 13%, 91%)" }} />
                      <Bar dataKey="revenue" name="Vendas" fill="hsl(217, 91%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Tipo de Documento</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]" data-testid="chart-sales-type">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesByTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {salesByTypeData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Resumo de Vendas</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-sm text-muted-foreground">Total Documentos</p><p className="text-2xl font-bold">{invoices.length}</p></div>
                <div><p className="text-sm text-muted-foreground">Total Faturado</p><p className="text-2xl font-bold text-primary">{formatCurrency(invoices.reduce((s, i) => s + Number(i.total || 0), 0))}</p></div>
                <div><p className="text-sm text-muted-foreground">Valor Pendente</p><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(invoices.reduce((s, i) => s + Number(i.pending || 0), 0))}</p></div>
                <div><p className="text-sm text-muted-foreground">IVA Total</p><p className="text-2xl font-bold">{formatCurrency(invoices.reduce((s, i) => s + Number(i.vatTotal || 0), 0))}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Top 5 Clientes (Saldo)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]" data-testid="chart-top-customers">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "6px" }} />
                      <Bar dataKey="value" name="Saldo" fill="hsl(173, 58%, 39%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Contas Correntes</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.filter(c => Number(c.balance || 0) > 0).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{formatCurrency(c.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Stock por Categoria</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]" data-testid="chart-stock-category">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Valor em Stock por Categoria</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Produtos</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.map((cat) => (
                      <TableRow key={cat.name}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">{cat.count}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{formatCurrency(cat.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
