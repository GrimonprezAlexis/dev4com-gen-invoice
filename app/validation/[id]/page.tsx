"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Invoice } from "@/app/types";
import { CheckCircle2, FileText, PenLine, Loader2, Clock, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

export default function ValidationPage() {
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [step, setStep] = useState<"preview" | "sign" | "success">("preview");

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${id}`);
        if (!response.ok) {
          throw new Error("Devis introuvable");
        }
        const data = await response.json();
        setQuote(data);

        // Check if quote has expired
        if (data.validUntil) {
          const validUntilDate = new Date(data.validUntil);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day

          if (validUntilDate < today) {
            setIsExpired(true);
          }
        }

        if (data.status === "accepted") {
          setIsValidated(true);
          setStep("success");
        }
      } catch (err) {
        setError("Ce devis n'existe pas ou a été supprimé.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const fireConfetti = () => {
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
  };

  const handleSign = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      return;
    }

    setIsSigning(true);

    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "accepted",
          signature: {
            name: `${firstName} ${lastName}`,
            email: email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la validation");
      }

      setStep("success");
      setIsValidated(true);
      fireConfetti();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSigning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " €";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Devis introuvable</h1>
          <p className="text-slate-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Card className="max-w-md w-full p-8 text-center bg-slate-900 border-0">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Lien expiré
          </h1>
          <p className="text-lg text-slate-300 mb-6">
            Le devis <span className="font-semibold text-blue-400">{quote.number}</span> n'est plus valide.
          </p>
          <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Date de validité dépassée</span>
            </div>
            <p className="text-slate-400 text-sm">
              Ce devis était valide jusqu'au{" "}
              <span className="text-white font-medium">
                {new Date(quote.validUntil).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Veuillez contacter <span className="text-blue-400">{quote.company.name}</span> pour obtenir un nouveau devis.
          </p>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Card className="max-w-lg w-full p-8 text-center bg-slate-900 border-0">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Merci pour votre confiance !
          </h1>
          <p className="text-lg text-slate-300 mb-6">
            Votre devis <span className="font-semibold text-blue-400">{quote.number}</span> a été accepté et signé avec succès.
          </p>
          <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
            <p className="text-xs text-slate-400 mb-3">Signature :</p>
            <p
              className="text-3xl italic text-white"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
            >
              {firstName || quote.signature?.name?.split(" ")[0]} {lastName || quote.signature?.name?.split(" ").slice(1).join(" ")}
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Signé le {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
          <p className="text-slate-400">
            Vous allez recevoir une confirmation par email.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Validation du devis</h1>
          <p className="text-slate-500 mt-2">Devis n° {quote.number}</p>
        </div>

        {/* Quote Preview - Dark Card */}
        <Card className="bg-slate-900 text-white p-6 mb-6 rounded-xl border-0">
          {/* Emetteur / Client */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ÉMETTEUR</h3>
              <p className="font-semibold text-blue-400">{quote.company.name}</p>
              <p className="text-slate-400 text-sm">{quote.company.address}</p>
              <p className="text-slate-500 text-sm">SIREN: {quote.company.siren}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CLIENT</h3>
              <p className="font-semibold text-blue-400">{quote.client.name}</p>
              <p className="text-slate-400 text-sm">{quote.client.address}</p>
              <p className="text-slate-500 text-sm">SIREN: {quote.client.siren}</p>
            </div>
          </div>

          {/* Services Table */}
          <div className="rounded-lg overflow-hidden mb-6 border border-slate-700">
            <div className="bg-slate-800 px-4 py-3 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-1">Qté</div>
              <div className="col-span-7">Description</div>
              <div className="col-span-2 text-right">Prix unit.</div>
              <div className="col-span-2 text-right">Montant</div>
            </div>
            {quote.services.map((service, index) => (
              <div
                key={service.id}
                className={`px-4 py-3 grid grid-cols-12 gap-2 text-sm ${
                  index !== quote.services.length - 1 ? 'border-b border-slate-700' : ''
                }`}
              >
                <div className="col-span-1 text-slate-300">{service.quantity}</div>
                <div className="col-span-7 text-blue-300">{service.description}</div>
                <div className="col-span-2 text-right text-slate-300">{formatCurrency(service.unitPrice)}</div>
                <div className="col-span-2 text-right text-white font-medium">{formatCurrency(service.amount)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total HT</span>
                <span className="text-white">{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discount?.value > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Remise</span>
                  <span className="text-emerald-400">
                    -{quote.discount.type === "percentage"
                      ? formatCurrency(quote.subtotal * quote.discount.value / 100)
                      : formatCurrency(quote.discount.value)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Acompte ({quote.deposit}%)</span>
                <span className="text-white">{formatCurrency(quote.totalAmount * quote.deposit / 100)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-700">
                <span className="text-white">Total TTC</span>
                <span className="text-blue-400">{formatCurrency(quote.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Account */}
          {quote.paymentAccount && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Coordonnées bancaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-blue-400 font-medium">IBAN : </span>
                  <span className="text-slate-300">{quote.paymentAccount.iban}</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">BIC : </span>
                  <span className="text-slate-300">{quote.paymentAccount.bic}</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">Titulaire : </span>
                  <span className="text-slate-300">{quote.paymentAccount.accountHolder}</span>
                </div>
              </div>
            </div>
          )}

          {/* Conditions */}
          <div className="text-sm text-slate-400 space-y-1">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <span className="text-slate-500">Délai de livraison : </span>
                <span className="text-slate-300">{quote.deliveryTime}</span>
              </div>
              <div>
                <span className="text-slate-500">Validité du devis : </span>
                <span className="text-slate-300">
                  {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
            {quote.paymentTerms && (
              <div>
                <span className="text-slate-500">Conditions de paiement : </span>
                <span className="text-slate-300">{quote.paymentTerms}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Signature Section - Light Card */}
        {step === "preview" && (
          <Card className="p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <PenLine className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-600">Signer le devis</h2>
                <p className="text-sm text-slate-500">Entrez votre nom pour signer électroniquement</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 text-base bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 text-base bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Votre adresse email pour recevoir la confirmation"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Signature Preview */}
            {(firstName || lastName) && (
              <div className="mb-6 py-8 px-6 bg-slate-100 rounded-xl text-center">
                <p className="text-xs text-slate-400 mb-3">Aperçu de votre signature</p>
                <p
                  className="text-3xl text-slate-700 italic"
                  style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                >
                  {firstName} {lastName}
                </p>
              </div>
            )}

            <Button
              onClick={handleSign}
              disabled={!firstName.trim() || !lastName.trim() || !email.trim() || isSigning}
              className="w-full h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Validation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Accepter et signer le devis
                </>
              )}
            </Button>

            <p className="text-xs text-slate-400 text-center mt-4">
              En cliquant sur ce bouton, vous acceptez les conditions du devis et confirmez votre engagement.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
