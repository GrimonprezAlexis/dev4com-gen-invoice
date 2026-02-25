"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, CreditCard, GripVertical } from "lucide-react";
import { toast } from "sonner";
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
import { getDefaultTaxRate } from "@/lib/swiss-utils";
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
  const [defaultServiceId] = useState(() => crypto.randomUUID());
  const [services, setServices] = useState<Service[]>(
    initialData?.services || [{ id: defaultServiceId, quantity: 1, description: "", unitPrice: 0, amount: 0 }]
  );
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currency, setCurrency] = useState<string>(initialData?.currency || "EUR");
  const [showTax, setShowTax] = useState<boolean>(initialData?.showTax ?? false);
  const [showSiren, setShowSiren] = useState<boolean>(initialData?.showSiren ?? false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<PaymentAccount | undefined>(initialData?.paymentAccount);
  const [billingCountry, setBillingCountry] = useState<BillingCountry>(initialData?.billingCountry || companyInfo?.country || "FR");
  const [taxRate, setTaxRate] = useState<number>(currency === "EUR" ? 20 : currency === "CHF" ? 8.1 : 0);

  // Collapsible sections — expandedServices tracks which services are OPEN
  // Editing: empty set = all collapsed by default
  // New: first service open so user can fill it
  const [showClient, setShowClient] = useState(true);
  const [showConditions, setShowConditions] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(
    () => initialData ? new Set() : new Set([defaultServiceId])
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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
      setExpandedServices(new Set());
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
    const newId = crypto.randomUUID();
    setServices([...services, { id: newId, quantity: 1, description: "", unitPrice: 0, amount: 0 }]);
    setExpandedServices((prev) => { const next = new Set(prev); next.add(newId); return next; });
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
    // Guard: validate required fields
    if (!data.client?.name?.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }
    if (!services.length || services.every((s) => !s.description.trim() && s.amount === 0)) {
      toast.error("Ajoutez au moins un service");
      return;
    }

    const deposit = isNaN(Number(data.deposit)) ? 50 : Number(data.deposit);
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
      deposit,
      remainingBalance: totalAmount * (1 - deposit / 100),
      deliveryTime: data.deliveryTime || "",
      paymentTerms: data.paymentTerms || "",
      createdAt: initialData?.createdAt || new Date(),
      company: companyInfo || data.company,
      showTax,
      showSiren,
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

  const toggleServiceCollapse = (id: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedServices(new Set());
  };

  const expandAll = () => {
    setExpandedServices(new Set(services.map((s) => s.id)));
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const fromIndex = services.findIndex((s) => s.id === draggedId);
    const toIndex = services.findIndex((s) => s.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...services];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setServices(reordered);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[calc(85vh-60px)]">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Row 1: Country + Currency + TVA + Template */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="w-24">
            <Label className="text-xs text-muted-foreground mb-1 block">Template</Label>
            <Select value={billingCountry} onValueChange={(v: BillingCountry) => onChangeBillingCountry(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">🇫🇷 Français</SelectItem>
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
          <label className="flex items-center gap-2 h-8 px-2 rounded border bg-background cursor-pointer hover:bg-accent/50">
            <input
              type="checkbox"
              checked={showSiren}
              onChange={(e) => setShowSiren(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs">SIREN {showSiren ? "Oui" : "Non"}</span>
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
            <span className="text-sm font-medium">Services ({services.length})</span>
            <div className="flex gap-1">
              {services.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={expandedServices.size === 0 ? expandAll : collapseAll}
                  className="h-7 text-xs gap-1 text-muted-foreground"
                >
                  {expandedServices.size === 0 ? (
                    <><ChevronDown className="w-3 h-3" /> Tout ouvrir</>
                  ) : (
                    <><ChevronUp className="w-3 h-3" /> Tout replier</>
                  )}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAIDialogOpen(true)} className="h-7 text-xs gap-1">
                <Wand2 className="w-3 h-3" /> IA
              </Button>
              <Button type="button" size="sm" onClick={addService} className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
            </div>
          </div>
          <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
            {services.map((service, idx) => {
              const isCollapsed = !expandedServices.has(service.id);
              const isDragging = draggedId === service.id;
              const isDragOver = dragOverId === service.id;
              return (
                <div
                  key={service.id}
                  draggable
                  onDragStart={() => handleDragStart(service.id)}
                  onDragOver={(e) => handleDragOver(e, service.id)}
                  onDrop={(e) => handleDrop(e, service.id)}
                  onDragEnd={handleDragEnd}
                  className={`rounded border transition-all ${
                    isDragging
                      ? "opacity-40 scale-[0.98]"
                      : isDragOver
                      ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                      : "bg-slate-50 dark:bg-slate-900/50"
                  }`}
                >
                  {/* Collapsed summary row */}
                  <div
                    className="flex items-center gap-1.5 px-1.5 py-1 cursor-pointer select-none group"
                    onClick={() => toggleServiceCollapse(service.id)}
                  >
                    <div
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-mono w-4 shrink-0">{idx + 1}</span>
                    <span className="text-xs truncate flex-1 text-muted-foreground">
                      {service.description || "Service sans description"}
                    </span>
                    <span className="text-xs font-medium shrink-0 tabular-nums">
                      {service.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); removeService(service.id); }}
                      className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {isCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>

                  {/* Expanded edit form */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-12 gap-1 items-start px-2 pb-2 pt-0.5 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <div className="col-span-2 sm:col-span-1">
                        <Label className="text-[10px] text-muted-foreground">Qté</Label>
                        <Input
                          type="number"
                          value={service.quantity}
                          onChange={(e) => updateService(service.id, "quantity", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="col-span-10 sm:col-span-6">
                        <Label className="text-[10px] text-muted-foreground">Description</Label>
                        <Textarea
                          value={service.description}
                          onChange={(e) => updateService(service.id, "description", e.target.value)}
                          placeholder="Description du service..."
                          className="text-xs min-h-[50px] resize-none"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">P.U.</Label>
                        <Input
                          type="number"
                          value={service.unitPrice}
                          onChange={(e) => updateService(service.id, "unitPrice", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <Label className="text-[10px] text-muted-foreground">Total</Label>
                        <Input value={`${service.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`} disabled className="h-7 text-xs font-medium" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary + Discount */}
        <div className="border rounded-lg">
          <div className="p-2 space-y-1.5">
            {/* Summary lines */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium tabular-nums">{subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-500 dark:text-red-400">Remise</span>
                <span className="text-red-500 dark:text-red-400 tabular-nums">
                  -{discountType === "percentage" ? `${discountValue}%` : `${discountValue} ${currencySymbol}`}
                </span>
              </div>
            )}
            {showTax && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">TVA ({taxRate}%)</span>
                <span className="tabular-nums">{((totalAmount * taxRate) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
              </div>
            )}
            {/* Total */}
            <div className="flex items-center justify-between pt-1.5 border-t">
              <span className="text-sm font-semibold">{showTax ? "Total TTC" : "Total"}</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
                {(showTax ? totalTTC : totalAmount).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
              </span>
            </div>
          </div>
          {/* Discount controls */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-t bg-muted/30">
            <span className="text-[10px] text-muted-foreground shrink-0">Remise</span>
            <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
              <SelectTrigger className="h-7 text-xs w-20">
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
              placeholder="0"
              className="h-7 text-xs w-20"
            />
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
                  {selectedPaymentAccount && billingCountry === "CH" && selectedPaymentAccount.country === "CH" && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ QR-Facture suisse incluse
                    </p>
                  )}
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
