"use client";

import { EmailDialog as BaseEmailDialog } from "../shared/email-dialog";
import { Invoice } from "@/app/types";

interface QuoteEmailDialogProps {
  invoice: Invoice;
  onEmailSent: () => void;
}

export function QuoteEmailDialog({ invoice, onEmailSent }: QuoteEmailDialogProps) {
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
Pour accepter ce devis, vous pouvez simplement répondre à cet email avec votre confirmation. Si vous avez des questions ou souhaitez des modifications, n'hésitez pas à me contacter.

Je reste à votre disposition pour tout complément d'information.

Cordialement,
${invoice.company.name}
${invoice.company.address}
SIREN : ${invoice.company.siren}
        `.trim()
      }}
    />
  );
}