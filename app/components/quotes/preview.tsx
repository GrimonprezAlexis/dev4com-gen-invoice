"use client";

import { useState, useEffect } from "react";
import { DocumentPreview } from "../shared/document-preview";
import { Invoice } from "@/app/types";
import { generateSwissQRBillPng } from "@/lib/swissqrbill-utils";

interface QuotePreviewProps {
  invoice: Invoice;
}

export function QuotePreview({ invoice }: QuotePreviewProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>(undefined);
  const isSwiss = invoice.billingCountry === "CH";
  const hasDeposit = invoice.deposit > 0;

  useEffect(() => {
    const generateQR = async () => {
      if (isSwiss && invoice.paymentAccount?.country === "CH") {
        try {
          // Use deposit amount if deposit > 0, otherwise total amount
          const amount = hasDeposit
            ? invoice.totalAmount * (invoice.deposit / 100)
            : invoice.totalAmount;
          const reference = hasDeposit
            ? `${invoice.number}-ACOMPTE`
            : invoice.number;
          const qrCode = await generateSwissQRBillPng(
            invoice.paymentAccount,
            invoice.company,
            invoice.client,
            amount,
            reference,
            (invoice.currency as "CHF" | "EUR") || "CHF"
          );
          setQrCodeDataUrl(qrCode);
        } catch (error) {
          console.error("Error generating QR code for quote:", error);
        }
      }
    };
    generateQR();
  }, [invoice, isSwiss, hasDeposit]);

  return (
    <DocumentPreview
      document={invoice}
      type="quote"
      qrCodeDataUrl={qrCodeDataUrl}
    />
  );
}
