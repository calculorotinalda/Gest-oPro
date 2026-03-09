import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { Invoice, Product, Customer } from "@shared/schema";

const COLORS = ["hsl(217, 91%, 45%)", "hsl(173, 58%, 39%)", "hsl(43, 74%, 49%)", "hsl(27, 87%, 50%)", "hsl(197, 37%, 24%)", "hsl(340, 65%, 47%)", "hsl(142, 52%, 36%)", "hsl(262, 47%, 50%)"];

export default function Mapas() {
  const { data: invoices = [], isLoading: loadingInv } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: products = [], isLoading: loadingProd } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: customers = [], isLoading: loadingCust } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard"] });

  const isLoading = loadingInv || loadingProd || loadingCust;

  const customerSales = invoices
    .filter(inv => inv.type !== "NC")
    .reduce((acc: Record<string, { name: string; total: number; count: number }>, inv) => {
      const key = inv.customerName || "Consumidor Final";
      if (!acc[key]) acc[key] = { name: key, total: 0, count: 0 };
      acc[key].total += Number(inv.total || 0);
      acc[key].count++;
      return acc;
    }, {});

  const topCustomersBySales = Object.values(customerSales)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(c => ({ name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name, fullName: c.name, value: c.total, count: c.count }));

  const customerBalances = [...customers]
    .filter(c => Number(c.balance || 0) !== 0)
    .sort((a, b) => Math.abs(Number(b.balance || 0)) - Math.abs(Number(a.balance || 0)))
    .slice(0, 8)
    .map(c => ({ name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name, value: Number(c.balance || 0) }));

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

  const productsByStock = [...products]
    .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
    .slice(0, 10)
    .map(p => ({
      name: p.name.length > 18 ? p.name.substring(0, 18) + "..." : p.name,
      code: p.code,
      stock: Number(p.stock || 0),
      value: Number(p.stock || 0) * Number(p.purchasePrice || 0),
      minStock: Number(p.minStock || 0),
    }));

  const lowStockProducts = [...products]
    .filter(p => Number(p.stock || 0) <= Number(p.minStock || 0) && Number(p.minStock || 0) > 0)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .map(p => ({
      code: p.code,
      name: p.name,
      stock: Number(p.stock || 0),
      minStock: Number(p.minStock || 0),
    }));

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
          <TabsTrigger value="artigos" data-testid="tab-artigos">Artigos</TabsTrigger>
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
                <div><p className="text-sm text-muted-foreground">Total Faturado</p><p className="text-2xl font-bold text-primary">{formatCurrency(invoices.filter(i => i.type !== "NC").reduce((s, i) => s + Number(i.total || 0), 0))}</p></div>
                <div><p className="text-sm text-muted-foreground">Valor Pendente</p><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(invoices.reduce((s, i) => s + Number(i.pending || 0), 0))}</p></div>
                <div><p className="text-sm text-muted-foreground">IVA Total</p><p className="text-2xl font-bold">{formatCurrency(invoices.reduce((s, i) => s + Number(i.vatTotal || 0), 0))}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Top Clientes por Volume de Vendas</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[320px]" data-testid="chart-top-customers">
                  {topCustomersBySales.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCustomersBySales} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "6px" }} />
                        <Bar dataKey="value" name="Volume" fill="hsl(217, 91%, 45%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de vendas</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Ranking de Clientes</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Docs</TableHead>
                      <TableHead className="text-right">Total Vendas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomersBySales.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem dados de clientes</TableCell></TableRow>
                    ) : topCustomersBySales.map((c, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{c.fullName}</TableCell>
                        <TableCell className="text-right">{c.count}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{formatCurrency(c.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {customerBalances.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Saldos de Conta Corrente</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerBalances} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "6px" }} />
                      <Bar dataKey="value" name="Saldo" fill="hsl(173, 58%, 39%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="artigos" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Top Artigos por Stock</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[320px]" data-testid="chart-top-stock">
                  {productsByStock.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productsByStock} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                        <Tooltip contentStyle={{ borderRadius: "6px" }} />
                        <Bar dataKey="stock" name="Stock" fill="hsl(43, 74%, 49%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Sem produtos</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Valor em Stock por Artigo</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Artigo</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsByStock.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem artigos</TableCell></TableRow>
                    ) : productsByStock.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{p.code}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.stock}</TableCell>
                        <TableCell className="text-right text-primary font-medium">{formatCurrency(p.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {lowStockProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Artigos com Stock Baixo / Rutura</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Artigo</TableHead>
                      <TableHead className="text-right">Stock Atual</TableHead>
                      <TableHead className="text-right">Stock Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{p.code}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.stock}</TableCell>
                        <TableCell className="text-right">{p.minStock}</TableCell>
                        <TableCell>
                          {p.stock === 0 ? (
                            <Badge variant="destructive">Rutura</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">Baixo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
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

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Resumo de Inventário</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-sm text-muted-foreground">Total Artigos</p><p className="text-2xl font-bold">{products.length}</p></div>
                <div><p className="text-sm text-muted-foreground">Stock Total</p><p className="text-2xl font-bold">{products.reduce((s, p) => s + Number(p.stock || 0), 0)}</p></div>
                <div><p className="text-sm text-muted-foreground">Valor Total</p><p className="text-2xl font-bold text-primary">{formatCurrency(products.reduce((s, p) => s + Number(p.stock || 0) * Number(p.purchasePrice || 0), 0))}</p></div>
                <div><p className="text-sm text-muted-foreground">Stock Baixo</p><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockProducts.length}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
