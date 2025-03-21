"use client";

import { InvoiceList as BaseInvoiceList } from "../shared/invoice-list";
import { Invoice, BillingInvoice } from "@/app/types";

interface QuoteListProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  viewMode: "grid" | "split";
  onSelect: (invoice: Invoice) => void;
  onPreview: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onStatusUpdate: (
    id: string,
    status: "draft" | "sent" | "accepted" | "rejected"
  ) => void;
  onGenerateInvoice?: (invoice: BillingInvoice) => void;
  onDelete?: (ids: string[]) => void;
  type: "quote" | "billing";
}

export function QuoteList(props: QuoteListProps) {
  return <BaseInvoiceList {...props} />;
}
