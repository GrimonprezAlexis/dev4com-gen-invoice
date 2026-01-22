import { BillingCountry, Company, Invoice, BillingInvoice, PaymentAccount } from '@/app/types';
import QRCode from 'qrcode';

/**
 * Format a number in Swiss style (apostrophe as thousand separator, dot for decimals)
 * Example: 1234.56 -> "1'234.56"
 */
export function formatSwissNumber(value: number): string {
  const parts = value.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${integerPart}.${parts[1]}`;
}

/**
 * Format a number in French style (space as thousand separator, comma for decimals)
 * Example: 1234.56 -> "1 234,56"
 */
export function formatFrenchNumber(value: number): string {
  const parts = value.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart},${parts[1]}`;
}

/**
 * Format a number based on billing country
 */
export function formatNumber(value: number, country: BillingCountry = 'FR'): string {
  return country === 'CH' ? formatSwissNumber(value) : formatFrenchNumber(value);
}

/**
 * Check if an IBAN is a Swiss IBAN (starts with CH or LI)
 */
export function isSwissIban(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  return cleanIban.startsWith('CH') || cleanIban.startsWith('LI');
}

/**
 * Validate Swiss IBAN format
 * Swiss IBANs have 21 characters: CHxx xxxx xxxx xxxx xxxx x
 */
export function validateSwissIban(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  if (!isSwissIban(cleanIban)) return false;
  return cleanIban.length === 21;
}

/**
 * Format IBAN with spaces for display
 */
export function formatIban(iban: string): string {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
}

export interface SwissInvoiceValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate that all required fields are present for Swiss QR-Bill generation
 */
export function validateSwissInvoice(
  company: Company,
  paymentAccount?: PaymentAccount,
  totalAmount?: number
): SwissInvoiceValidation {
  const errors: string[] = [];

  // Check company address fields
  if (!company.name || company.name.trim() === '') {
    errors.push('Nom de l\'entreprise requis');
  }
  if (!company.address || company.address.trim() === '') {
    errors.push('Adresse de l\'entreprise requise');
  }
  if (!company.postalCode || company.postalCode.trim() === '') {
    errors.push('Code postal requis pour la facturation suisse');
  }
  if (!company.city || company.city.trim() === '') {
    errors.push('Ville requise pour la facturation suisse');
  }

  // Check IBAN
  if (!paymentAccount?.iban) {
    errors.push('IBAN requis pour la facturation suisse');
  } else if (!isSwissIban(paymentAccount.iban)) {
    errors.push('IBAN suisse (CH/LI) requis pour la QR-Facture');
  } else if (!validateSwissIban(paymentAccount.iban)) {
    errors.push('Format IBAN suisse invalide (21 caractères attendus)');
  }

  // Check amount
  if (totalAmount !== undefined) {
    if (totalAmount < 0.01) {
      errors.push('Le montant doit être supérieur à 0.01 CHF');
    }
    if (totalAmount > 999999999.99) {
      errors.push('Le montant dépasse la limite maximale (999\'999\'999.99 CHF)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get VAT message based on billing country
 */
export function getVatMessage(country: BillingCountry = 'FR'): string {
  if (country === 'CH') {
    return 'Entreprise non assujettie à la TVA (art. 10 al. 2 let. a LTVA)';
  }
  return 'TVA non applicable, art. 293 B du CGI';
}

/**
 * Get default tax rate based on billing country
 */
export function getDefaultTaxRate(country: BillingCountry = 'FR'): number {
  return country === 'CH' ? 0 : 20;
}

/**
 * Get currency based on billing country
 */
export function getDefaultCurrency(country: BillingCountry = 'FR'): string {
  return country === 'CH' ? 'CHF' : 'EUR';
}

/**
 * Get the billing country from an invoice or billing invoice
 */
export function getBillingCountry(doc: Invoice | BillingInvoice): BillingCountry {
  return doc.billingCountry || 'FR';
}

/**
 * Swiss QR-Bill data structure according to SIX standards
 */
export interface SwissQRBillData {
  currency: 'CHF' | 'EUR';
  amount: number;
  creditor: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: 'CH' | 'LI';
  };
  iban: string;
  reference?: string;
  message?: string;
  debtor?: {
    name: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
}

/**
 * Build Swiss QR-Bill data from invoice data
 */
export function buildSwissQRBillData(
  company: Company,
  client: Company,
  paymentAccount: PaymentAccount,
  amount: number,
  invoiceNumber: string
): SwissQRBillData {
  return {
    currency: 'CHF',
    amount: Math.round(amount * 100) / 100, // Round to 2 decimals
    creditor: {
      name: company.name.substring(0, 70), // Max 70 chars
      address: company.address.substring(0, 70),
      postalCode: company.postalCode || '',
      city: company.city || '',
      country: 'CH'
    },
    iban: paymentAccount.iban.replace(/\s/g, '').toUpperCase(),
    message: `Facture ${invoiceNumber}`.substring(0, 140), // Max 140 chars for unstructured message
    debtor: client.name ? {
      name: client.name.substring(0, 70),
      address: client.address?.substring(0, 70),
      postalCode: client.postalCode,
      city: client.city,
      country: client.country === 'CH' ? 'CH' : 'FR'
    } : undefined
  };
}

/**
 * Generate a French payment QR code (EPC QR Code / SEPA Credit Transfer)
 * This follows the EPC069-12 standard for SEPA payments
 */
export async function generateFrenchPaymentQRCode(
  paymentAccount: PaymentAccount,
  amount: number,
  invoiceNumber: string,
  companyName: string
): Promise<string> {
  // EPC QR Code format (SEPA Credit Transfer)
  // https://www.europeanpaymentscouncil.eu/sites/default/files/kb/file/2022-09/EPC069-12%20v3.0%20Quick%20Response%20Code%20-%20Guidelines%20to%20Enable%20the%20Data%20Capture%20for%20the%20Initiation%20of%20an%20SCT_0.pdf
  const lines = [
    'BCD',                                    // Service Tag
    '002',                                    // Version
    '1',                                      // Character set (UTF-8)
    'SCT',                                    // Identification code (SEPA Credit Transfer)
    paymentAccount.bic || '',                 // BIC
    paymentAccount.accountHolder.substring(0, 70), // Beneficiary name (max 70)
    paymentAccount.iban.replace(/\s/g, ''),   // IBAN
    `EUR${amount.toFixed(2)}`,                // Amount with currency
    '',                                       // Purpose code (optional)
    invoiceNumber.substring(0, 35),           // Remittance reference (max 35)
    `Paiement facture ${invoiceNumber}`.substring(0, 140), // Remittance text (max 140)
    '',                                       // Beneficiary to originator info (optional)
  ];

  const payload = lines.join('\n');

  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 200,
    color: {
      dark: '#1e40af',
      light: '#ffffff',
    },
  });

  return qrDataUrl;
}
