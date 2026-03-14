import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Vendas from "@/pages/vendas";
import Compras from "@/pages/compras";
import Inventario from "@/pages/inventario";
import Clientes from "@/pages/clientes";
import Fornecedores from "@/pages/fornecedores";
import Bancos from "@/pages/bancos";
import Mapas from "@/pages/mapas";
import Saft from "@/pages/saft";
import ContasCorrente from "@/pages/contas-correntes";
import Configuracoes from "@/pages/configuracoes";

import { applyTheme } from "@/lib/theme";

function Router() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sales_rotina_prefs");
      const theme = saved ? JSON.parse(saved).theme || "light" : "light";
      applyTheme(theme);
    } catch {
      applyTheme("light");
    }
  }, []);

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vendas" component={Vendas} />
      <Route path="/compras" component={Compras} />
      <Route path="/inventario" component={Inventario} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/fornecedores" component={Fornecedores} />
      <Route path="/contas-correntes" component={ContasCorrente} />
      <Route path="/bancos" component={Bancos} />
      <Route path="/mapas" component={Mapas} />
      <Route path="/saft" component={Saft} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center gap-2 p-2 border-b h-12 shrink-0">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <span className="text-sm font-medium text-muted-foreground">Sales-Rotina - Software de Gestão Comercial</span>
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
