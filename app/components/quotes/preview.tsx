"use client";

import { DocumentPreview } from "../shared/document-preview";
import { Invoice } from "@/app/types";

interface QuotePreviewProps {
  invoice: Invoice;
}

export function QuotePreview({ invoice }: QuotePreviewProps) {
  return (
    <DocumentPreview 
      document={invoice}
      type="quote"
    />
  );
}