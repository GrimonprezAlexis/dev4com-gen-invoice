"use client";

import { BillingInvoiceForm as BaseBillingInvoiceForm } from "../shared/billing-invoice-form";
import { BillingInvoice, Invoice } from "@/app/types";

interface BillingFormProps {
  quote: Invoice;
  invoice?: BillingInvoice;
  onSave: (invoice: BillingInvoice) => void;
}

export function BillingForm({ quote, invoice, onSave }: BillingFormProps) {
  return (
    <div className="h-full overflow-auto">
      <BaseBillingInvoiceForm quote={quote} invoice={invoice} onSave={onSave} />
    </div>
  );
}
