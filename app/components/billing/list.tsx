"use client";

import { BillingInvoiceList as BaseBillingInvoiceList } from "../shared/billing-invoice-list";
import { BillingInvoice } from "@/app/types";

interface BillingListProps {
  invoices: BillingInvoice[];
  selectedInvoice: BillingInvoice | null;
  viewMode: "grid" | "split";
  onSelect: (invoice: BillingInvoice) => void;
  onPreview: (invoice: BillingInvoice) => void;
  onUpdate: (invoice: BillingInvoice) => void;
  onDelete: (id: string) => void;
  onSend?: (invoice: BillingInvoice) => void;
}

export function BillingList(props: BillingListProps) {
  return <BaseBillingInvoiceList {...props} />;
}
