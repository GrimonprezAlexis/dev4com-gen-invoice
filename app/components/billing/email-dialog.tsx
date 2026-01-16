"use client";

import { EmailDialog as BaseEmailDialog } from "../shared/email-dialog";
import { BillingInvoice } from "@/app/types";

interface BillingEmailDialogProps {
  invoice: BillingInvoice;
  onEmailSent: () => void;
}

export function BillingEmailDialog({ invoice, onEmailSent }: BillingEmailDialogProps) {
  return (
    <BaseEmailDialog
      document={invoice}
      type="billing"
      onEmailSent={onEmailSent}
      emailTemplate={{
        from: "contact@dev4com.com",
        subject: `Facture ${invoice.number} - ${invoice.company.name}`,
        defaultMessage: `
Hello,

Vous trouverez ci-joint la facture ${invoice.number} correspondant à votre commande.

Résumé de la facture :
• Montant HT : ${invoice.totalAmount.toLocaleString('fr-FR')} €
• TVA (${invoice.taxRate}%) : ${invoice.taxAmount.toLocaleString('fr-FR')} €
• Montant TTC : ${invoice.totalWithTax.toLocaleString('fr-FR')} €
• Date d'échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}

Si vous avez des questions concernant cette facture, n'hésitez pas à me contacter.

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