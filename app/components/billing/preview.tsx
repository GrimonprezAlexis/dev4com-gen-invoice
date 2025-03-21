"use client";

import { DocumentPreview } from "../shared/document-preview";
import { BillingInvoice } from "@/app/types";

interface BillingPreviewProps {
  invoice: BillingInvoice;
}

export function BillingPreview({ invoice }: BillingPreviewProps) {
  return (
    <DocumentPreview 
      document={invoice}
      type="billing"
    />
  );
}