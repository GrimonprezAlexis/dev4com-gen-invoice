"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { Invoice, BillingInvoice, BillingCountry } from "@/app/types";
import { SwissPDFDocument } from "./swiss-pdf-document";
import { FrenchPDFDocument } from "./french-pdf-document";

interface DocumentPreviewProps {
  document: Invoice | BillingInvoice;
  type: "quote" | "billing";
  qrCodeDataUrl?: string;
}

// Re-export the PDF documents for use in other components
export { SwissPDFDocument } from "./swiss-pdf-document";
export { FrenchPDFDocument } from "./french-pdf-document";

/**
 * Universal PDF Document component that routes to the correct template
 * based on the billing country
 */
export const PDFDocument = ({ document, type, qrCodeDataUrl }: DocumentPreviewProps) => {
  const billingCountry: BillingCountry = document.billingCountry || "FR";

  if (billingCountry === "CH") {
    return (
      <SwissPDFDocument
        document={document}
        type={type}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    );
  }

  return (
    <FrenchPDFDocument
      document={document}
      type={type}
      qrCodeDataUrl={qrCodeDataUrl}
    />
  );
};

/**
 * Preview component that wraps the PDF document in a viewer
 */
export function DocumentPreview(props: DocumentPreviewProps) {
  return (
    <PDFViewer className="w-full h-[80vh]">
      <PDFDocument {...props} />
    </PDFViewer>
  );
}
