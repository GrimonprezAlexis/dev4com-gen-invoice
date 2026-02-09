"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import { BillingForm } from "./form";
import { BillingInvoice } from "@/app/types";

interface BillingInvoiceEditDialogProps {
  invoice: BillingInvoice;
  onUpdate: (invoice: BillingInvoice) => void;
}

export function BillingInvoiceEditDialog({ invoice, onUpdate }: BillingInvoiceEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = (updatedInvoice: BillingInvoice) => {
    onUpdate(updatedInvoice);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Pencil className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Modifier la facture</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Facture #{invoice.number}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6">
          <BillingForm
            quote={(() => {
              // Filter out additional services to get only the original quote services
              const additionalIds = new Set(
                (invoice.additionalServices || []).map((s) => s.id)
              );
              const quoteServices = invoice.services.filter(
                (s) => !additionalIds.has(s.id)
              );
              const quoteSubtotal = quoteServices.reduce((sum, s) => sum + s.amount, 0);
              // Reconstruct original quote total and deposit info
              const originalTotal = invoice.originalTotal || quoteSubtotal;
              const depositPercent = invoice.depositPercent || 0;
              const depositAmt = originalTotal * (depositPercent / 100);
              return {
                id: invoice.id,
                number: invoice.quoteNumber,
                date: invoice.date,
                validUntil: invoice.dueDate,
                company: invoice.company,
                client: invoice.client,
                services: quoteServices,
                subtotal: quoteSubtotal,
                discount: invoice.discount || { type: 'fixed' as const, value: 0 },
                totalAmount: originalTotal,
                deposit: depositPercent,
                remainingBalance: originalTotal - depositAmt,
                paymentTerms: "",
                deliveryTime: "",
                status: 'accepted' as const,
                createdAt: invoice.createdAt,
                currency: invoice.currency,
                billingCountry: invoice.billingCountry,
                paymentAccount: invoice.paymentAccount,
              };
            })()}
            invoice={invoice}
            onSave={handleUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}