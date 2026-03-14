import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Settings, Palette, FileText, Save, CheckCircle2, Globe, Phone, Mail, MapPin, Hash, Server, Eye, EyeOff, ImageIcon, Upload, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { applyTheme } from "@/lib/theme";
import type { Company } from "@shared/schema";
import defaultLogoUrl from "@assets/logo_calculorotina.png";

const PREFS_KEY = "sales_rotina_prefs";

interface AppPrefs {
  defaultVatRate: string;
  defaultPaymentDays: string;
  defaultPaymentMethod: string;
  theme: "light" | "dark" | "system";
  fiscalYear: string;
  currency: string;
  invoiceNotes: string;
}

const defaultPrefs: AppPrefs = {
  defaultVatRate: "23",
  defaultPaymentDays: "30",
  defaultPaymentMethod: "transferencia",
  theme: "light",
  fiscalYear: new Date().getFullYear().toString(),
  currency: "EUR",
  invoiceNotes: "",
};

function loadPrefs(): AppPrefs {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(prefs: AppPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function Configuracoes() {
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery<Company>({ queryKey: ["/api/company"] });
  const { data: emailSettingsData } = useQuery<any>({ queryKey: ["/api/email-settings"] });

  const [name, setName] = useState("");
  const [nif, setNif] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Portugal");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [prefs, setPrefs] = useState<AppPrefs>(loadPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company?.logo) setLogoPreview(company.logo);
  }, [company?.logo]);

  useEffect(() => {
    if (emailSettingsData) {
      setSmtpHost(emailSettingsData.smtpHost || "");
      setSmtpPort(String(emailSettingsData.smtpPort || "587"));
      setSmtpUser(emailSettingsData.smtpUser || "");
      setSmtpFrom(emailSettingsData.smtpFrom || "");
      setSmtpSecure(emailSettingsData.smtpSecure || false);
      setSmtpEnabled(emailSettingsData.enabled || false);
    }
  }, [emailSettingsData]);

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setNif(company.nif || "");
      setAddress(company.address || "");
      setPostalCode(company.postalCode || "");
      setCity(company.city || "");
      setCountry(company.country || "Portugal");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setWebsite(company.website || "");
    }
  }, [company]);

  const companyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/company", {
        name, nif, address, postalCode, city, country, phone, email, website,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Dados da empresa guardados com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao guardar dados", description: error.message, variant: "destructive" });
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/email-settings", {
        smtpHost, smtpPort: Number(smtpPort) || 587,
        smtpUser, smtpPass: smtpPass || undefined,
        smtpFrom, smtpSecure, enabled: smtpEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({ title: "Configurações de email guardadas com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao guardar configurações de email", description: error.message, variant: "destructive" });
    },
  });

  function handleSavePrefs() {
    savePrefs(prefs);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
    toast({ title: "Preferências guardadas com sucesso" });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Ficheiro inválido", description: "Selecione uma imagem (PNG, JPG, SVG, WebP)", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ficheiro demasiado grande", description: "O logótipo não pode exceder 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setIsUploadingLogo(true);
      try {
        await apiRequest("POST", "/api/company/logo", { logo: dataUrl });
        queryClient.invalidateQueries({ queryKey: ["/api/company"] });
        toast({ title: "Logótipo guardado com sucesso" });
      } catch (err: any) {
        toast({ title: "Erro ao guardar logótipo", description: err.message, variant: "destructive" });
        setLogoPreview(company?.logo || null);
      } finally {
        setIsUploadingLogo(false);
        if (logoInputRef.current) logoInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleLogoRemove() {
    setIsUploadingLogo(true);
    try {
      await apiRequest("DELETE", "/api/company/logo");
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      setLogoPreview(null);
      toast({ title: "Logótipo removido" });
    } catch (err: any) {
      toast({ title: "Erro ao remover logótipo", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function updatePref<K extends keyof AppPrefs>(key: K, value: AppPrefs[K]) {
    setPrefs(prev => ({ ...prev, [key]: value }));
    if (key === "theme") {
      applyTheme(value as "light" | "dark" | "system");
    }
  }

  const nifValid = !nif || /^\d{9}$/.test(nif.replace(/\s/g, ""));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Settings className="w-6 h-6" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Dados da empresa e preferências do sistema</p>
      </div>

      {/* ── Dados da Empresa ── */}
      <Card data-testid="card-company-settings">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Dados da Empresa</CardTitle>
              <CardDescription className="text-xs">Informação que aparece nos documentos emitidos e no SAF-T</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-9 bg-muted animate-pulse rounded-md" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="company-name" className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Designação Social
                  </Label>
                  <Input
                    id="company-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome da empresa"
                    data-testid="input-company-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company-nif" className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    NIF
                    {nif && !nifValid && (
                      <Badge variant="destructive" className="ml-1 text-xs py-0">Inválido</Badge>
                    )}
                    {nif && nifValid && (
                      <Badge variant="default" className="ml-1 text-xs py-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Válido</Badge>
                    )}
                  </Label>
                  <Input
                    id="company-nif"
                    value={nif}
                    onChange={e => setNif(e.target.value)}
                    placeholder="000 000 000"
                    data-testid="input-company-nif"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company-country" className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    País
                  </Label>
                  <Input
                    id="company-country"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Portugal"
                    data-testid="input-company-country"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="company-address" className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Morada
                  </Label>
                  <Input
                    id="company-address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Rua, número, andar"
                    data-testid="input-company-address"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company-postal">Código Postal</Label>
                  <Input
                    id="company-postal"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="0000-000"
                    data-testid="input-company-postal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company-city">Localidade</Label>
                  <Input
                    id="company-city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Lisboa"
                    data-testid="input-company-city"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company-phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="company-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+351 000 000 000"
                    data-testid="input-company-phone"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company-email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    E-mail
                  </Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="geral@empresa.pt"
                    data-testid="input-company-email"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="company-website" className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    Website
                  </Label>
                  <Input
                    id="company-website"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="www.empresa.pt"
                    data-testid="input-company-website"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={() => companyMutation.mutate()}
                  disabled={companyMutation.isPending || !name}
                  className="gap-2"
                  data-testid="button-save-company"
                >
                  {companyMutation.isPending ? (
                    <>A guardar...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Guardar Dados da Empresa</>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Logótipo ── */}
      <Card data-testid="card-logo-settings">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base">Logótipo da Empresa</CardTitle>
              <CardDescription className="text-xs">Aparece no cabeçalho de todos os documentos impressos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <div className="w-48 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex items-center justify-center overflow-hidden" data-testid="logo-preview-container">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logótipo"
                    className="max-w-full max-h-full object-contain p-2"
                    data-testid="img-logo-preview"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <img
                      src={defaultLogoUrl}
                      alt="Logótipo predefinido"
                      className="h-8 w-auto object-contain opacity-50"
                      data-testid="img-logo-default"
                    />
                    <span className="text-xs">Logótipo predefinido</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">
                  {logoPreview ? "Logótipo personalizado activo" : "A usar logótipo predefinido"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos suportados: PNG, JPG, SVG, WebP. Tamanho máximo: 2MB.<br />
                  Recomendado: fundo transparente (PNG), dimensões 400×120 px ou similar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  data-testid="input-logo-file"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isUploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  data-testid="button-upload-logo"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingLogo ? "A guardar..." : logoPreview ? "Substituir Logótipo" : "Carregar Logótipo"}
                </Button>
                {logoPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    disabled={isUploadingLogo}
                    onClick={handleLogoRemove}
                    data-testid="button-remove-logo"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Configurações de Documentos ── */}
      <Card data-testid="card-doc-settings">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Configurações de Documentos</CardTitle>
              <CardDescription className="text-xs">Valores predefinidos para criação de novos documentos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ano Fiscal em Curso</Label>
              <Input
                type="number"
                value={prefs.fiscalYear}
                onChange={e => updatePref("fiscalYear", e.target.value)}
                placeholder={new Date().getFullYear().toString()}
                data-testid="input-fiscal-year"
              />
              <p className="text-xs text-muted-foreground">Usado na numeração automática dos documentos</p>
            </div>

            <div className="space-y-1.5">
              <Label>Taxa de IVA Predefinida</Label>
              <Select value={prefs.defaultVatRate} onValueChange={v => updatePref("defaultVatRate", v)}>
                <SelectTrigger data-testid="select-default-vat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% — Isento</SelectItem>
                  <SelectItem value="6">6% — Taxa Reduzida</SelectItem>
                  <SelectItem value="13">13% — Taxa Intermédia</SelectItem>
                  <SelectItem value="23">23% — Taxa Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Prazo de Pagamento Predefinido</Label>
              <Select value={prefs.defaultPaymentDays} onValueChange={v => updatePref("defaultPaymentDays", v)}>
                <SelectTrigger data-testid="select-payment-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Pagamento imediato</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Método de Pagamento Predefinido</Label>
              <Select value={prefs.defaultPaymentMethod} onValueChange={v => updatePref("defaultPaymentMethod", v)}>
                <SelectTrigger data-testid="select-default-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="numerario">Numerário</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="multibanco">Multibanco / TPA</SelectItem>
                  <SelectItem value="mbway">MB WAY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Moeda</Label>
              <Select value={prefs.currency} onValueChange={v => updatePref("currency", v)}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                  <SelectItem value="USD">USD — Dólar ($)</SelectItem>
                  <SelectItem value="GBP">GBP — Libra (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              variant={prefsSaved ? "default" : "outline"}
              onClick={handleSavePrefs}
              className={`gap-2 transition-all ${prefsSaved ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : ""}`}
              data-testid="button-save-prefs"
            >
              {prefsSaved ? (
                <><CheckCircle2 className="w-4 h-4" /> Guardado!</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Preferências</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Configurações de Email ── */}
      <Card data-testid="card-email-settings">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Envio de Email (SMTP)</CardTitle>
              <CardDescription className="text-xs">Configure o servidor de correio para envio automático de documentos</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="smtp-enabled" className="text-sm">Activado</Label>
              <Switch
                id="smtp-enabled"
                checked={smtpEnabled}
                onCheckedChange={setSmtpEnabled}
                data-testid="switch-smtp-enabled"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!smtpEnabled && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Configure um servidor SMTP para poder enviar documentos por email directamente a partir da aplicação.</p>
              <p className="mt-1 text-xs">Funciona com Gmail, Outlook, Mailtrap e qualquer servidor SMTP.</p>
            </div>
          )}

          {smtpEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="smtp-host" className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-muted-foreground" />
                  Servidor SMTP (Host)
                </Label>
                <Input
                  id="smtp-host"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  data-testid="input-smtp-host"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="smtp-port">Porto</Label>
                <Select value={smtpPort} onValueChange={setSmtpPort}>
                  <SelectTrigger id="smtp-port" data-testid="select-smtp-port">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 — SMTP (não seguro)</SelectItem>
                    <SelectItem value="465">465 — SMTPS (SSL)</SelectItem>
                    <SelectItem value="587">587 — SMTP (TLS/STARTTLS)</SelectItem>
                    <SelectItem value="2525">2525 — SMTP alternativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="smtp-user" className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Utilizador (Email)
                </Label>
                <Input
                  id="smtp-user"
                  type="email"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="envios@empresa.pt"
                  data-testid="input-smtp-user"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="smtp-pass">Palavra-passe</Label>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showSmtpPass ? "text" : "password"}
                    value={smtpPass}
                    onChange={e => setSmtpPass(e.target.value)}
                    placeholder={emailSettingsData?.smtpPassSet ? "••••••••" : "Palavra-passe SMTP"}
                    className="pr-10"
                    data-testid="input-smtp-pass"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {emailSettingsData?.smtpPassSet && !smtpPass && (
                  <p className="text-xs text-muted-foreground">Palavra-passe guardada — deixe em branco para manter</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="smtp-from">Endereço de Origem (From)</Label>
                <Input
                  id="smtp-from"
                  type="email"
                  value={smtpFrom}
                  onChange={e => setSmtpFrom(e.target.value)}
                  placeholder="Empresa, Lda <geral@empresa.pt>"
                  data-testid="input-smtp-from"
                />
                <p className="text-xs text-muted-foreground">Se vazio, usa o utilizador SMTP como remetente</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <Switch
                  id="smtp-secure"
                  checked={smtpSecure}
                  onCheckedChange={setSmtpSecure}
                  data-testid="switch-smtp-secure"
                />
                <Label htmlFor="smtp-secure" className="text-sm cursor-pointer">
                  Usar SSL/TLS (ligação segura) — activar para porta 465
                </Label>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {smtpEnabled && smtpHost && smtpUser ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  SMTP configurado: {smtpUser} → {smtpHost}:{smtpPort}
                </span>
              ) : smtpEnabled ? (
                <span className="text-amber-600">Preencha o host e utilizador para activar</span>
              ) : (
                <span>Envio de email desactivado</span>
              )}
            </div>
            <Button
              onClick={() => emailMutation.mutate()}
              disabled={emailMutation.isPending}
              className="gap-2"
              data-testid="button-save-email-settings"
            >
              {emailMutation.isPending ? "A guardar..." : <><Save className="w-4 h-4" /> Guardar Configurações</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Aparência ── */}
      <Card data-testid="card-appearance-settings">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base">Aparência</CardTitle>
              <CardDescription className="text-xs">Personalização visual da interface</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-2" data-testid="theme-selector">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updatePref("theme", t)}
                    data-testid={`button-theme-${t}`}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      prefs.theme === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    <span className="text-base">
                      {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"}
                    </span>
                    <span className="text-xs capitalize">
                      {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Sistema"}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {prefs.theme === "system" ? "Segue as preferências do sistema operativo" : ""}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              variant={prefsSaved ? "default" : "outline"}
              onClick={handleSavePrefs}
              className={`gap-2 transition-all ${prefsSaved ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : ""}`}
              data-testid="button-save-appearance"
            >
              {prefsSaved ? (
                <><CheckCircle2 className="w-4 h-4" /> Guardado!</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Aparência</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Info do sistema ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Informação do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Aplicação", value: "Sales-Rotina" },
              { label: "Versão", value: "1.0.0" },
              { label: "Legislação", value: "Portugal" },
              { label: "Base de Dados", value: "PostgreSQL" },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
