"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Wand2, DollarSign, Tag, TrendingDown, Package, FileText, Hash, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Invoice, Service, Company, PaymentAccount } from "@/app/types";
import { TemplateSelector } from "../template-selector";
import { AIRewriteDialog } from "../ai-rewrite-dialog";
import { getPaymentAccounts } from "@/lib/firebase";
import { CreditCard } from "lucide-react";

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
  const [services, setServices] = useState<Service[]>([
    {
      id: crypto.randomUUID(),
      quantity: 1,
      description: "",
      unitPrice: 0,
      amount: 0,
    },
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currency, setCurrency] = useState<string>(
    initialData?.currency || "EUR"
  );
  const [showTax, setShowTax] = useState<boolean>(
    initialData?.showTax ?? false
  );
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<PaymentAccount | undefined>(
    initialData?.paymentAccount
  );

  // Load payment accounts
  useEffect(() => {
    const loadPaymentAccounts = async () => {
      try {
        const accounts = await getPaymentAccounts();
        setPaymentAccounts(accounts);
        // If editing and has payment account, set it
        if (initialData?.paymentAccount) {
          setSelectedPaymentAccount(initialData.paymentAccount);
        }
      } catch (error) {
        console.error("Error loading payment accounts:", error);
      }
    };
    loadPaymentAccounts();
  }, []);

  // Synchronise la devise si on édite un devis existant
  useEffect(() => {
    if (initialData?.currency && initialData.currency !== currency) {
      setCurrency(initialData.currency);
    }
  }, [initialData?.currency]);
  // Ajout du calcul TTC
  const [taxRate, setTaxRate] = useState<number>(
    currency === "EUR" ? 20 : currency === "CHF" ? 8.1 : 0
  );

  const totalTTC = totalAmount * (1 + taxRate / 100);

  const { register, handleSubmit, reset, setValue } = useForm<Invoice>({
    defaultValues: initialData || {
      company: companyInfo || {
        name: "Dev4Ecom",
        address: "60 rue François 1er, 75008 Paris",
        siren: "814 428 785",
      },
      status: "draft",
      deposit: 50,
      services: [],
      discount: {
        type: "percentage",
        value: 0,
      },
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

    // Keep current company info when using a template
    if (companyInfo) {
      setValue("company", companyInfo);
    }
  };

  const handleApplyAIContent = (data: any) => {
    // Appliquer les services générés
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

    // Appliquer les conditions de paiement
    if (data.paymentTerms) {
      setValue("paymentTerms", data.paymentTerms);
    }
  };

  const addService = () => {
    setServices([
      ...services,
      {
        id: crypto.randomUUID(),
        quantity: 1,
        description: "",
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeService = (id: string) => {
    setServices(services.filter((service) => service.id !== id));
  };

  const calculateAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  useEffect(() => {
    const newSubtotal = services.reduce(
      (sum, service) => sum + service.amount,
      0
    );
    setSubtotal(newSubtotal);

    let discount = 0;
    if (discountType === "percentage") {
      discount = (newSubtotal * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    const newTotal = Math.max(0, newSubtotal - discount);
    setTotalAmount(newTotal);
  }, [services, discountType, discountValue]);

  const onSubmit = (data: Invoice) => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoice: Invoice = {
      ...data,
      id: initialData?.id || crypto.randomUUID(),
      number:
        initialData?.number ||
        `${type === "quote" ? "DEV" : "FAC"}-${year}-${randomNum}`,
      date: initialData?.date || new Date().toISOString(),
      validUntil:
        initialData?.validUntil ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      services,
      subtotal,
      discount: {
        type: discountType,
        value: discountValue,
      },
      totalAmount,
      remainingBalance: totalAmount * (1 - data.deposit / 100),
      createdAt: initialData?.createdAt || new Date(),
      company: companyInfo || data.company, // Use companyInfo if available
      showTax,
      paymentAccount: selectedPaymentAccount,
    };

    onSave(invoice);
    if (!initialData) {
      reset();
      setServices([
        {
          id: crypto.randomUUID(),
          quantity: 1,
          description: "",
          unitPrice: 0,
          amount: 0,
        },
      ]);
      setDiscountValue(0);
    }
  };

  const onChangeCurrency = (value: string) => {
    setCurrency(value);
    setValue("currency", value);

    if (currency === "EUR") {
      setTaxRate(20);
    } else if (currency === "CHF") {
      setTaxRate(8.1);
    } else {
      setTaxRate(0);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="w-full sm:w-1/3">
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
        <div className="w-full sm:w-auto">
          <TemplateSelector
            onSelectTemplate={handleTemplateSelect}
            currentInvoice={initialData || undefined}
          />
        </div>
      </div>

      <div className="mb-4 px-0 sm:px-0">
        <label className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
          <input
            type="checkbox"
            checked={showTax}
            onChange={(e) => setShowTax(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Afficher la TVA</span>
        </label>
      </div>
      <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-220px)] pr-4">
        <div className="space-y-8">
          <Card className="p-4 sm:p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Informations du client</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Détails de l'entreprise cliente</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nom de l'entreprise</Label>
                <Input
                  id="clientName"
                  {...register("client.name")}
                  placeholder="AMERICAINE IMPORT"
                  className="h-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSiren" className="text-sm font-semibold text-slate-700 dark:text-slate-300">SIREN</Label>
                <Input
                  id="clientSiren"
                  {...register("client.siren")}
                  placeholder="898 730 551"
                  className="h-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adresse</Label>
                <Input
                  id="clientAddress"
                  {...register("client.address")}
                  placeholder="Adresse complète"
                  className="h-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Services</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Détail des prestations et tarifs</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={() => setIsAIDialogOpen(true)}
                    variant="outline"
                    className="gap-2 w-full sm:w-auto dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 order-2 sm:order-1"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Rédigé par IA</span>
                    <span className="sm:hidden">IA</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={addService}
                    className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 order-1 sm:order-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Ajouter un service</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </div>
              </div>

              {/* Header row - Colonnes */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-2">
                <div className="col-span-1 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <Hash className="w-3 h-3" />
                  Qté
                </div>
                <div className="col-span-6 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <FileText className="w-3 h-3" />
                  Description
                </div>
                <div className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <DollarSign className="w-3 h-3" />
                  Prix unit.
                </div>
                <div className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  <Tag className="w-3 h-3" />
                  Montant
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-3">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="grid grid-cols-12 gap-2 sm:gap-3 md:gap-4 items-start p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  {/* Mobile label for quantity */}
                  <div className="col-span-3 sm:col-span-1">
                    <Label htmlFor={`quantity-${index}`} className="text-xs sm:hidden block mb-1 text-slate-600 dark:text-slate-400">Qté</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      value={service.quantity}
                      onChange={(e) => {
                        const newServices = [...services];
                        const serviceIndex = newServices.findIndex(
                          (s) => s.id === service.id
                        );
                        newServices[serviceIndex].quantity = parseInt(
                          e.target.value
                        );
                        newServices[serviceIndex].amount = calculateAmount(
                          parseInt(e.target.value),
                          newServices[serviceIndex].unitPrice
                        );
                        setServices(newServices);
                      }}
                      className="dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-9 sm:col-span-6">
                    <Label htmlFor={`description-${index}`} className="text-xs sm:hidden block mb-1 text-slate-600 dark:text-slate-400">Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={service.description}
                      onChange={(e) => {
                        const newServices = [...services];
                        const serviceIndex = newServices.findIndex(
                          (s) => s.id === service.id
                        );
                        newServices[serviceIndex].description = e.target.value;
                        setServices(newServices);
                      }}
                      placeholder="Décrivez le service ou le produit..."
                      rows={3}
                      className="dark:bg-slate-800 dark:border-slate-600 dark:text-white resize-none text-sm"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label htmlFor={`unitPrice-${index}`} className="text-xs sm:hidden block mb-1 text-slate-600 dark:text-slate-400">P.U.</Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      value={service.unitPrice}
                      onChange={(e) => {
                        const newServices = [...services];
                        const serviceIndex = newServices.findIndex(
                          (s) => s.id === service.id
                        );
                        newServices[serviceIndex].unitPrice = parseInt(
                          e.target.value
                        );
                        newServices[serviceIndex].amount = calculateAmount(
                          newServices[serviceIndex].quantity,
                          parseInt(e.target.value)
                        );
                        setServices(newServices);
                      }}
                      className="dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label htmlFor={`amount-${index}`} className="text-xs sm:hidden block mb-1 text-slate-600 dark:text-slate-400">Montant</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      value={service.amount}
                      disabled
                      className="dark:bg-slate-800 dark:border-slate-600 dark:text-white/60 h-9 font-semibold text-sm"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-9 w-9"
                      onClick={() => removeService(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Récapitulatif - Sortie de la section Services */}
          <div className="w-full">
            {/* Summary Card - Design sombre aligné */}
            <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-700 dark:border-slate-800 px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
                <h3 className="text-lg font-bold text-white">Récapitulatif</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {showTax ? "Détail avec TVA" : "Détail des montants"}
                </p>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-5 py-3 sm:py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Montant HT */}
                  <div className="flex items-center justify-between md:flex-col md:items-start md:gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-300">Montant HT</span>
                    </div>
                    <span className="font-semibold text-white text-sm sm:text-base">
                      {subtotal.toLocaleString("fr-FR")}{" "}
                      {currency === "EUR" ? "€" : "CHF"}
                    </span>
                  </div>

                  {/* Remise */}
                  {discountValue > 0 && (
                    <div className="flex items-center justify-between md:flex-col md:items-start py-2 px-3 bg-red-950/40 rounded-lg border border-red-800">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-300">Remise</span>
                      </div>
                      <span className="font-semibold text-red-400 text-sm sm:text-base">
                        -{discountType === "percentage"
                          ? `${discountValue}%`
                          : `${discountValue.toLocaleString("fr-FR")} ${
                              currency === "EUR" ? "€" : "CHF"
                            }`}
                      </span>
                    </div>
                  )}

                  {/* Total HT */}
                  <div className="flex items-center justify-between md:flex-col md:items-start pt-2 border-t border-slate-700 md:border-0">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-200">Total HT</span>
                    </div>
                    <span className="font-bold text-white text-sm sm:text-base">
                      {totalAmount.toLocaleString("fr-FR")}{" "}
                      {currency === "EUR" ? "€" : "CHF"}
                    </span>
                  </div>

                  {/* TVA */}
                  {showTax && taxRate > 0 && (
                    <div className="flex items-center justify-between md:flex-col md:items-start">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-950/50 text-blue-300 text-xs font-semibold rounded-md border border-blue-800">
                          TVA
                        </span>
                        <span className="text-sm text-slate-400">({taxRate}%)</span>
                      </div>
                      <span className="font-semibold text-blue-400 text-sm sm:text-base">
                        {((totalAmount * taxRate) / 100).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        {currency === "EUR" ? "€" : "CHF"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total TTC/Total - Highlighted - Full width */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 mt-4 sm:mt-6 bg-blue-950/60 rounded-lg border-2 border-blue-700">
                  <span className="font-bold text-blue-100 text-sm sm:text-base">{showTax ? "Total TTC" : "Total"}</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-400">
                    {showTax ? totalTTC.toLocaleString("fr-FR") : totalAmount.toLocaleString("fr-FR")}{" "}
                    {currency === "EUR" ? "€" : "CHF"}
                  </span>
                </div>
              </div>

              {/* Footer - Discount Controls */}
              <div className="border-t border-slate-700 px-4 sm:px-5 py-3 sm:py-4 bg-slate-800/50 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Configuration de la remise</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="flex-1">
                    <Label className="text-xs mb-2 block text-slate-300">Type</Label>
                    <Select
                      value={discountType}
                      onValueChange={(value: "percentage" | "fixed") =>
                        setDiscountType(value)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="percentage" className="text-white">
                          Pourcentage (%)
                        </SelectItem>
                        <SelectItem value="fixed" className="text-white">
                          Montant fixe ({currency === "EUR" ? "€" : "CHF"})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs mb-2 block text-slate-300">Valeur</Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) =>
                        setDiscountValue(Number(e.target.value))
                      }
                      placeholder="0"
                      className="h-9 text-sm bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-4 sm:p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950">
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Conditions de paiement</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Acompte, délai et conditions</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Acompte (%)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    {...register("deposit")}
                    placeholder="50"
                    className="h-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Délai de livraison</Label>
                  <Input
                    id="deliveryTime"
                    {...register("deliveryTime")}
                    placeholder="3 semaines"
                    className="h-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Conditions de paiement</Label>
                <Textarea
                  id="paymentTerms"
                  {...register("paymentTerms")}
                  placeholder="50% à la signature, 50% à la livraison"
                  rows={3}
                  className="dark:bg-slate-800 dark:border-slate-600 dark:text-white resize-none text-sm"
                />
              </div>
              {paymentAccounts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Compte de paiement
                  </Label>
                  <Select
                    value={selectedPaymentAccount?.id || ""}
                    onValueChange={(value) => {
                      const account = paymentAccounts.find((a) => a.id === value);
                      setSelectedPaymentAccount(account);
                    }}
                  >
                    <SelectTrigger className="h-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm">
                      <SelectValue placeholder="Sélectionner un compte de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {account.accountHolder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPaymentAccount && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1">
                      <p><span className="font-medium">IBAN :</span> {selectedPaymentAccount.iban}</p>
                      <p><span className="font-medium">BIC :</span> {selectedPaymentAccount.bic}</p>
                      <p><span className="font-medium">Titulaire :</span> {selectedPaymentAccount.accountHolder}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </ScrollArea>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-2 sticky bottom-0 bg-white dark:bg-slate-950 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold h-10 px-6 text-sm sm:text-base"
        >
          {initialData ? "Mettre à jour" : "Créer"} le{" "}
          {type === "quote" ? "devis" : "facture"}
        </Button>
      </div>

      <AIRewriteDialog
        services={services}
        catalogData={{
          company: "Dev4Ecom",
          currency: currency,
          strategy_type: "Service as a Product (SaaP)",
          target_market: "TPE, PME, Artisans, Indépendants",
        }}
        quoteData={{
          client: initialData?.client,
          totalAmount,
          services,
        }}
        onApply={handleApplyAIContent}
        isOpen={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
      />
    </form>
  );
}
