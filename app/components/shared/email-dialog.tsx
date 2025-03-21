"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[600px] md:w-[800px] lg:w-[1000px] h-[calc(100vh-2rem)] max-h-none p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 pb-2">
            <DialogTitle>Envoyer {type === 'quote' ? 'le devis' : 'la facture'} par email</DialogTitle>
          </div>
          
          <Tabs defaultValue="edit" className="flex-1 flex flex-col">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edition</TabsTrigger>
                <TabsTrigger value="preview">Aperçu</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="edit" className="h-full p-6 pt-4 m-0">
                <div className="flex flex-col h-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email du destinataire</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="client@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Objet</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2 min-h-0">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="h-[calc(100%-2rem)] min-h-[200px] font-mono text-sm resize-none"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full p-6 pt-4 m-0">
                <ScrollArea className="h-full pr-4">
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

          <div className="p-6 pt-2 border-t bg-background">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSending}
              >
                {isSending ? "Envoi en cours..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}