import { Company, PaymentAccount } from "@/app/types";
import { Languages } from "lucide-react";

/**
 * Swiss QR-Bill data structure according to swissqrbill library
 */
export interface SwissQRBillData {
  creditor: {
    account: string;
    name: string;
    address: string;
    zip: number | string;
    city: string;
    country: "CH" | "LI";
  };
  debtor?: {
    name: string;
    address: string;
    zip: number | string;
    city: string;
    country: string;
  };
  amount?: number;
  currency: "CHF" | "EUR";
  reference?: string;
  message?: string;
}

/**
 * Build Swiss QR-Bill data from our internal types
 */
export function buildSwissQRBillData(
  paymentAccount: PaymentAccount,
  company: Company,
  client: Company,
  amount: number,
  invoiceNumber: string,
  currency: "CHF" | "EUR" = "CHF"
): SwissQRBillData {
  // Creditor data from payment account (for Swiss accounts, address comes from payment account)
  const creditor = {
    account: paymentAccount.iban.replace(/\s/g, ""),
    name: paymentAccount.accountHolder.substring(0, 70),
    address: paymentAccount.address || company.address || "",
    zip: parseInt(paymentAccount.zip || company.postalCode || "0") || paymentAccount.zip || company.postalCode || "",
    city: paymentAccount.city || company.city || "",
    country: "CH" as const,
  };

  // Debtor data from client
  const debtor = client.name ? {
    name: client.name.substring(0, 70),
    address: client.address?.substring(0, 70) || "",
    zip: parseInt(client.postalCode || "0") || client.postalCode || "",
    city: client.city || "",
    country: client.country === "CH" ? "CH" : "FR",
  } : undefined;

  return {
    creditor,
    debtor,
    amount: Math.round(amount * 100) / 100, // Round to 2 decimals
    currency,
    message: `Facture ${invoiceNumber}`.substring(0, 140),
  };
}

/**
 * Generate Swiss QR-Bill SVG string using swissqrbill library
 * This function should be called client-side
 */
export async function generateSwissQRBillSVG(data: SwissQRBillData): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const { SwissQRBill } = await import("swissqrbill/svg");
    const qrBill = new SwissQRBill(data, 
      { language: "FR" }
    );
    return qrBill.toString();
  } catch (error) {
    console.error("Error generating Swiss QR-Bill SVG:", error);
    throw error;
  }
}

/**
 * Convert SVG string to data URL for embedding in images
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Convert SVG to PNG data URL using canvas (client-side only)
 */
export async function svgToPngDataUrl(svgString: string, width: number = 600, height: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("svgToPngDataUrl can only be used client-side"));
      return;
    }

    const img = new Image();
    const svgDataUrl = svgToDataUrl(svgString);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw SVG
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      reject(new Error("Failed to load SVG image"));
    };

    img.src = svgDataUrl;
  });
}

/**
 * Generate complete Swiss QR-Bill as PNG data URL
 */
export async function generateSwissQRBillPng(
  paymentAccount: PaymentAccount,
  company: Company,
  client: Company,
  amount: number,
  invoiceNumber: string,
  currency: "CHF" | "EUR" = "CHF"
): Promise<string> {
  const data = buildSwissQRBillData(paymentAccount, company, client, amount, invoiceNumber, currency);
  const svgString = await generateSwissQRBillSVG(data);
  return svgToPngDataUrl(svgString, 595, 280); // A4 width in pixels at 72dpi, QR-Bill height ~105mm
}
