"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BillingInvoice, Invoice } from "@/app/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { on } from "events";

interface BillingInvoiceFormProps {
  quote: Invoice;
  invoice?: BillingInvoice;
  onSave: (invoice: BillingInvoice) => void;
}

export function BillingInvoiceForm({
  quote,
  invoice,
  onSave,
}: BillingInvoiceFormProps) {
  const [taxRate, setTaxRate] = useState(20);
  const [currency, setCurrency] = useState<string>(
    invoice?.currency || quote.currency || "EUR"
  );
  const { register, handleSubmit, setValue } = useForm<BillingInvoice>({
    defaultValues: invoice || {
      id: crypto.randomUUID(),
      company: quote.company,
      client: quote.client,
      services: quote.services,
      subtotal: quote.totalAmount,
      taxRate: 20,
      number: `FAC-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      paymentStatus: "pending",
      quoteNumber: quote.number,
      totalAmount: quote.totalAmount,
      totalWithTax: quote.totalAmount * 1.2,
      taxAmount: quote.totalAmount * 0.2,
      createdAt: new Date(),
      currency: quote.currency || "EUR",
    },
  });

  const onSubmit = (data: BillingInvoice) => {
    const taxAmount = (data.totalAmount * taxRate) / 100;
    const totalWithTax = data.totalAmount + taxAmount;
    const newInvoice: BillingInvoice = {
      ...data,
      taxAmount,
      totalWithTax,
      currency,
    };
    onSave(newInvoice);
  };

  const onChangeCurrency = (value: string) => {
    setCurrency(value);
    setValue("currency", value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-4">
        <Label htmlFor="currency">Devise</Label>
        <Select value={currency} onValueChange={(e) => onChangeCurrency(e)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner la devise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EUR">Euro (€)</SelectItem>
            <SelectItem value="CHF">Franc Suisse (CHF)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-6 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="number">Numéro de facture</Label>
              <Input id="number" {...register("number")} />
            </div>
            <div>
              <Label htmlFor="taxRate">Taux de TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="date">Date d&apos;émission</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div>
              <Label htmlFor="dueDate">Date d&apos;échéance</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Notes ou conditions particulières..."
              className="min-h-[100px]"
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Sous-total:</span>
              <span>
                {quote.totalAmount.toLocaleString("fr-FR")}{" "}
                {currency === "EUR" ? "€" : "CHF"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TVA ({taxRate}%):</span>
              <span>
                {((quote.totalAmount * taxRate) / 100).toLocaleString("fr-FR")}{" "}
                {currency === "EUR" ? "€" : "CHF"}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total TTC:</span>
              <span>
                {(quote.totalAmount * (1 + taxRate / 100)).toLocaleString(
                  "fr-FR"
                )}{" "}
                {currency === "EUR" ? "€" : "CHF"}
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-background">
        <Button type="submit">Générer la facture</Button>
      </div>
    </form>
  );
}
