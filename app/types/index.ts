export type BillingCountry = 'FR' | 'CH';

export interface Company {
  name: string;
  address: string;
  siren: string;
  logo?: string;
  logoSize?: "small" | "medium" | "large";
  // Swiss billing fields
  country?: BillingCountry;
  city?: string;
  postalCode?: string;
}

export interface PaymentAccount {
  id: string;
  name: string;
  iban: string;
  bic: string;
  accountHolder: string;
  // Country of the account
  country?: BillingCountry;
  // Swiss-specific fields for QR-Bill (required for CH accounts)
  address?: string;
  city?: string;
  zip?: string;
}

export interface Service {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  company: Company;
  client: Company;
  services: Service[];
  subtotal: number;
  discount: {
    type: "percentage" | "fixed";
    value: number;
  };
  totalAmount: number;
  deposit: number;
  remainingBalance: number;
  paymentTerms: string;
  deliveryTime: string;
  paymentAccount?: PaymentAccount;
  signature?: {
    name: string;
    signedAt?: Date;
  };
  status: "draft" | "pending" | "sent" | "accepted" | "rejected" | "paid";
  createdAt: Date;
  currency?: string;
  showTax?: boolean;
  showSiren?: boolean;
  billingCountry?: BillingCountry;
  isTemplate?: boolean;
  templateName?: string;
  templateDescription?: string;
  templateCategory?: string;
  fake?: boolean;
}

export interface BillingInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  company: Company;
  client: Company;
  services: Service[];
  subtotal: number;
  discount: {
    type: "percentage" | "fixed";
    value: number;
  };
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  totalWithTax: number;
  currency?: string;
  paymentStatus: "pending" | "partial" | "paid";
  paymentDate?: string;
  paymentMethod?: string;
  paymentAccount?: PaymentAccount;
  notes?: string;
  createdAt: Date;
  quoteNumber: string;
  showTax?: boolean;
  showSiren?: boolean;
  billingCountry?: BillingCountry;
  // Deposit deduction tracking
  depositDeducted?: boolean;
  depositPercent?: number;
  depositAmount?: number;
  originalTotal?: number;
  additionalServicesTotal?: number;
  additionalServices?: { id: string; description: string; amount: number; gifted?: boolean }[];
}
