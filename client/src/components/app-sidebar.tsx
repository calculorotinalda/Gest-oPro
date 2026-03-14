import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Building2,
  Landmark, BarChart3, Download, Receipt, Settings
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import defaultLogoUrl from "@assets/logo_calculorotina.png";

const navGroups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Documentos",
    items: [
      { title: "Vendas", url: "/vendas", icon: FileText },
      { title: "Compras", url: "/compras", icon: ShoppingCart },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Inventário", url: "/inventario", icon: Package },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
      { title: "Contas Correntes", url: "/contas-correntes", icon: Receipt },
      { title: "Bancos", url: "/bancos", icon: Landmark },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { title: "Mapas de Exploração", url: "/mapas", icon: BarChart3 },
      { title: "Exportar SAF-T", url: "/saft", icon: Download },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: company } = useQuery<any>({ queryKey: ["/api/company"] });
  const customLogo = company?.logo;
  const activeLogo = customLogo || defaultLogoUrl;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center gap-1">
          <img
            src={activeLogo}
            alt="Calculorotina"
            className={`h-9 w-auto object-contain${customLogo ? "" : " dark:brightness-0 dark:invert"}`}
            data-testid="img-logo"
          />
          <p className="text-xs text-muted-foreground" data-testid="text-app-name">Sales-Rotina</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild data-active={isActive}>
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/[\s/]/g, "-")}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">Sales-Rotina v1.0</p>
        <p className="text-xs text-muted-foreground text-center">Legislação Portuguesa</p>
      </SidebarFooter>
    </Sidebar>
  );
}
