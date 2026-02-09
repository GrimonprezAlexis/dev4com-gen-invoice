"use client";

import { useState, useEffect } from "react";
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
import { BillingInvoice, Invoice, BillingCountry, PaymentAccount } from "@/app/types";
import { getDefaultTaxRate } from "@/lib/swiss-utils";
import { CreditCard, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { getPaymentAccounts } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

interface BillingInvoiceFormProps {
  quote: Invoice;
  invoice?: BillingInvoice;
  onSave: (invoice: BillingInvoice) => void;
}

// Helper to convert any date value to YYYY-MM-DD string for form inputs
const toDateInputValue = (date: any): string => {
  if (!date) return new Date().toISOString().split("T")[0];
  // Firestore Timestamp
  if (date?.toDate) return date.toDate().toISOString().split("T")[0];
  if (date?.seconds) return new Date(date.seconds * 1000).toISOString().split("T")[0];
  // ISO string or date string
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
};

export function BillingInvoiceForm({
  quote,
  invoice,
  onSave,
}: BillingInvoiceFormProps) {
  const { user } = useAuth();
  const isEditing = !!invoice;
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 20);
  const [showTax, setShowTax] = useState<boolean>(invoice?.showTax ?? (invoice?.taxRate ? invoice.taxRate > 0 : false));
  const [currency, setCurrency] = useState<string>(
    invoice?.currency || quote.currency || "EUR"
  );
  const [billingCountry, setBillingCountry] = useState<BillingCountry>(
    invoice?.billingCountry || quote.billingCountry || "FR"
  );
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<PaymentAccount | undefined>(
    invoice?.paymentAccount || quote.paymentAccount
  );
  const [showNotes, setShowNotes] = useState(!!invoice?.notes);
  const [additionalServices, setAdditionalServices] = useState<
    { id: string; description: string; amount: number }[]
  >(invoice?.additionalServices || []);
  const [showAdditionalServices, setShowAdditionalServices] = useState(
    (invoice?.additionalServices?.length || 0) > 0
  );

  const additionalTotal = additionalServices.reduce((sum, s) => sum + s.amount, 0);

  // Deposit deduction
  const hasDeposit = quote.deposit > 0;
  const depositAmount = hasDeposit ? quote.totalAmount * (quote.deposit / 100) : 0;
  const [deductDeposit, setDeductDeposit] = useState<boolean>(
    invoice?.depositDeducted ?? hasDeposit
  );
  const baseAmount = deductDeposit ? quote.remainingBalance : quote.totalAmount;

  // Load payment accounts
  useEffect(() => {
    if (!user) return;
    const loadPaymentAccounts = async () => {
      try {
        const accounts = await getPaymentAccounts(user.uid);
        setPaymentAccounts(accounts);
        if (!selectedPaymentAccount && quote.paymentAccount) {
          setSelectedPaymentAccount(quote.paymentAccount);
        } else if (!selectedPaymentAccount && accounts.length === 1) {
          setSelectedPaymentAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Error loading payment accounts:", error);
      }
    };
    loadPaymentAccounts();
  }, [user, quote.paymentAccount]);

  const { register, handleSubmit, setValue } = useForm<BillingInvoice>({
    defaultValues: invoice
      ? {
          ...invoice,
          date: toDateInputValue(invoice.date),
          dueDate: toDateInputValue(invoice.dueDate),
        }
      : {
          id: crypto.randomUUID(),
          company: quote.company,
          client: quote.client,
          services: quote.services,
          subtotal: quote.subtotal,
          discount: quote.discount,
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
    const finalTaxRate = showTax ? taxRate : 0;
    const finalBaseAmount = (deductDeposit ? quote.remainingBalance : quote.totalAmount) + additionalTotal;

    const allServices = [
      ...quote.services,
      ...additionalServices.map((s) => ({
        id: s.id,
        quantity: 1,
        description: s.description,
        unitPrice: s.amount,
        amount: s.amount,
      })),
    ];
    const newSubtotal = allServices.reduce((sum, s) => sum + s.amount, 0);

    const taxAmountCalc = (finalBaseAmount * finalTaxRate) / 100;
    const totalWithTaxCalc = finalBaseAmount + taxAmountCalc;
    const newInvoice: BillingInvoice = {
      ...data,
      services: allServices,
      subtotal: newSubtotal,
      totalAmount: finalBaseAmount,
      taxAmount: taxAmountCalc,
      totalWithTax: totalWithTaxCalc,
      currency,
      taxRate: finalTaxRate,
      showTax,
      billingCountry,
      paymentAccount: selectedPaymentAccount,
      depositDeducted: deductDeposit && hasDeposit,
      depositPercent: hasDeposit ? quote.deposit : undefined,
      depositAmount: hasDeposit ? depositAmount : 0,
      originalTotal: hasDeposit ? quote.totalAmount : 0,
      additionalServicesTotal: additionalTotal > 0 ? additionalTotal : 0,
      additionalServices: additionalServices.length > 0 ? additionalServices : [],
    };
    onSave(newInvoice);
  };

  const onChangeCurrency = (value: string) => {
    setCurrency(value);
    setValue("currency", value);
  };

  const onChangeBillingCountry = (country: BillingCountry) => {
    setBillingCountry(country);
    const newTaxRate = getDefaultTaxRate(country);
    setTaxRate(newTaxRate);
    if (country === "CH") {
      setShowTax(false);
    }
  };

  const currencySymbol = currency === "EUR" ? "€" : "CHF";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Row 1: Country + Currency + TVA */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Template</Label>
            <Select value={billingCountry} onValueChange={(value: BillingCountry) => onChangeBillingCountry(value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">🇫🇷 Français</SelectItem>
                <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Devise</Label>
            <Select value={currency} onValueChange={onChangeCurrency}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">TVA</Label>
            <label className="flex items-center gap-2 h-8 px-2 rounded border bg-background cursor-pointer hover:bg-accent/50">
              <input
                type="checkbox"
                checked={showTax}
                onChange={(e) => {
                  setShowTax(e.target.checked);
                  if (!e.target.checked) setTaxRate(0);
                  else setTaxRate(billingCountry === "CH" ? 8.1 : 20);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm">{showTax ? `${taxRate}%` : "Non"}</span>
            </label>
          </div>
        </div>

        {/* Row 2: Invoice number + dates */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">N° Facture</Label>
            <Input {...register("number")} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
            <Input type="date" {...register("date")} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Échéance</Label>
            <Input type="date" {...register("dueDate")} className="h-8 text-sm" />
          </div>
        </div>

        {/* Deposit deduction (if applicable) */}
        {hasDeposit && (
          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm">
              <span className="text-green-700 dark:text-green-300">Acompte {quote.deposit}%</span>
              <span className="text-green-600 dark:text-green-400 ml-2">
                ({depositAmount.toLocaleString("fr-FR")} {currencySymbol})
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deductDeposit}
                onChange={(e) => setDeductDeposit(e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Déduire</span>
            </label>
          </div>
        )}

        {/* Additional services (collapsible) */}
        <div className="border rounded-lg border-amber-200 dark:border-amber-800">
          <button
            type="button"
            onClick={() => setShowAdditionalServices(!showAdditionalServices)}
            className="flex items-center justify-between w-full p-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg"
          >
            <span>Services additionnels{additionalServices.length > 0 ? ` (${additionalServices.length})` : ""}</span>
            {showAdditionalServices ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showAdditionalServices && (
            <div className="px-2 pb-2 space-y-2">
              {additionalServices.map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  <Input
                    value={service.description}
                    onChange={(e) =>
                      setAdditionalServices((prev) =>
                        prev.map((s) =>
                          s.id === service.id ? { ...s, description: e.target.value } : s
                        )
                      )
                    }
                    placeholder="Description"
                    className="h-8 text-sm flex-1"
                  />
                  <Input
                    type="number"
                    value={service.amount || ""}
                    onChange={(e) =>
                      setAdditionalServices((prev) =>
                        prev.map((s) =>
                          s.id === service.id ? { ...s, amount: parseFloat(e.target.value) || 0 } : s
                        )
                      )
                    }
                    placeholder="Montant"
                    className="h-8 text-sm w-24"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAdditionalServices((prev) => prev.filter((s) => s.id !== service.id))
                    }
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setAdditionalServices((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), description: "", amount: 0 },
                  ])
                }
                className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                <Plus className="w-4 h-4" />
                Ajouter un service
              </button>
            </div>
          )}
        </div>

        {/* Payment account (if available) */}
        {paymentAccounts.length > 0 && (
          <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Compte de paiement</Label>
            </div>
            <Select
              value={selectedPaymentAccount?.id || ""}
              onValueChange={(value) => {
                const account = paymentAccounts.find((a) => a.id === value);
                setSelectedPaymentAccount(account);
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {paymentAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.country === "CH" ? "🇨🇭 " : "🇫🇷 "}
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPaymentAccount && billingCountry === "CH" && selectedPaymentAccount.country === "CH" && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ QR-Facture suisse incluse
              </p>
            )}
          </div>
        )}

        {/* Notes (collapsible) */}
        <div className="border rounded-lg">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full p-2 text-sm text-muted-foreground hover:bg-accent/50 rounded-lg"
          >
            <span>Notes (optionnel)</span>
            {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showNotes && (
            <div className="px-2 pb-2">
              <Textarea
                {...register("notes")}
                placeholder="Notes ou conditions particulières..."
                className="text-sm min-h-[60px] resize-none"
              />
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 text-white">
          <div className="space-y-1 text-sm">
            {deductDeposit && hasDeposit && (
              <>
                <div className="flex justify-between text-slate-400">
                  <span>Total devis</span>
                  <span>{quote.totalAmount.toLocaleString("fr-FR")} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Acompte versé</span>
                  <span>-{depositAmount.toLocaleString("fr-FR")} {currencySymbol}</span>
                </div>
                <div className="border-t border-slate-700 my-2" />
              </>
            )}
            <div className="flex justify-between">
              <span className="text-slate-300">{deductDeposit ? "Solde HT" : "Montant HT"}</span>
              <span>{baseAmount.toLocaleString("fr-FR")} {currencySymbol}</span>
            </div>
            {additionalTotal > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Services additionnels</span>
                <span>+{additionalTotal.toLocaleString("fr-FR")} {currencySymbol}</span>
              </div>
            )}
            {showTax && (
              <div className="flex justify-between text-blue-400">
                <span>TVA ({taxRate}%)</span>
                <span>{(((baseAmount + additionalTotal) * taxRate) / 100).toLocaleString("fr-FR")} {currencySymbol}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-700 text-base font-bold">
              <span>{showTax ? "Total TTC" : "Total"}</span>
              <span className="text-green-400">
                {((baseAmount + additionalTotal) * (1 + (showTax ? taxRate : 0) / 100)).toLocaleString("fr-FR")} {currencySymbol}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer with button */}
      <div className="shrink-0 px-4 py-3 border-t bg-slate-50 dark:bg-slate-900/50">
        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-10"
        >
          {isEditing ? "Modifier la facture" : "Créer la facture"}
        </Button>
      </div>
    </form>
  );
}
