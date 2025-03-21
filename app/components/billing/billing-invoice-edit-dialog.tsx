"use client";

import { DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { BillingForm } from "./form";
import { BillingInvoice } from "@/app/types";

interface BillingInvoiceEditDialogProps {
  invoice: BillingInvoice;
  onUpdate: (invoice: BillingInvoice) => void;
}

export function BillingInvoiceEditDialog({ invoice, onUpdate }: BillingInvoiceEditDialogProps) {
  return (
    <>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Pencil className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogTitle>Modifier la facture</DialogTitle>
        <BillingForm
          quote={{
            id: invoice.id,
            number: invoice.quoteNumber,
            date: invoice.date,
            validUntil: invoice.dueDate,
            company: invoice.company,
            client: invoice.client,
            services: invoice.services,
            subtotal: invoice.totalAmount,
            discount: { type: 'fixed', value: 0 },
            totalAmount: invoice.totalAmount,
            deposit: 0,
            remainingBalance: 0,
            paymentTerms: "",
            deliveryTime: "",
            status: 'accepted',
            createdAt: invoice.createdAt
          }}
          invoice={invoice}
          onSave={onUpdate}
        />
      </DialogContent>
    </>
  );
}