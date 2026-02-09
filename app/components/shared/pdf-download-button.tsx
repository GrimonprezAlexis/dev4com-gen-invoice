"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { PDFDocument } from "./document-preview";
import { Invoice, BillingInvoice } from "@/app/types";
import { generateFrenchPaymentQRCode } from "@/lib/swiss-utils";
import { generateSwissQRBillPng } from "@/lib/swissqrbill-utils";

interface PDFDownloadButtonProps {
  document: Invoice | BillingInvoice;
  type: "quote" | "billing";
  fileName: string;
  className?: string;
}

export function PDFDownloadButton({
  document,
  type,
  fileName,
  className = ""
}: PDFDownloadButtonProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const isSwiss = document.billingCountry === "CH";
  const isBilling = type === "billing";
  const isQuote = type === "quote";

  useEffect(() => {
    const generateQR = async () => {
      if (document.paymentAccount) {
        setIsGenerating(true);
        try {
          let qrCode: string;
          if (isSwiss && document.paymentAccount.country === "CH") {
            // Swiss QR-Bill using swissqrbill library
            let amount: number;
            if (isBilling) {
              amount = (document as BillingInvoice).showTax
                ? (document as BillingInvoice).totalWithTax
                : document.totalAmount;
            } else {
              // For quotes, generate QR for deposit amount
              const quote = document as Invoice;
              amount = quote.totalAmount * (quote.deposit / 100);
            }
            qrCode = await generateSwissQRBillPng(
              document.paymentAccount,
              document.company,
              document.client,
              amount,
              document.number,
              (document.currency as "CHF" | "EUR") || "CHF"
            );
          } else if (isBilling && document.currency !== "CHF") {
            // French EPC QR Code (SEPA) - only for EUR billing invoices
            const amount = (document as BillingInvoice).showTax
              ? (document as BillingInvoice).totalWithTax
              : document.totalAmount;
            qrCode = await generateFrenchPaymentQRCode(
              document.paymentAccount,
              amount,
              document.number,
              document.company.name
            );
          } else {
            // Skip QR for French quotes (no deposit QR)
            setIsGenerating(false);
            return;
          }
          setQrCodeDataUrl(qrCode);
        } catch (error) {
          console.error("Error generating QR code:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    generateQR();
  }, [document, isSwiss, isBilling, isQuote]);

  if (isGenerating) {
    return (
      <span className={`flex items-center ${className}`}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Preparation...
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <PDFDocument
          document={document}
          type={type}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      }
      fileName={fileName}
      className={`flex items-center ${className}`}
      children={(({ loading }: { loading: boolean }) => (
        <>
          <Download className="w-4 h-4 mr-2" />
          {loading ? "Preparation..." : "Telecharger"}
        </>
      )) as any}
    />
  );
}
