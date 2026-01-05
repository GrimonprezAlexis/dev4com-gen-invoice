"use client";

import { useState } from "react";
import { Receipt, Eye, FileText, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingForm } from "./billing/form";
import { BillingPreview } from "./billing/preview";
import { BillingInvoice, Invoice } from "../types";
import { toast } from "sonner";

interface GenerateInvoiceDialogProps {
  quote: Invoice;
  onGenerate: (invoice: BillingInvoice) => void;
}

export function GenerateInvoiceDialog({
  quote,
  onGenerate,
}: GenerateInvoiceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [invoice, setInvoice] = useState<BillingInvoice | null>(null);
  const [activeTab, setActiveTab] = useState("form");

  const handleSave = (invoice: BillingInvoice) => {
    setInvoice(invoice);
    onGenerate(invoice);
    toast.success("Facture générée avec succès !");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Receipt className="w-4 h-4 mr-2" />
          Générer la facture
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950">
              <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle>Générer une facture</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Créez une facture à partir de ce devis accepté</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="px-6 pt-4 pb-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Formulaire</span>
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!invoice} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="form" className="h-full p-6 m-0">
              <BillingForm quote={quote} onSave={handleSave} />
            </TabsContent>

            <TabsContent value="preview" className="h-full p-6 m-0">
              {invoice && <BillingPreview invoice={invoice} />}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-muted-foreground mr-auto">
            {invoice ? <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle className="w-4 h-4" /> Facture prête à être générée</span> : "Remplissez le formulaire pour continuer"}
          </p>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
