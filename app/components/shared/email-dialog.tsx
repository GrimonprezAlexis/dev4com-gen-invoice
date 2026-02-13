"use client";

import { useState } from "react";
import { Mail, Eye, Edit, Send, AlertCircle, Paperclip, X, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Invoice, BillingInvoice } from "@/app/types";
import { useConfetti } from "@/app/hooks/use-confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailTemplate {
  from: string;
  subject: string;
  defaultMessage: string;
  defaultMessageWithoutPayment?: string;
}

interface EmailDialogProps {
  document: Invoice | BillingInvoice;
  type: 'quote' | 'billing';
  onEmailSent: () => void;
  emailTemplate: EmailTemplate;
  validationUrl?: string;
}

export function EmailDialog({ document, type, onEmailSent, emailTemplate, validationUrl }: EmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(emailTemplate.subject);
  const [withPayment, setWithPayment] = useState(!!validationUrl);
  const [message, setMessage] = useState(emailTemplate.defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fireConfetti = useConfetti();

  const handleTogglePayment = (checked: boolean) => {
    setWithPayment(checked);
    // For quotes: message never changes (button always present, only URL changes)
    // For billing: show/hide the payment button in the message
    if (type === 'billing') {
      if (checked) {
        setMessage(emailTemplate.defaultMessage);
      } else {
        setMessage(
          emailTemplate.defaultMessageWithoutPayment ||
          emailTemplate.defaultMessage
            .replace(/\n*Pour régler cette facture[^\n]*\n*/g, '\n')
            .replace(/\n*\[VALIDATION_BUTTON\]\n*/g, '\n')
        );
      }
    }
  };

  // Build the final validation URL based on toggle state
  const getFinalValidationUrl = (): string | undefined => {
    if (!validationUrl) return undefined;

    if (type === 'quote') {
      // Quotes: always send the URL. Append withPayment if Stripe is enabled.
      return withPayment
        ? `${validationUrl}?withPayment=true`
        : validationUrl;
    } else {
      // Billing: only send URL if payment is enabled
      if (!withPayment) return undefined;
      return validationUrl.includes('?')
        ? `${validationUrl}&withPayment=true`
        : `${validationUrl}?withPayment=true`;
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      setError("Veuillez saisir une adresse email");
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      let attachmentData = null;
      if (attachment) {
        const buffer = await attachment.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        attachmentData = {
          filename: attachment.name,
          content: base64,
          contentType: attachment.type,
        };
      }

      const response = await fetch(`/api/send-${type === 'quote' ? 'invoice' : 'billing-invoice'}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject,
          message,
          invoice: document,
          attachment: attachmentData,
          validationUrl: getFinalValidationUrl(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error?.message || `Erreur lors de l'envoi de l'email (${response.status})`;
        setError(errorMessage);
        return;
      }

      fireConfetti();
      toast.success(`${type === 'quote' ? 'Devis' : 'Facture'} envoyé${type === 'quote' ? '' : 'e'} avec succès !`);
      onEmailSent();
      setIsOpen(false);
    } catch (err) {
      setError("Erreur lors de l'envoi de l'email. Veuillez vérifier votre connexion.");
      console.error("Email send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const getToggleDescription = () => {
    if (type === 'quote') {
      return withPayment
        ? "Le client pourra signer et payer en ligne"
        : "Le client pourra signer en ligne (sans paiement)";
    }
    return withPayment
      ? "Le client pourra payer en ligne"
      : "Envoi sans lien de paiement";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setError(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Mail className="w-4 h-4 mr-2" />
          Envoyer par email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Envoyer {type === 'quote' ? 'le devis' : 'la facture'}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Personnalisez et envoyez votre {type === 'quote' ? 'devis' : 'facture'} par email</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 pt-4 pb-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Édition</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="edit" className="p-6 pt-4 m-0">
              <div className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-950/20">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="ml-2 text-red-800 dark:text-red-300">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email du destinataire</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Objet</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                </div>

                {/* Payment toggle */}
                {validationUrl && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${withPayment ? 'bg-blue-100 dark:bg-blue-950' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <CreditCard className={`w-4 h-4 ${withPayment ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Paiement en ligne (Stripe)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getToggleDescription()}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={withPayment}
                      onCheckedChange={handleTogglePayment}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[250px] font-mono text-sm resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachment">Pièce jointe</Label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="attachment"
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-1"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {attachment ? attachment.name : "Ajouter un fichier (PDF, image...)"}
                      </span>
                      <input
                        id="attachment"
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      />
                    </label>
                    {attachment && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachment(null)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {attachment && (
                    <p className="text-xs text-muted-foreground">
                      {(attachment.size / 1024).toFixed(1)} Ko
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="p-6 pt-4 m-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="bg-card rounded-lg p-6 space-y-6">
                  <div className="space-y-2 border-b pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-foreground">À:</span>
                      <span className="text-sm text-muted-foreground">{email || 'Non spécifié'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-foreground">Objet:</span>
                      <span className="text-sm text-foreground">{subject}</span>
                    </div>
                    {validationUrl && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-foreground">Paiement:</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${withPayment ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {withPayment ? 'Avec Stripe' : type === 'quote' ? 'Signature seule' : 'Sans paiement'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="prose max-w-none text-foreground">
                    <div className="space-y-4">
                      {message.split('\n\n').map((paragraph, i) => (
                        <div key={i} className="space-y-2">
                          {paragraph.split('\n').map((line, j) => {
                            if (line.trim() === '[VALIDATION_BUTTON]') {
                              // For quotes: always show button. For billing: only if withPayment
                              const showButton = type === 'quote' || withPayment;
                              if (!showButton) return null;
                              return (
                                <div key={j} className="text-center py-3">
                                  <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                    {type === 'quote'
                                      ? (withPayment ? 'Accepter, signer et payer' : 'Accepter et signer le devis')
                                      : 'Payer cette facture en ligne'
                                    }
                                  </span>
                                </div>
                              );
                            }
                            if (line.startsWith('•')) {
                              return (
                                <div key={j} className="flex items-start">
                                  <span className="text-muted-foreground mr-2">•</span>
                                  <span className="text-foreground">{line.substring(2)}</span>
                                </div>
                              );
                            }
                            return <p key={j} className="text-sm text-foreground">{line}</p>;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  {attachment && (
                    <div className="text-sm text-muted-foreground mt-8 pt-4 border-t flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      <p>Pièce jointe : {attachment.name}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {isSending ? (
              <>
                <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
