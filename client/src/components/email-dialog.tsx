import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Send, X, Mail, AlertCircle, Settings } from "lucide-react";
import { Link } from "wouter";

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultCc?: string;
  defaultSubject: string;
  defaultBody: string;
}

export function EmailDialog({ open, onClose, defaultTo = "", defaultCc = "", defaultSubject, defaultBody }: EmailDialogProps) {
  const { toast } = useToast();
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState(defaultCc);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const { data: emailConfig } = useQuery<any>({ queryKey: ["/api/email-settings"] });
  const emailEnabled = emailConfig?.enabled && emailConfig?.smtpHost;

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email/send", { to, cc: cc || undefined, subject, body });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Email enviado com sucesso", description: `Para: ${to}` });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar email", description: error.message, variant: "destructive" });
    },
  });

  function handleOpen(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg" data-testid="dialog-email">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Enviar Documento por Email
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes e envie o documento directamente para o destinatário
          </DialogDescription>
        </DialogHeader>

        {!emailEnabled && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <span>Email SMTP não configurado.</span>
              <Link href="/configuracoes" onClick={onClose}>
                <span className="underline cursor-pointer flex items-center gap-1 font-medium">
                  <Settings className="w-3 h-3" /> Configurar
                </span>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {emailEnabled && (
          <Badge variant="default" className="w-fit bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
            Servidor SMTP configurado
          </Badge>
        )}

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="email-to">Para *</Label>
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="destinatario@empresa.pt"
              data-testid="input-email-to"
            />
            {to && !isValidEmail && (
              <p className="text-xs text-destructive">Endereço de email inválido</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-cc">CC <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="email-cc"
              type="email"
              value={cc}
              onChange={e => setCc(e.target.value)}
              placeholder="copia@empresa.pt"
              data-testid="input-email-cc"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Assunto *</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              data-testid="input-email-subject"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-body">Mensagem *</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              data-testid="textarea-email-body"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} data-testid="button-email-cancel">
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!to || !isValidEmail || !subject || !body || sendMutation.isPending || !emailEnabled}
              data-testid="button-email-send"
            >
              {sendMutation.isPending ? (
                "A enviar..."
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Enviar Email</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
