"use client";

import { useState, useEffect } from "react";
import { InvoiceForm as BaseInvoiceForm } from "../shared/invoice-form";
import { Invoice, Company } from "@/app/types";
import { getCompany } from "@/lib/firebase";

interface QuoteFormProps {
  onSave: (invoice: Invoice) => void;
  initialData?: Invoice | null;
}

export function QuoteForm({ onSave, initialData }: QuoteFormProps) {
  const [companyInfo, setCompanyInfo] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await getCompany();
        if (companyData) {
          setCompanyInfo(companyData);
        }
      } catch (error) {
        console.error("Error loading company data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCompany();
  }, []);

  const handleSave = (invoice: Invoice) => {
    if (companyInfo) {
      const updatedInvoice = {
        ...invoice,
        company: companyInfo
      };
      onSave(updatedInvoice);
    } else {
      onSave(invoice);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <BaseInvoiceForm 
      onSave={handleSave}
      initialData={initialData}
      type="quote"
      companyInfo={companyInfo}
    />
  );
}