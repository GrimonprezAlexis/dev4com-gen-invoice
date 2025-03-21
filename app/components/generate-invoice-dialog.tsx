"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function GenerateInvoiceDialog({ quote, onGenerate }: GenerateInvoiceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [invoice, setInvoice] = useState<BillingInvoice | null>(null);

  const handleSave = (invoice: BillingInvoice) => {
    setInvoice(invoice);
    onGenerate(invoice);
    toast.success("Facture générée avec succès !");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Receipt className="w-4 h-4 mr-2" />
          Générer la facture
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogTitle>Générer une facture</DialogTitle>
        
        <Tabs defaultValue={invoice ? "preview" : "form"} className="mt-4">
          <TabsList>
            <TabsTrigger value="form">Formulaire</TabsTrigger>
            <TabsTrigger value="preview" disabled={!invoice}>Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <BillingForm quote={quote} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="preview">
            {invoice && <BillingPreview invoice={invoice} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}