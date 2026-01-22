"use client";

import { useState } from "react";
import { Receipt, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BillingForm } from "./billing/form";
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

  const handleSave = (invoice: BillingInvoice) => {
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
      <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950">
              <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-base">Générer une facture</DialogTitle>
              <p className="text-xs text-muted-foreground">Devis {quote.number}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <BillingForm quote={quote} onSave={handleSave} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
