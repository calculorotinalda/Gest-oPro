import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, DollarSign, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Situação Anual</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
      </div>
    );
  }

  const kpis = [
    {
      title: "Rendimentos",
      current: stats?.revenue || 0,
      ytd: stats?.revenueYtd || 0,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      label: "Mês atual",
      ytdLabel: "Desde janeiro",
    },
    {
      title: "Gastos",
      current: -(stats?.expenses || 0),
      ytd: -(stats?.expensesYtd || 0),
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: "Mês atual",
      ytdLabel: "Desde janeiro",
    },
    {
      title: "Resultados (rendimentos - gastos)",
      current: stats?.profit || 0,
      ytd: stats?.profitYtd || 0,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      label: "Mês atual",
      ytdLabel: "Desde janeiro",
    },
    {
      title: "IVA (estimado)",
      current: stats?.vatEstimate || 0,
      ytd: null,
      icon: Receipt,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      label: "Jan a Mar",
      ytdLabel: null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Situação Anual</h1>
          <p className="text-sm text-muted-foreground">Visão geral do exercício {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-1 mb-3">
                <p className="text-sm font-medium text-muted-foreground leading-tight">{kpi.title}</p>
                <div className={`w-8 h-8 rounded-md ${kpi.bgColor} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  <span className={`text-lg font-bold ${kpi.current >= 0 ? "" : "text-destructive"}`} data-testid={`value-${kpi.title.split(" ")[0].toLowerCase()}-current`}>
                    {formatCurrency(Math.abs(kpi.current))}
                  </span>
                </div>
                {kpi.ytdLabel && (
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs text-muted-foreground">{kpi.ytdLabel}</span>
                    <span className={`text-sm font-semibold ${(kpi.ytd ?? 0) >= 0 ? "" : "text-destructive"}`} data-testid={`value-${kpi.title.split(" ")[0].toLowerCase()}-ytd`}>
                      {formatCurrency(Math.abs(kpi.ytd ?? 0))}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/60" /> Rendimentos</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive/60" /> Gastos</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500/60" /> Resultados</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" data-testid="chart-monthly">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlyData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ fontWeight: "bold" }}
                  contentStyle={{ borderRadius: "6px", border: "1px solid hsl(220, 13%, 91%)" }}
                />
                <Area type="monotone" dataKey="revenue" name="Rendimentos" stroke="hsl(217, 91%, 45%)" fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Gastos" stroke="hsl(0, 84%, 45%)" fill="url(#colorExpenses)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Resultados" stroke="hsl(160, 60%, 40%)" fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Previsão total de valores a receber</p>
                <p className="text-xl font-bold text-primary" data-testid="value-receivable">
                  {formatCurrency(stats?.totalReceivable || 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Previsão total de valores a pagar</p>
                <p className="text-xl font-bold text-destructive" data-testid="value-payable">
                  - {formatCurrency(stats?.totalPayable || 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
