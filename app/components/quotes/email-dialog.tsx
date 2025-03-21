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
        from: "devis@dev4ecom.com",
        subject: `Devis ${invoice.number} - ${invoice.company.name}`,
        defaultMessage: `
Cher client,

J'espère que ce message vous trouve bien. Je vous prie de trouver ci-joint notre devis ${invoice.number} détaillant notre proposition commerciale.

Résumé du devis :
• Montant total : ${invoice.totalAmount.toLocaleString('fr-FR')} €
${invoice.discount.value > 0 ? `• Remise appliquée : ${invoice.discount.type === 'percentage' ? `${invoice.discount.value}%` : `${invoice.discount.value.toLocaleString('fr-FR')} €`}\n` : ''}• Acompte demandé : ${invoice.deposit}% (${(invoice.totalAmount * invoice.deposit / 100).toLocaleString('fr-FR')} €)
• Délai de livraison : ${invoice.deliveryTime}
• Validité du devis : jusqu'au ${new Date(invoice.validUntil).toLocaleDateString()}

Services inclus :
${invoice.services.map(service => `• ${service.description} : ${service.quantity} × ${service.unitPrice.toLocaleString('fr-FR')} € = ${service.amount.toLocaleString('fr-FR')} €`).join('\n')}

Conditions de paiement :
${invoice.paymentTerms}

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