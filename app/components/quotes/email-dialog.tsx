"use client";

import { EmailDialog as BaseEmailDialog } from "../shared/email-dialog";
import { Invoice } from "@/app/types";

interface QuoteEmailDialogProps {
  invoice: Invoice;
  onEmailSent: () => void;
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://devis.dev4com.com";
};

export function QuoteEmailDialog({ invoice, onEmailSent }: QuoteEmailDialogProps) {
  const validationUrl = `${getBaseUrl()}/validation/${invoice.id}`;

  return (
    <BaseEmailDialog
      document={invoice}
      type="quote"
      onEmailSent={onEmailSent}
      emailTemplate={{
        from: "contact@dev4com.com",
        subject: `Devis ${invoice.number} - ${invoice.company.name}`,
        defaultMessage: `
Bonjour,

Vous trouverez ci-joint notre devis ${invoice.number} détaillant notre proposition commerciale pour votre besoin.

Pour accepter et signer électroniquement ce devis, cliquez sur le bouton ci-dessous :

[VALIDATION_BUTTON]

Je reste à votre disposition pour tout complément d'information.

Cordialement,
${invoice.company.name}
${invoice.company.address}
SIREN : ${invoice.company.siren}
        `.trim()
      }}
      validationUrl={validationUrl}
    />
  );
}