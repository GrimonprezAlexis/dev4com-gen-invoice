export interface Company {
  name: string;
  address: string;
  siren: string;
  logo?: string;
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
  status: "draft" | "sent" | "accepted" | "rejected";
  createdAt: Date;
  currency?: string;
  showTax?: boolean;
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
  notes?: string;
  createdAt: Date;
  quoteNumber: string;
  showTax?: boolean;
}
