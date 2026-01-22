"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice, Service, Company, PaymentAccount, BillingCountry } from "@/app/types";
import { getDefaultCurrency, getDefaultTaxRate } from "@/lib/swiss-utils";
import { TemplateSelector } from "../template-selector";
import { AIRewriteDialog } from "../ai-rewrite-dialog";
import { getPaymentAccounts } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  initialData?: Invoice | null;
  type: "quote" | "billing";
  companyInfo?: Company | null;
}

export function InvoiceForm({
  onSave,
  initialData,
  type,
  companyInfo,
}: InvoiceFormProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([
    { id: crypto.randomUUID(), quantity: 1, description: "", unitPrice: 0, amount: 0 },
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currency, setCurrency] = useState<string>(initialData?.currency || "EUR");
  const [showTax, setShowTax] = useState<boolean>(initialData?.showTax ?? false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<PaymentAccount | undefined>(initialData?.paymentAccount);
  const [billingCountry, setBillingCountry] = useState<BillingCountry>(initialData?.billingCountry || companyInfo?.country || "FR");
  const [taxRate, setTaxRate] = useState<number>(currency === "EUR" ? 20 : currency === "CHF" ? 8.1 : 0);

  // Collapsible sections
  const [showClient, setShowClient] = useState(true);
  const [showConditions, setShowConditions] = useState(false);

  const totalTTC = totalAmount * (1 + taxRate / 100);
  const currencySymbol = currency === "EUR" ? "€" : "CHF";

  // Load payment accounts
  useEffect(() => {
    if (!user) return;
    const loadPaymentAccounts = async () => {
      try {
        const accounts = await getPaymentAccounts(user.uid);
        setPaymentAccounts(accounts);
        if (initialData?.paymentAccount) {
          setSelectedPaymentAccount(initialData.paymentAccount);
        }
      } catch (error) {
        console.error("Error loading payment accounts:", error);
      }
    };
    loadPaymentAccounts();
  }, [user]);

  useEffect(() => {
    if (initialData?.currency && initialData.currency !== currency) {
      setCurrency(initialData.currency);
    }
  }, [initialData?.currency]);

  const { register, handleSubmit, reset, setValue } = useForm<Invoice>({
    defaultValues: initialData || {
      company: companyInfo || { name: "", address: "", siren: "" },
      status: "draft",
      deposit: 50,
      services: [],
      discount: { type: "percentage", value: 0 },
    },
  });

  useEffect(() => {
    if (initialData) {
      setServices(initialData.services);
      setDiscountType(initialData.discount.type);
      setDiscountValue(initialData.discount.value);
    }
  }, [initialData]);

  useEffect(() => {
    if (companyInfo && !initialData) {
      setValue("company", companyInfo);
    }
  }, [companyInfo, initialData, setValue]);

  const handleTemplateSelect = (template: Invoice) => {
    setServices(template.services);
    setDiscountType(template.discount.type);
    setDiscountValue(template.discount.value);
    setValue("client", template.client);
    setValue("deposit", template.deposit);
    setValue("deliveryTime", template.deliveryTime);
    setValue("paymentTerms", template.paymentTerms);
    if (companyInfo) setValue("company", companyInfo);
  };

  const handleApplyAIContent = (data: any) => {
    if (data.services && Array.isArray(data.services)) {
      const newServices = data.services.map((service: any) => ({
        id: crypto.randomUUID(),
        description: service.description || "",
        quantity: service.quantity || 1,
        unitPrice: service.unitPrice || 0,
        amount: (service.quantity || 1) * (service.unitPrice || 0),
      }));
      setServices(newServices);
    }
    if (data.paymentTerms) setValue("paymentTerms", data.paymentTerms);
  };

  const addService = () => {
    setServices([...services, { id: crypto.randomUUID(), quantity: 1, description: "", unitPrice: 0, amount: 0 }]);
  };

  const removeService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  useEffect(() => {
    const newSubtotal = services.reduce((sum, s) => sum + s.amount, 0);
    setSubtotal(newSubtotal);
    const discount = discountType === "percentage" ? (newSubtotal * discountValue) / 100 : discountValue;
    setTotalAmount(Math.max(0, newSubtotal - discount));
  }, [services, discountType, discountValue]);

  const onSubmit = (data: Invoice) => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoice: Invoice = {
      ...data,
      id: initialData?.id || crypto.randomUUID(),
      number: initialData?.number || `${type === "quote" ? "DEV" : "FAC"}-${year}-${randomNum}`,
      date: initialData?.date || new Date().toISOString(),
      validUntil: initialData?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      services,
      subtotal,
      discount: { type: discountType, value: discountValue },
      totalAmount,
      remainingBalance: totalAmount * (1 - data.deposit / 100),
      createdAt: initialData?.createdAt || new Date(),
      company: companyInfo || data.company,
      showTax,
      paymentAccount: selectedPaymentAccount,
      billingCountry,
      currency,
    };
    onSave(invoice);
    if (!initialData) {
      reset();
      setServices([{ id: crypto.randomUUID(), quantity: 1, description: "", unitPrice: 0, amount: 0 }]);
      setDiscountValue(0);
    }
  };

  const onChangeCurrency = (value: string) => {
    setCurrency(value);
    setValue("currency", value);
    setTaxRate(value === "EUR" ? 20 : value === "CHF" ? 8.1 : 0);
  };

  const onChangeBillingCountry = (country: BillingCountry) => {
    setBillingCountry(country);
    const newCurrency = getDefaultCurrency(country);
    setCurrency(newCurrency);
    setValue("currency", newCurrency);
    setTaxRate(getDefaultTaxRate(country));
    if (country === "CH") setShowTax(false);
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(services.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated.amount = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[calc(85vh-60px)]">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Row 1: Country + Currency + TVA + Template */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="w-24">
            <Label className="text-xs text-muted-foreground mb-1 block">Pays</Label>
            <Select value={billingCountry} onValueChange={(v: BillingCountry) => onChangeBillingCountry(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">🇫🇷 France</SelectItem>
                <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
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
          <label className="flex items-center gap-2 h-8 px-2 rounded border bg-background cursor-pointer hover:bg-accent/50">
            <input
              type="checkbox"
              checked={showTax}
              onChange={(e) => setShowTax(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs">TVA {showTax ? `${taxRate}%` : "Non"}</span>
          </label>
          <div className="ml-auto">
            <TemplateSelector onSelectTemplate={handleTemplateSelect} currentInvoice={initialData || undefined} />
          </div>
        </div>

        {/* Client section (collapsible) */}
        <div className="border rounded-lg">
          <button
            type="button"
            onClick={() => setShowClient(!showClient)}
            className="flex items-center justify-between w-full p-2 text-sm font-medium hover:bg-accent/50 rounded-t-lg"
          >
            <span>Client</span>
            {showClient ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showClient && (
            <div className="px-2 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nom</Label>
                <Input {...register("client.name")} placeholder="Entreprise" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SIREN</Label>
                <Input {...register("client.siren")} placeholder="123 456 789" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Adresse</Label>
                <Input {...register("client.address")} placeholder="Adresse" className="h-8 text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* Services section */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-sm font-medium">Services</span>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAIDialogOpen(true)} className="h-7 text-xs gap-1">
                <Wand2 className="w-3 h-3" /> IA
              </Button>
              <Button type="button" size="sm" onClick={addService} className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
            </div>
          </div>
          <div className="p-2 space-y-2 max-h-[200px] overflow-y-auto">
            {services.map((service, idx) => (
              <div key={service.id} className="grid grid-cols-12 gap-1 items-start p-2 bg-slate-50 dark:bg-slate-900/50 rounded border">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-[10px] text-muted-foreground sm:hidden">Qté</Label>
                  <Input
                    type="number"
                    value={service.quantity}
                    onChange={(e) => updateService(service.id, "quantity", parseInt(e.target.value) || 0)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="col-span-10 sm:col-span-6">
                  <Label className="text-[10px] text-muted-foreground sm:hidden">Description</Label>
                  <Textarea
                    value={service.description}
                    onChange={(e) => updateService(service.id, "description", e.target.value)}
                    placeholder="Description du service..."
                    className="text-xs min-h-[50px] resize-none"
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <Label className="text-[10px] text-muted-foreground sm:hidden">P.U.</Label>
                  <Input
                    type="number"
                    value={service.unitPrice}
                    onChange={(e) => updateService(service.id, "unitPrice", parseInt(e.target.value) || 0)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <Label className="text-[10px] text-muted-foreground sm:hidden">Total</Label>
                  <Input value={service.amount} disabled className="h-7 text-xs font-medium" />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeService(service.id)} className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + Discount compact */}
        <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 text-white">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Sous-total</span>
              <span>{subtotal.toLocaleString("fr-FR")} {currencySymbol}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between gap-2 text-red-400">
                <span>Remise</span>
                <span>-{discountType === "percentage" ? `${discountValue}%` : `${discountValue} ${currencySymbol}`}</span>
              </div>
            )}
            {showTax && (
              <div className="flex justify-between gap-2 text-blue-400">
                <span>TVA ({taxRate}%)</span>
                <span>{((totalAmount * taxRate) / 100).toLocaleString("fr-FR")} {currencySymbol}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <span className="font-bold">{showTax ? "Total TTC" : "Total"}</span>
            <span className="text-lg font-bold text-green-400">
              {(showTax ? totalTTC : totalAmount).toLocaleString("fr-FR")} {currencySymbol}
            </span>
          </div>
          {/* Discount controls inline */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700">
            <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
              <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-700 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">%</SelectItem>
                <SelectItem value="fixed">{currencySymbol}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              placeholder="Remise"
              className="h-7 text-xs bg-slate-800 border-slate-700 w-20"
            />
            <span className="text-xs text-slate-500 self-center">Remise</span>
          </div>
        </div>

        {/* Conditions section (collapsible) */}
        <div className="border rounded-lg">
          <button
            type="button"
            onClick={() => setShowConditions(!showConditions)}
            className="flex items-center justify-between w-full p-2 text-sm text-muted-foreground hover:bg-accent/50 rounded-lg"
          >
            <span>Conditions de paiement</span>
            {showConditions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showConditions && (
            <div className="px-2 pb-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Acompte (%)</Label>
                  <Input type="number" {...register("deposit")} placeholder="50" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Délai livraison</Label>
                  <Input {...register("deliveryTime")} placeholder="3 semaines" className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conditions</Label>
                <Textarea {...register("paymentTerms")} placeholder="50% à la signature..." className="text-sm min-h-[50px] resize-none" />
              </div>
              {paymentAccounts.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Compte de paiement
                  </Label>
                  <Select
                    value={selectedPaymentAccount?.id || ""}
                    onValueChange={(v) => setSelectedPaymentAccount(paymentAccounts.find((a) => a.id === v))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.country === "CH" ? "🇨🇭 " : "🇫🇷 "}{acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer with button */}
      <div className="shrink-0 px-4 py-3 border-t bg-slate-50 dark:bg-slate-900/50">
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10">
          {initialData ? "Mettre à jour" : "Créer"} le {type === "quote" ? "devis" : "facture"}
        </Button>
      </div>

      <AIRewriteDialog
        services={services}
        catalogData={{ company: "Dev4Ecom", currency, strategy_type: "Service as a Product (SaaP)", target_market: "TPE, PME" }}
        quoteData={{ client: initialData?.client, totalAmount, services }}
        onApply={handleApplyAIContent}
        isOpen={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
      />
    </form>
  );
}
