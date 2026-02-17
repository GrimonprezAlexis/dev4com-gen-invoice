"use client";

import { useState } from "react";
import { Wand2, Loader2, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Service } from "@/app/types";

interface GeneratedData {
  services: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentTerms: string;
}

interface AIRewriteDialogProps {
  services: Service[];
  catalogData: any;
  quoteData: any;
  onApply: (data: GeneratedData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIRewriteDialog({
  services,
  catalogData,
  quoteData,
  onApply,
  isOpen,
  onOpenChange,
}: AIRewriteDialogProps) {
  const [draftContent, setDraftContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"draft" | "result">("draft");

  const handleGenerateContent = async () => {
    if (!draftContent.trim()) {
      setError("Veuillez saisir du contenu brouillon");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-quote-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftContent,
          catalogData,
          quoteData: {
            clientName: quoteData.client?.name || "Client",
            services: services,
            totalAmount: quoteData.totalAmount || 0,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la génération du contenu"
        );
      }

      const data = await response.json();
      setGeneratedData({
        services: data.services || [],
        paymentTerms: data.paymentTerms || "",
      });
      setStep("result");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`${errorMessage} - Vérifiez votre clé API Groq dans .env.local`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedData) {
      onApply(generatedData);
      handleReset();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setDraftContent("");
    setGeneratedData(null);
    setError("");
    setStep("draft");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent resizable className="w-[95vw] sm:w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Rédaction IA - Contenu du devis
            </DialogTitle>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Llama 3.3 70B · Groq
            </span>
          </div>
          <DialogDescription>
            {step === "draft"
              ? "Saisissez votre contenu brouillon et laissez l'IA le transformer en texte professionnel"
              : "Aperçu du contenu rédigé - vous pouvez l'accepter ou revenir en arrière"}
          </DialogDescription>
        </DialogHeader>

        {step === "draft" ? (
          // Étape 1 : Saisie du brouillon
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Contenu brouillon (en langage naturel)
              </label>
              <Textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Exemple: Les services incluent la création d'un site web professionnel, avec maintenance et support client pendant 12 mois. Aussi formation sur l'utilisation du site."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Décrivez les services, avantages ou conditions de paiement en
                langage simple. L'IA les transformera en texte professionnel.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleReset();
                  onOpenChange(false);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleGenerateContent}
                disabled={isLoading || !draftContent.trim()}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Rédaction en cours..." : "Générer avec l'IA"}
              </Button>
            </div>
          </div>
        ) : (
          // Étape 2 : Aperçu du résultat
          <div className="space-y-4">
            {generatedData && (
              <>
                {/* Services générés */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Services générés</label>
                  <div className="bg-secondary p-4 rounded-md border space-y-3 max-h-[250px] overflow-y-auto">
                    {generatedData.services.length > 0 ? (
                      generatedData.services.map((service, idx) => (
                        <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                          <p className="font-medium text-sm">{service.description}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>Qté: {service.quantity}</span>
                            <span>
                              Prix unitaire: {service.unitPrice.toLocaleString("fr-FR")}€
                            </span>
                            <span>
                              Montant: {(service.quantity * service.unitPrice).toLocaleString("fr-FR")}€
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun service généré</p>
                    )}
                  </div>
                </div>

                {/* Conditions de paiement générées */}
                {generatedData.paymentTerms && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conditions de paiement</label>
                    <div className="bg-secondary p-4 rounded-md border whitespace-pre-wrap text-sm leading-relaxed max-h-[150px] overflow-y-auto">
                      {generatedData.paymentTerms}
                    </div>
                  </div>
                )}
              </>
            )}

            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Les services et conditions ci-dessus seront remplis dans votre
                formulaire. Vous pouvez les modifier après.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("draft")}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Revenir en arrière
              </Button>
              <Button onClick={handleApply} className="gap-2">
                <Check className="h-4 w-4" />
                Appliquer les services
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
