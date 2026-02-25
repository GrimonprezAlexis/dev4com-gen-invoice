"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Invoice, BillingInvoice } from "@/app/types";
import {
  CheckCircle2,
  FileText,
  PenLine,
  Loader2,
  Clock,
  AlertTriangle,
  CreditCard,
  Shield,
  Lock,
  Eye,
  ArrowRight,
  Check,
  Mail,
  Receipt,
  Banknote,
} from "lucide-react";
type DocumentType = "quote" | "billing";

// Steps configuration per document type and payment mode
const QUOTE_STEPS_WITH_PAYMENT = [
  { number: 1, label: "Aperçu", icon: Eye },
  { number: 2, label: "Signature", icon: PenLine },
  { number: 3, label: "Paiement", icon: CreditCard },
  { number: 4, label: "Confirmation", icon: CheckCircle2 },
] as const;

const QUOTE_STEPS_NO_PAYMENT = [
  { number: 1, label: "Aperçu", icon: Eye },
  { number: 2, label: "Signature", icon: PenLine },
  { number: 3, label: "Confirmation", icon: CheckCircle2 },
] as const;

const BILLING_STEPS = [
  { number: 1, label: "Aperçu", icon: Eye },
  { number: 2, label: "Paiement", icon: CreditCard },
  { number: 3, label: "Confirmation", icon: CheckCircle2 },
] as const;

export default function ValidationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const documentType: DocumentType = searchParams.get("type") === "billing" ? "billing" : "quote";
  const withPayment = searchParams.get("withPayment") === "true";

  const [document, setDocument] = useState<Invoice | BillingInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [step, setStep] = useState(1);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"stripe" | "transfer" | null>(null);

  const isQuote = documentType === "quote";
  const isBilling = documentType === "billing";

  // Dynamic steps based on payment mode
  // Quote with payment: Aperçu → Signature → Paiement → Confirmation
  // Quote without payment: Aperçu → Signature → Confirmation
  // Billing: Aperçu → Paiement → Confirmation
  const steps = isQuote
    ? (withPayment ? QUOTE_STEPS_WITH_PAYMENT : QUOTE_STEPS_NO_PAYMENT)
    : BILLING_STEPS;
  const lastStep = steps.length;

  // Step mapping depends on document type and payment mode
  // Quote with payment: paymentStep=3, confirmationStep=4
  // Quote without payment: paymentStep=undefined, confirmationStep=3
  // Billing: paymentStep=2, confirmationStep=3
  const hasPaymentStep = withPayment || isBilling;
  const paymentStep = isQuote ? 3 : 2; // only used when hasPaymentStep
  const confirmationStep = isQuote ? (withPayment ? 4 : 3) : 3;

  // Cast helpers
  const quote = isQuote ? (document as Invoice | null) : null;
  const billing = isBilling ? (document as BillingInvoice | null) : null;

  const fireConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#2563eb", "#10b981", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#2563eb", "#10b981", "#f59e0b"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Calculate the correct payment amount
  const getPaymentAmount = useCallback(
    (doc: Invoice | BillingInvoice): number => {
      if (isQuote) {
        const q = doc as Invoice;
        return q.deposit > 0
          ? q.totalAmount * (q.deposit / 100)
          : q.totalAmount;
      } else {
        const b = doc as BillingInvoice;
        return b.showTax ? b.totalWithTax : b.totalAmount;
      }
    },
    [isQuote]
  );

  // Payment label for display
  const getPaymentLabel = useCallback(
    (doc: Invoice | BillingInvoice): string => {
      if (isQuote) {
        const q = doc as Invoice;
        return q.deposit > 0 ? `Acompte de ${q.deposit}%` : "Montant à payer";
      } else {
        const b = doc as BillingInvoice;
        return b.showTax ? "Total TTC à payer" : "Montant à payer";
      }
    },
    [isQuote]
  );

  // Stripe product name
  const getProductName = useCallback(
    (doc: Invoice | BillingInvoice): string => {
      if (isQuote) {
        const q = doc as Invoice;
        return q.deposit > 0
          ? `Acompte ${q.deposit}% - Devis ${q.number}`
          : `Devis ${q.number} - ${q.company.name}`;
      } else {
        const b = doc as BillingInvoice;
        return `Facture ${b.number} - ${b.company.name}`;
      }
    },
    [isQuote]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      const curr = document?.currency || "EUR";
      if (curr === "CHF") {
        return (
          new Intl.NumberFormat("de-CH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(amount) + " CHF"
        );
      }
      return (
        new Intl.NumberFormat("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount) + " €"
      );
    },
    [document?.currency]
  );

  // Handle Stripe return
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus === "success" && sessionId) {
      setPaymentProcessing(true);
    } else if (paymentStatus === "cancelled") {
      setPaymentCancelled(true);
    }
  }, [searchParams]);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const apiUrl = isQuote
          ? `/api/quotes/${id}`
          : `/api/billing-invoices/${id}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(isQuote ? "Devis introuvable" : "Facture introuvable");
        }
        const data = await response.json();
        setDocument(data);

        // Check expiry (only for quotes)
        if (isQuote && data.validUntil) {
          const validUntilDate = new Date(data.validUntil);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (validUntilDate < today) {
            setIsExpired(true);
            return;
          }
        }

        // Check due date for billing invoices
        if (isBilling && data.dueDate) {
          const dueDate = new Date(data.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            setIsExpired(true);
            return;
          }
        }

        // Determine initial step based on state
        const paymentStatus = searchParams.get("payment");
        const sessionId = searchParams.get("session_id");

        if (data.payment?.stripeSessionId || data.paymentStatus === "paid") {
          setStep(confirmationStep);
          return;
        }

        if (paymentStatus === "success" && sessionId) {
          await processPayment(sessionId, data);
          return;
        }

        if (paymentStatus === "cancelled") {
          if (hasPaymentStep && (isBilling || (isQuote && data.status === "accepted"))) {
            setStep(paymentStep);
          } else {
            setStep(1);
          }
          return;
        }

        // For quotes: if already signed
        if (isQuote && data.status === "accepted") {
          if (hasPaymentStep) {
            setStep(paymentStep);
          } else {
            setStep(confirmationStep);
          }
        }
        // For billing invoices: always start at step 1 (aperçu)
      } catch (err) {
        setError(
          isQuote
            ? "Ce devis n'existe pas ou a été supprimé."
            : "Cette facture n'existe pas ou a été supprimée."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, documentType]);

  const processPayment = async (
    sessionId: string,
    docData: Invoice | BillingInvoice
  ) => {
    try {
      const paymentAmount = getPaymentAmount(docData);
      const apiUrl = isQuote
        ? `/api/quotes/${id}`
        : `/api/billing-invoices/${id}`;

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment: {
            stripeSessionId: sessionId,
            amount: paymentAmount,
            currency: docData.currency || "EUR",
          },
        }),
      });

      if (!response.ok) throw new Error("Erreur paiement");

      setDocument((prev) =>
        prev
          ? {
              ...prev,
              ...(isQuote ? { status: "paid" as const } : {}),
              payment: {
                stripeSessionId: sessionId,
                amount: paymentAmount,
                currency: docData.currency || "EUR",
                paidAt: new Date(),
              } as any,
              paymentStatus: "paid",
            }
          : prev
      );
      setStep(confirmationStep);
      setPaymentProcessing(false);
      setTimeout(() => fireConfetti(), 300);
    } catch (err) {
      setActionError("Erreur lors de la confirmation du paiement.");
      setPaymentProcessing(false);
    }
  };

  const handleSign = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;

    // Already signed — just navigate forward without re-calling the API
    const quoteStatus = (document as Invoice)?.status;
    if (quoteStatus === "accepted" || quoteStatus === "paid") {
      if (hasPaymentStep) {
        setStep(paymentStep);
      } else {
        setStep(confirmationStep);
        setTimeout(() => fireConfetti(), 300);
      }
      return;
    }

    setIsSigning(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "accepted",
          signature: {
            name: `${firstName} ${lastName}`,
            email: email,
          },
          withPayment,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la validation");

      setDocument((prev) =>
        prev
          ? {
              ...prev,
              status: "accepted",
              signature: { name: `${firstName} ${lastName}` },
            }
          : prev
      );
      // Go to payment step if Stripe is enabled, otherwise skip to confirmation
      if (hasPaymentStep) {
        setStep(paymentStep);
      } else {
        setStep(confirmationStep);
        setTimeout(() => fireConfetti(), 300);
      }
    } catch (err) {
      setActionError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSigning(false);
    }
  };

  const handlePayment = async () => {
    if (!document) return;
    setIsRedirecting(true);
    setActionError(null);

    const paymentAmount = getPaymentAmount(document);

    try {
      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: id,
          documentType,
          amount: paymentAmount,
          currency: document.currency || "EUR",
          customerEmail: email || (document as any).signature?.email,
          productName: getProductName(document),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur checkout");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setActionError(err?.message || "Erreur lors de la redirection vers le paiement.");
      setIsRedirecting(false);
    }
  };

  // Document label helpers
  const docLabel = isQuote ? "Devis" : "Facture";
  const docLabelLower = isQuote ? "devis" : "facture";
  const docNumber = document?.number || "";
  const company = document?.company;
  const client = document?.client;
  const services = document?.services || [];

  // Force light mode wrapper — this is a client-facing page
  const lightWrapper = "light bg-[#f8fafc]";

  // --- Loading state ---
  if (loading || paymentProcessing) {
    return (
      <div
        className={`${lightWrapper} min-h-screen flex items-center justify-center`}
        style={{ colorScheme: "light" }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">
            {paymentProcessing
              ? "Confirmation du paiement en cours..."
              : `Chargement ${isQuote ? "du devis" : "de la facture"}...`}
          </p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error || !document) {
    return (
      <div
        className={`${lightWrapper} min-h-screen flex items-center justify-center p-4`}
        style={{ colorScheme: "light" }}
      >
        <Card className="max-w-md w-full p-8 text-center shadow-lg border-0 bg-white">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {docLabel} introuvable
          </h1>
          <p className="text-slate-500">{error}</p>
        </Card>
      </div>
    );
  }

  // --- Expired state ---
  if (isExpired) {
    const expiryDate = isQuote
      ? (document as Invoice).validUntil
      : (document as BillingInvoice).dueDate;

    return (
      <div
        className={`${lightWrapper} min-h-screen flex items-center justify-center p-4`}
        style={{ colorScheme: "light" }}
      >
        <Card className="max-w-md w-full p-8 text-center shadow-lg border-0 bg-white">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {isQuote ? "Devis expiré" : "Facture échue"}
          </h1>
          <p className="text-slate-500 mb-4">
            {isQuote ? "Le devis" : "La facture"}{" "}
            <span className="font-semibold text-slate-700">{docNumber}</span>{" "}
            n&apos;est plus {isQuote ? "valide" : "payable en ligne"}.
          </p>
          <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isQuote ? "Date de validité dépassée" : "Date d'échéance dépassée"}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {isQuote ? "Ce devis était valide" : "Cette facture était payable"}{" "}
              jusqu&apos;au{" "}
              <span className="text-slate-700 font-medium">
                {new Date(expiryDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Veuillez contacter{" "}
            <span className="text-blue-600 font-medium">
              {company?.name}
            </span>{" "}
            pour plus d&apos;informations.
          </p>
        </Card>
      </div>
    );
  }

  // --- Main content ---
  return (
    <div
      className={`${lightWrapper} min-h-screen`}
      style={{ colorScheme: "light" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                {isQuote ? (
                  <FileText className="w-4 h-4 text-white" />
                ) : (
                  <Receipt className="w-4 h-4 text-white" />
                )}
              </div>
            )}
            <span className="font-semibold text-slate-700 text-sm">
              {company?.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connexion sécurisée</span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const isCompleted = step > s.number;
              const isActive = step === s.number;
              const Icon = s.icon;
              // Allow clicking completed steps to go back, but NOT from confirmation (payment done)
              const canNavigate = isCompleted && step !== confirmationStep;

              return (
                <div
                  key={s.number}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      disabled={!canNavigate}
                      onClick={() => canNavigate && setStep(s.number)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                          : isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                      } ${canNavigate ? "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-emerald-400" : ""}`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-4.5 h-4.5" />
                      )}
                    </button>
                    <span
                      className={`mt-2 text-xs font-medium hidden sm:block transition-colors ${
                        isCompleted
                          ? "text-emerald-600"
                          : isActive
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${
                        step > s.number ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1 - Aperçu */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {docLabel} n° {docNumber}
              </h1>
              <p className="text-slate-500 mt-1">
                Vérifiez les détails avant de continuer
              </p>
            </div>

            <Card className="shadow-md border-0 overflow-hidden bg-white">
              {/* Émetteur / Client */}
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Émetteur
                  </h3>
                  <p className="font-semibold text-slate-800">
                    {company?.name}
                  </p>
                  <p className="text-slate-500 text-sm">{company?.address}</p>
                  {company?.siren && !!document?.showSiren && (
                    <p className="text-slate-400 text-xs mt-1">
                      SIREN: {company.siren}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Client
                  </h3>
                  <p className="font-semibold text-slate-800">
                    {client?.name}
                  </p>
                  <p className="text-slate-500 text-sm">{client?.address}</p>
                  {client?.siren && !!document?.showSiren && (
                    <p className="text-slate-400 text-xs mt-1">
                      SIREN: {client.siren}
                    </p>
                  )}
                </div>
              </div>

              {/* Services Table */}
              <div className="p-6">
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <div className="bg-slate-50 px-4 py-3 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-1">Qté</div>
                    <div className="col-span-7">Description</div>
                    <div className="col-span-2 text-right">Prix unit.</div>
                    <div className="col-span-2 text-right">Montant</div>
                  </div>
                  {services.map((service, index) => (
                    <div
                      key={service.id}
                      className={`px-4 py-3 grid grid-cols-12 gap-2 text-sm ${
                        index !== services.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <div className="col-span-1 text-slate-600">
                        {service.quantity}
                      </div>
                      <div className="col-span-7 text-slate-700">
                        {service.description}
                      </div>
                      <div className="col-span-2 text-right text-slate-500">
                        {formatCurrency(service.unitPrice)}
                      </div>
                      <div className="col-span-2 text-right text-slate-800 font-medium">
                        {formatCurrency(service.amount)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end mt-4">
                  <div className="w-80 space-y-2">
                    {/* --- QUOTE totals --- */}
                    {isQuote && quote && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Sous-total</span>
                          <span className="text-slate-700">
                            {formatCurrency(quote.subtotal)}
                          </span>
                        </div>
                        {quote.discount?.value > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-emerald-600">Remise</span>
                            <span className="text-emerald-600">
                              -
                              {quote.discount.type === "percentage"
                                ? formatCurrency(
                                    (quote.subtotal * quote.discount.value) / 100
                                  )
                                : formatCurrency(quote.discount.value)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200">
                          <span className="text-slate-900">Total</span>
                          <span className="text-blue-600">
                            {formatCurrency(quote.totalAmount)}
                          </span>
                        </div>
                        {quote.deposit > 0 && (
                          <div className="flex justify-between text-sm bg-blue-50 rounded-lg p-3 mt-2 border border-blue-100">
                            <span className="text-blue-700 font-medium">
                              Acompte à verser ({quote.deposit}%)
                            </span>
                            <span className="text-blue-700 font-bold">
                              {formatCurrency(
                                quote.totalAmount * (quote.deposit / 100)
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* --- BILLING INVOICE totals --- */}
                    {isBilling && billing && (
                      <>
                        {billing.depositDeducted && billing.originalTotal ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">
                                Total devis original
                              </span>
                              <span className="text-slate-700">
                                {formatCurrency(billing.originalTotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-emerald-600">
                                Acompte versé ({billing.depositPercent}%)
                              </span>
                              <span className="text-emerald-600">
                                -{formatCurrency(billing.depositAmount || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                              <span className="text-slate-500">Solde HT</span>
                              <span className="text-slate-700">
                                {formatCurrency(
                                  billing.totalAmount -
                                    (billing.additionalServicesTotal || 0)
                                )}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Montant HT</span>
                            <span className="text-slate-700">
                              {formatCurrency(
                                billing.totalAmount -
                                  (billing.additionalServicesTotal || 0)
                              )}
                            </span>
                          </div>
                        )}

                        {(billing.additionalServicesTotal || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">
                              Services additionnels
                            </span>
                            <span className="text-slate-700">
                              +
                              {formatCurrency(
                                billing.additionalServicesTotal || 0
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total HT</span>
                          <span className="text-slate-700">
                            {formatCurrency(billing.totalAmount)}
                          </span>
                        </div>

                        {billing.showTax && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">
                              TVA ({billing.taxRate}%)
                            </span>
                            <span className="text-slate-700">
                              {formatCurrency(billing.taxAmount)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200">
                          <span className="text-slate-900">
                            {billing.showTax ? "Total TTC" : "Total"}
                          </span>
                          <span className="text-blue-600">
                            {formatCurrency(
                              billing.showTax
                                ? billing.totalWithTax
                                : billing.totalAmount
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="px-6 pb-6">
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-500 space-y-1">
                  {isQuote && quote && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      {quote.deliveryTime && (
                        <div>
                          <span className="text-slate-400">
                            Délai de livraison :{" "}
                          </span>
                          <span className="text-slate-600">
                            {quote.deliveryTime}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Validité : </span>
                        <span className="text-slate-600">
                          {new Date(quote.validUntil).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {isBilling && billing && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <div>
                        <span className="text-slate-400">
                          Date d&apos;échéance :{" "}
                        </span>
                        <span className="text-slate-600">
                          {new Date(billing.dueDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">
                          Devis de référence :{" "}
                        </span>
                        <span className="text-slate-600">
                          {billing.quoteNumber}
                        </span>
                      </div>
                    </div>
                  )}
                  {isQuote && quote?.paymentTerms && (
                    <div>
                      <span className="text-slate-400">
                        Conditions de paiement :{" "}
                      </span>
                      <span className="text-slate-600">
                        {quote.paymentTerms}
                      </span>
                    </div>
                  )}
                  {isBilling && billing?.notes && (
                    <div>
                      <span className="text-slate-400">Notes : </span>
                      <span className="text-slate-600">{billing.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Button
              onClick={() => setStep(isQuote ? 2 : 2)}
              className="w-full h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20"
            >
              {isQuote ? "Continuer vers la signature" : "Continuer vers le paiement"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2 - Signature (QUOTE ONLY) */}
        {isQuote && step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Signer le devis
              </h1>
              <p className="text-slate-500 mt-1">
                Entrez vos informations pour signer électroniquement
              </p>
            </div>

            <Card className="p-6 shadow-md border-0 bg-white">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700">
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Votre adresse email pour la confirmation"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Signature Preview */}
              {(firstName || lastName) && (
                <div className="mb-6 py-8 px-6 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <p className="text-xs text-slate-400 mb-3">
                    Aperçu de votre signature
                  </p>
                  <p
                    className="text-3xl text-slate-700 italic"
                    style={{
                      fontFamily:
                        "'Brush Script MT', 'Segoe Script', cursive",
                    }}
                  >
                    {firstName} {lastName}
                  </p>
                </div>
              )}

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>{actionError}</p>
                </div>
              )}

              <Button
                onClick={handleSign}
                disabled={
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                  isSigning
                }
                className="w-full h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <PenLine className="w-5 h-5 mr-2" />
                    Signer et continuer
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center mt-4">
                En signant, vous acceptez les conditions du devis et confirmez
                votre engagement.
              </p>
            </Card>

            <button
              onClick={() => setStep(1)}
              className="text-sm text-slate-400 hover:text-slate-600 mx-auto block"
            >
              ← Retour à l&apos;aperçu
            </button>
          </div>
        )}

        {/* Payment Step (only when Stripe payment is enabled) */}
        {hasPaymentStep && step === paymentStep && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold text-slate-900">Paiement</h1>
              <p className="text-slate-500 mt-1">
                Finalisez votre {isQuote ? "commande" : "règlement"} en toute
                sécurité
              </p>
            </div>

            {paymentCancelled && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Paiement annulé</p>
                  <p className="text-amber-600">
                    Votre paiement a été annulé. Vous pouvez réessayer quand
                    vous le souhaitez.
                  </p>
                </div>
              </div>
            )}

            <Card className="p-6 shadow-md border-0 bg-white">
              {/* Signature recap (quote only) */}
              {isQuote && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">
                      Devis signé par{" "}
                      {firstName && lastName
                        ? `${firstName} ${lastName}`
                        : (document as Invoice).signature?.name || "—"}
                    </p>
                    <p className="text-xs text-emerald-600">
                      Signature électronique validée
                    </p>
                  </div>
                </div>
              )}

              {/* Payment breakdown for billing invoices */}
              {isBilling && billing && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Détail du règlement
                  </h3>

                  {billing.depositDeducted && billing.originalTotal ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total devis</span>
                        <span className="text-slate-700">
                          {formatCurrency(billing.originalTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">
                          Acompte déjà versé ({billing.depositPercent}%)
                        </span>
                        <span className="text-emerald-600">
                          -{formatCurrency(billing.depositAmount || 0)}
                        </span>
                      </div>
                    </>
                  ) : null}

                  {(billing.additionalServicesTotal || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Services additionnels
                      </span>
                      <span className="text-slate-700">
                        +{formatCurrency(billing.additionalServicesTotal || 0)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base HT</span>
                    <span className="text-slate-700">
                      {formatCurrency(billing.totalAmount)}
                    </span>
                  </div>

                  {billing.showTax && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        TVA ({billing.taxRate}%)
                      </span>
                      <span className="text-slate-700">
                        {formatCurrency(billing.taxAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment amount */}
              <div className="text-center py-6 mb-6 border-b border-slate-100">
                <p className="text-sm text-slate-500 mb-2">
                  {getPaymentLabel(document)}
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  {formatCurrency(getPaymentAmount(document))}
                </p>
                {isQuote && (document as Invoice).deposit > 0 && (
                  <p className="text-sm text-slate-400 mt-2">
                    sur un total de{" "}
                    {formatCurrency((document as Invoice).totalAmount)}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {docLabel} n° {docNumber}
                </p>
              </div>

              {/* Method selector — shown when paymentAccount exists and no mode chosen yet */}
              {document?.paymentAccount?.iban && paymentMode === null ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 text-center mb-4">
                    Choisissez votre mode de règlement
                  </p>
                  <button
                    onClick={() => setPaymentMode("stripe")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-blue-400 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Paiement en ligne
                      </p>
                      <p className="text-xs text-slate-500">
                        Par carte bancaire via Stripe
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </button>
                  <button
                    onClick={() => setPaymentMode("transfer")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-emerald-400 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Virement bancaire
                      </p>
                      <p className="text-xs text-slate-500">
                        Virement SEPA depuis votre banque
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </button>
                </div>
              ) : paymentMode === "transfer" ? (
                /* Bank transfer details — no status update in Firestore */
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Coordonnées bancaires
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Bénéficiaire</span>
                        <span className="font-medium text-emerald-900">
                          {document?.paymentAccount?.accountHolder}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="text-emerald-700">IBAN</span>
                        <span className="font-mono font-medium text-emerald-900 text-xs tracking-wide break-all">
                          {document?.paymentAccount?.iban
                            .replace(/\s/g, "")
                            .replace(/(.{4})/g, "$1 ")
                            .trim()}
                        </span>
                      </div>
                      {document?.paymentAccount?.bic && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-700">BIC / SWIFT</span>
                          <span className="font-mono font-medium text-emerald-900">
                            {document.paymentAccount.bic}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-emerald-200 pt-2 mt-2 flex justify-between text-sm">
                        <span className="text-emerald-700">Référence</span>
                        <span className="font-medium text-emerald-900">
                          {docLabel} {docNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">Montant</span>
                        <span className="font-bold text-emerald-900">
                          {formatCurrency(getPaymentAmount(document))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Indiquez la référence{" "}
                      <strong>
                        {docLabel} {docNumber}
                      </strong>{" "}
                      dans le libellé de votre virement pour faciliter son
                      traitement.
                    </p>
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        await fetch(`/api/quotes/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "virement",
                            signature: {
                              name: `${firstName} ${lastName}`.trim(),
                              email,
                            },
                          }),
                        });
                      } catch (e) {
                        console.error("Error sending virement email:", e);
                      }
                      setStep(confirmationStep);
                    }}
                    className="w-full h-12 font-medium bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    J'ai noté les coordonnées bancaires
                  </Button>

                  <button
                    onClick={() => setPaymentMode(null)}
                    className="text-sm text-slate-400 hover:text-slate-600 mx-auto block"
                  >
                    ← Choisir un autre mode de paiement
                  </button>
                </div>
              ) : (
                /* Stripe payment (default or explicitly selected) */
                <>
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Lock className="w-4 h-4" />
                      <span>Paiement sécurisé</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Shield className="w-4 h-4" />
                      <span>Données protégées</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <CreditCard className="w-4 h-4" />
                      <span>Stripe Checkout</span>
                    </div>
                  </div>

                  {actionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p>{actionError}</p>
                    </div>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={isRedirecting}
                    className="w-full h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20"
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Redirection vers Stripe...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Payer {formatCurrency(getPaymentAmount(document))}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 text-center mt-4">
                    Vous serez redirigé vers la page de paiement sécurisée
                    Stripe
                  </p>

                  {document?.paymentAccount?.iban && (
                    <button
                      onClick={() => setPaymentMode(null)}
                      className="text-sm text-slate-400 hover:text-slate-600 mx-auto block mt-2"
                    >
                      ← Choisir un autre mode de paiement
                    </button>
                  )}
                </>
              )}
            </Card>

            <button
              onClick={() => setStep(isQuote ? 2 : 1)}
              className="text-sm text-slate-400 hover:text-slate-600 mx-auto block"
            >
              ← Retour {isQuote ? "à la signature" : "à l'aperçu"}
            </button>
          </div>
        )}

        {/* Confirmation Step */}
        {step === confirmationStep && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-[scale-in_0.4s_ease-out]">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {paymentMode === "transfer"
                  ? "Virement enregistré !"
                  : "Merci pour votre confiance !"}
              </h1>
              <p className="text-slate-500">
                {isQuote ? (
                  <>
                    Votre devis{" "}
                    <span className="font-semibold text-slate-700">
                      {docNumber}
                    </span>{" "}
                    a été accepté
                    {paymentMode === "transfer"
                      ? ". Votre virement est attendu."
                      : hasPaymentStep
                      ? " et le paiement confirmé."
                      : "."}
                  </>
                ) : (
                  <>
                    Votre facture{" "}
                    <span className="font-semibold text-slate-700">
                      {docNumber}
                    </span>{" "}
                    {paymentMode === "transfer"
                      ? "est en attente de votre virement."
                      : "a été réglée avec succès."}
                  </>
                )}
              </p>
            </div>

            <Card className="p-6 shadow-md border-0 bg-white">
              {/* Signature info (quote only) */}
              {isQuote && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <PenLine className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">
                      Signé par{" "}
                      {firstName && lastName
                        ? `${firstName} ${lastName}`
                        : (document as Invoice).signature?.name || "—"}
                    </p>
                    <p
                      className="text-lg italic text-emerald-600"
                      style={{
                        fontFamily:
                          "'Brush Script MT', 'Segoe Script', cursive",
                      }}
                    >
                      {firstName && lastName
                        ? `${firstName} ${lastName}`
                        : (document as Invoice).signature?.name || "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment info */}
              {hasPaymentStep && (
                paymentMode === "transfer" ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-6">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">
                        Virement bancaire en attente
                      </p>
                      <p className="text-xs text-amber-600">
                        Référence : {docLabel} {docNumber} —{" "}
                        {formatCurrency(getPaymentAmount(document))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Paiement de{" "}
                        {formatCurrency(getPaymentAmount(document))} confirmé
                        {isQuote &&
                          (document as Invoice).deposit > 0 &&
                          ` (acompte ${(document as Invoice).deposit}%)`}
                      </p>
                      <p className="text-xs text-blue-600">
                        Payé le{" "}
                        {new Date().toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* Email notification */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Mail className="w-5 h-5 text-slate-400" />
                <p className="text-sm text-slate-500">
                  Vous recevrez une confirmation par email
                </p>
              </div>
            </Card>

            <p className="text-center text-xs text-slate-400">
              Émis par {company?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
