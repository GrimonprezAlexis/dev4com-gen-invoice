"use client";

import { Company, PaymentAccount } from "@/app/types";
import QRCode from "qrcode";

/**
 * Generate Swiss QR-Bill payload according to SIX standards
 * Reference: https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.2-en.pdf
 */
function generateSwissQRPayload(
  company: Company,
  client: Company,
  paymentAccount: PaymentAccount,
  amount: number,
  invoiceNumber: string
): string {
  const iban = paymentAccount.iban.replace(/\s/g, "").toUpperCase();

  // Swiss QR-Bill payload format (SIX Standard)
  const lines = [
    "SPC", // QRType
    "0200", // Version
    "1", // Coding Type (UTF-8)
    iban, // IBAN
    "S", // Address Type (S = Structured)
    company.name.substring(0, 70), // Creditor Name
    company.address.substring(0, 70), // Creditor Address Line 1
    "", // Creditor Address Line 2 (empty for structured)
    company.postalCode || "", // Creditor Postal Code
    company.city || "", // Creditor City
    "CH", // Creditor Country
    "", // Ultimate Creditor - Name (empty)
    "", // Ultimate Creditor - Address Line 1
    "", // Ultimate Creditor - Address Line 2
    "", // Ultimate Creditor - Postal Code
    "", // Ultimate Creditor - City
    "", // Ultimate Creditor - Country
    amount.toFixed(2), // Amount
    "CHF", // Currency
    client.name ? "S" : "", // Debtor Address Type
    client.name ? client.name.substring(0, 70) : "", // Debtor Name
    client.address ? client.address.substring(0, 70) : "", // Debtor Address Line 1
    "", // Debtor Address Line 2
    client.postalCode || "", // Debtor Postal Code
    client.city || "", // Debtor City
    client.country === "CH" ? "CH" : "FR", // Debtor Country
    "NON", // Reference Type (NON = no reference)
    "", // Reference
    `Facture ${invoiceNumber}`.substring(0, 140), // Unstructured Message
    "EPD", // Trailer
    "", // Bill Information
  ];

  return lines.join("\n");
}

/**
 * Generate Swiss QR code as data URL
 * Uses toDataURL which works in both browser and Node.js environments
 */
export async function generateSwissQRCode(
  company: Company,
  client: Company,
  paymentAccount: PaymentAccount,
  amount: number,
  invoiceNumber: string
): Promise<string> {
  const payload = generateSwissQRPayload(company, client, paymentAccount, amount, invoiceNumber);

  // Generate QR code directly as data URL
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M", // Medium error correction
    margin: 0,
    width: 400,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return qrDataUrl;
}
