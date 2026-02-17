"use client";

import { EmailDialog as BaseEmailDialog } from "../shared/email-dialog";
import { BillingInvoice } from "@/app/types";

interface BillingEmailDialogProps {
  invoice: BillingInvoice;
  onEmailSent: () => void;
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://devis.dev4com.com";
};

export function BillingEmailDialog({ invoice, onEmailSent }: BillingEmailDialogProps) {
  const currencySymbol = invoice.currency === "CHF" ? "CHF" : "€";
  const finalAmount = invoice.showTax
    ? invoice.totalWithTax.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : invoice.totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dueDateStr = (() => {
    const d = (invoice.dueDate as any)?.toDate
      ? (invoice.dueDate as any).toDate()
      : new Date(invoice.dueDate);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
  })();

  const clientFirstName = invoice.client.name.split(" ")[0];
  const validationUrl = `${getBaseUrl()}/validation/${invoice.id}?type=billing`;

  return (
    <BaseEmailDialog
      document={invoice}
      type="billing"
      onEmailSent={onEmailSent}
      emailTemplate={{
        from: "contact@dev4com.com",
        subject: `Facture ${invoice.number} - ${invoice.company.name}`,
        defaultMessage: `Bonjour${clientFirstName ? ` ${clientFirstName}` : ""},

Veuillez trouver ci-joint la facture ${invoice.number} d'un montant de ${finalAmount} ${currencySymbol}${invoice.showTax ? " TTC" : ""}${dueDateStr ? `, payable avant le ${dueDateStr}` : ""}.

Pour régler cette facture en ligne par carte bancaire, cliquez sur le bouton ci-dessous :

[VALIDATION_BUTTON]

Ce fut un plaisir de collaborer avec vous sur ce projet, merci pour votre confiance.

Je reste disponible si vous avez la moindre question.

Bien cordialement,
${invoice.company.name}`,
        defaultMessageWithoutPayment: `Bonjour${clientFirstName ? ` ${clientFirstName}` : ""},

Veuillez trouver ci-joint la facture ${invoice.number} d'un montant de ${finalAmount} ${currencySymbol}${invoice.showTax ? " TTC" : ""}${dueDateStr ? `, payable avant le ${dueDateStr}` : ""}.

Ce fut un plaisir de collaborer avec vous sur ce projet, merci pour votre confiance.

Je reste disponible si vous avez la moindre question.

Bien cordialement,
${invoice.company.name}`,
      }}
      validationUrl={validationUrl}
    />
  );
}
