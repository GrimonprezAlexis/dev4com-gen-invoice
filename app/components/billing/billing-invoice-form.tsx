"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BillingInvoice, Invoice, Company } from "@/app/types";
import { getCompany } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

interface BillingInvoiceFormProps {
  quote: Invoice;
  invoice?: BillingInvoice;
  onSave: (invoice: BillingInvoice) => void;
}

export function BillingInvoiceForm({ quote, invoice, onSave }: BillingInvoiceFormProps) {
  const { user } = useAuth();
  const [taxRate, setTaxRate] = useState(20);
  const [companyInfo, setCompanyInfo] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit } = useForm<BillingInvoice>({
    defaultValues: invoice || {
      id: crypto.randomUUID(),
      company: quote.company,
      client: quote.client,
      services: quote.services,
      subtotal: quote.totalAmount,
      taxRate: 20,
      number: `FAC-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentStatus: 'pending',
      quoteNumber: quote.number,
      totalAmount: quote.totalAmount,
      totalWithTax: quote.totalAmount * 1.2,
      taxAmount: quote.totalAmount * 0.2,
      createdAt: new Date(),
    },
  });

  useEffect(() => {
    if (!user) return;
    const loadCompany = async () => {
      try {
        const companyData = await getCompany(user.uid);
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
  }, [user]);

  const onSubmit = (data: BillingInvoice) => {
    const taxAmount = (data.totalAmount * taxRate) / 100;
    const totalWithTax = data.totalAmount + taxAmount;

    const newInvoice: BillingInvoice = {
      ...data,
      company: companyInfo || data.company,
      taxAmount,
      totalWithTax,
    };

    onSave(newInvoice);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Numéro de facture</Label>
          <Input {...register("number")} />
        </div>
        <div>
          <Label>Taux de TVA (%)</Label>
          <Input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Date d'émission</Label>
          <Input type="date" {...register("date")} />
        </div>
        <div>
          <Label>Date d'échéance</Label>
          <Input type="date" {...register("dueDate")} />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea {...register("notes")} placeholder="Notes ou conditions particulières..." />
      </div>

      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>Sous-total:</span>
          <span>{quote.totalAmount.toLocaleString('fr-FR')} €</span>
        </div>
        <div className="flex justify-between">
          <span>TVA ({taxRate}%):</span>
          <span>{(quote.totalAmount * taxRate / 100).toLocaleString('fr-FR')} €</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total TTC:</span>
          <span>{(quote.totalAmount * (1 + taxRate / 100)).toLocaleString('fr-FR')} €</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Générer la facture</Button>
      </div>
    </form>
  );
}