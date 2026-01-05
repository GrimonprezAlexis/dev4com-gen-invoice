"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Invoice, Service, Company } from "@/app/types";
import { TemplateSelector } from "../template-selector";
import { AIRewriteDialog } from "../ai-rewrite-dialog";

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
      <div className="flex justify-between items-center mb-4">
        <div className="w-1/3">
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
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          currentInvoice={initialData || undefined}
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTax}
            onChange={(e) => setShowTax(e.target.checked)}
          />
          Afficher la TVA
        </label>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <div className="space-y-8">
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              Informations du client
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom de l'entreprise</Label>
                <Input
                  id="clientName"
                  {...register("client.name")}
                  placeholder="AMERICAINE IMPORT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSiren">SIREN</Label>
                <Input
                  id="clientSiren"
                  {...register("client.siren")}
                  placeholder="898 730 551"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientAddress">Adresse</Label>
                <Input
                  id="clientAddress"
                  {...register("client.address")}
                  placeholder="Adresse complète"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <h2 className="text-xl sm:text-2xl font-bold">Services</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setIsAIDialogOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Rédigé par IA
                </Button>
                <Button type="button" onClick={addService} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un service
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="grid grid-cols-12 gap-2 sm:gap-4 items-end"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <Label htmlFor={`quantity-${index}`}>Qté</Label>
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
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-6">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
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
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <Label htmlFor={`unitPrice-${index}`}>Prix unitaire</Label>
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
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <Label htmlFor={`amount-${index}`}>Montant</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      value={service.amount}
                      disabled
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive w-full"
                      onClick={() => removeService(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-6 space-y-4">
                <div className="flex justify-end">
                  <div className="w-full sm:w-1/3 space-y-2">
                    <div className="flex justify-between">
                      <span>Montant HT :</span>
                      <span>
                        {subtotal.toLocaleString("fr-FR")}{" "}
                        {currency === "EUR" ? "€" : "CHF"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remise :</span>
                      <span>
                        {discountType === "percentage"
                          ? `${discountValue}%`
                          : `${discountValue.toLocaleString("fr-FR")} ${
                              currency === "EUR" ? "€" : "CHF"
                            }`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total HT :</span>
                      <span>
                        {totalAmount.toLocaleString("fr-FR")}{" "}
                        {currency === "EUR" ? "€" : "CHF"}
                      </span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between">
                        <span>TVA ({taxRate}%) :</span>
                        <span>
                          {((totalAmount * taxRate) / 100).toLocaleString(
                            "fr-FR"
                          )}{" "}
                          {currency === "EUR" ? "€" : "CHF"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Total TTC :</span>
                      <span>
                        {totalTTC.toLocaleString("fr-FR")}{" "}
                        {currency === "EUR" ? "€" : "CHF"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <Label>Type de remise</Label>
                        <Select
                          value={discountType}
                          onValueChange={(value: "percentage" | "fixed") =>
                            setDiscountType(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Pourcentage (%)
                            </SelectItem>
                            <SelectItem value="fixed">
                              Montant fixe ({currency === "EUR" ? "€" : "CHF"})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label>Valeur de la remise</Label>
                        <Input
                          type="number"
                          value={discountValue}
                          onChange={(e) =>
                            setDiscountValue(Number(e.target.value))
                          }
                          placeholder={
                            discountType === "percentage"
                              ? "0%"
                              : `0${currency === "EUR" ? "€" : "CHF"}`
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              Conditions de paiement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">Acompte (%)</Label>
                <Input
                  id="deposit"
                  type="number"
                  {...register("deposit")}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Délai de livraison</Label>
                <Input
                  id="deliveryTime"
                  {...register("deliveryTime")}
                  placeholder="3 semaines"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                <Input
                  id="paymentTerms"
                  {...register("paymentTerms")}
                  placeholder="50% à la signature, 50% à la livraison"
                />
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>

      <div className="flex justify-end space-x-4 sticky bottom-0 bg-background p-4 border-t">
        <Button type="submit">
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
