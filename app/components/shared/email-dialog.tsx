"use client";

import { useState } from "react";
import { Mail, Eye, Edit, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Invoice, BillingInvoice } from "@/app/types";
import { useConfetti } from "@/app/hooks/use-confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailTemplate {
  from: string;
  subject: string;
  defaultMessage: string;
}

interface EmailDialogProps {
  document: Invoice | BillingInvoice;
  type: 'quote' | 'billing';
  onEmailSent: () => void;
  emailTemplate: EmailTemplate;
}

export function EmailDialog({ document, type, onEmailSent, emailTemplate }: EmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(emailTemplate.subject);
  const [message, setMessage] = useState(emailTemplate.defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const fireConfetti = useConfetti();

  const handleSendEmail = async () => {
    if (!email) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    setIsSending(true);

    try {
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
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      fireConfetti();
      toast.success(`${type === 'quote' ? 'Devis' : 'Facture'} envoyé${type === 'quote' ? '' : 'e'} avec succès !`);
      onEmailSent();
      setIsOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[300px] font-mono text-sm resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
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
                  </div>
                  <div className="prose max-w-none text-foreground">
                    <div className="space-y-4">
                      {message.split('\n\n').map((paragraph, i) => (
                        <div key={i} className="space-y-2">
                          {paragraph.split('\n').map((line, j) => {
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
                  <div className="text-sm text-muted-foreground mt-8 pt-4 border-t">
                    <p>Un fichier PDF sera joint à cet email</p>
                  </div>
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