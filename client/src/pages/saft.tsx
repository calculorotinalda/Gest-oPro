import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Package, Shield, CheckCircle } from "lucide-react";

export default function Saft() {
  const handleDownload = (type: "sales" | "inventory") => {
    const url = type === "sales" ? "/api/saft/sales" : "/api/saft/inventory";
    window.open(url, "_blank");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Exportar SAF-T</h1>
        <p className="text-sm text-muted-foreground">Ficheiros SAF-T de acordo com a legislação portuguesa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">SAF-T de Vendas</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Ficheiro de faturação</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Formato XML conforme Portaria 302/2016</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Versão SAF-T (PT) 1.04_01</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Inclui faturas, notas de crédito e débito</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Dados de clientes e produtos</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                <Shield className="w-3 h-3 mr-1" />
                Legislação Portuguesa
              </Badge>
              <Badge variant="secondary">XML</Badge>
            </div>
            <Button className="w-full" onClick={() => handleDownload("sales")} data-testid="button-download-saft-sales">
              <Download className="w-4 h-4 mr-2" />
              Exportar SAF-T Vendas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">SAF-T de Inventário</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Ficheiro de existências</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Formato XML conforme legislação</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Versão StockFile 1.01_01</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Inventário de todos os produtos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Quantidades e valores de stock</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                <Shield className="w-3 h-3 mr-1" />
                Legislação Portuguesa
              </Badge>
              <Badge variant="secondary">XML</Badge>
            </div>
            <Button className="w-full" variant="secondary" onClick={() => handleDownload("inventory")} data-testid="button-download-saft-inventory">
              <Download className="w-4 h-4 mr-2" />
              Exportar SAF-T Inventário
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informação sobre SAF-T</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            O SAF-T (Standard Audit File for Tax purposes) é um ficheiro normalizado de auditoria fiscal,
            em formato XML, criado para facilitar a recolha de dados contabilísticos relevantes por parte
            da administração fiscal.
          </p>
          <p>
            Em Portugal, a obrigação de comunicação dos elementos das faturas à Autoridade Tributária e
            Aduaneira (AT) está prevista no Decreto-Lei n.º 198/2012, de 24 de agosto. O formato do
            ficheiro segue a Portaria n.º 302/2016.
          </p>
          <p>
            O ficheiro de inventário deve ser submetido à AT até ao dia 31 de janeiro do ano seguinte
            àquele a que se reporta, conforme o artigo 3.º-A do Decreto-Lei n.º 198/2012.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
