import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Building2, Landmark, BarChart3, Download
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

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
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight" data-testid="text-app-name">GestãoPro</h2>
            <p className="text-xs text-muted-foreground">Software de Gestão</p>
          </div>
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
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
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
        <p className="text-xs text-muted-foreground text-center">GestãoPro v1.0</p>
        <p className="text-xs text-muted-foreground text-center">Legislação Portuguesa</p>
      </SidebarFooter>
    </Sidebar>
  );
}
