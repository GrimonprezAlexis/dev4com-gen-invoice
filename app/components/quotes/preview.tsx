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
      // Only generate QR for Swiss quotes with payment account and deposit
      if (isSwiss && invoice.paymentAccount?.country === "CH" && hasDeposit) {
        try {
          // Generate QR for deposit amount
          const depositAmount = invoice.totalAmount * (invoice.deposit / 100);
          const qrCode = await generateSwissQRBillPng(
            invoice.paymentAccount,
            invoice.company,
            invoice.client,
            depositAmount,
            `${invoice.number}-ACOMPTE`,
            "CHF"
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
