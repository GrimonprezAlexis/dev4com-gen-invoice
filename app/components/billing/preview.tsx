"use client";

import { useState, useEffect } from "react";
import { DocumentPreview } from "../shared/document-preview";
import { BillingInvoice } from "@/app/types";
import { generateFrenchPaymentQRCode } from "@/lib/swiss-utils";
import { generateSwissQRBillPng } from "@/lib/swissqrbill-utils";

interface BillingPreviewProps {
  invoice: BillingInvoice;
}

export function BillingPreview({ invoice }: BillingPreviewProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>(undefined);
  const isSwiss = invoice.billingCountry === "CH";

  useEffect(() => {
    const generateQR = async () => {
      if (invoice.paymentAccount) {
        try {
          let qrCode: string;
          if (isSwiss && invoice.paymentAccount.country === "CH") {
            // Swiss QR-Bill using swissqrbill library
            const amount = invoice.showTax
              ? invoice.totalWithTax
              : invoice.totalAmount;
            qrCode = await generateSwissQRBillPng(
              invoice.paymentAccount,
              invoice.company,
              invoice.client,
              amount,
              invoice.number,
              (invoice.currency as "CHF" | "EUR") || "CHF"
            );
          } else if (invoice.currency !== "CHF") {
            // French EPC QR Code (SEPA) - only for EUR
            const amount = invoice.showTax
              ? invoice.totalWithTax
              : invoice.totalAmount;
            qrCode = await generateFrenchPaymentQRCode(
              invoice.paymentAccount,
              amount,
              invoice.number,
              invoice.company.name
            );
          } else {
            // No QR for non-Swiss template with CHF (EPC only supports EUR)
            return;
          }
          setQrCodeDataUrl(qrCode);
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };
    generateQR();
  }, [invoice, isSwiss]);

  return (
    <DocumentPreview
      document={invoice}
      type="billing"
      qrCodeDataUrl={qrCodeDataUrl}
    />
  );
}
