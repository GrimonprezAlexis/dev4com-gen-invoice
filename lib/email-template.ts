interface EmailTemplateOptions {
  message: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companySiren?: string;
  billingCountry?: string;
  showSiren?: boolean;
  documentType: "quote" | "billing";
  documentNumber: string;
  validationUrl?: string;
  withPayment?: boolean;
  attachmentName?: string;
}

function getButtonLabel(
  documentType: "quote" | "billing",
  withPayment: boolean
): string {
  if (documentType === "quote") {
    return withPayment
      ? "Accepter et payer"
      : "Accepter";
  }
  return "R\u00e9gler cette facture";
}

function buildButtonHtml(url: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding: 12px 0 4px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="#0f172a" style="background-color: #0f172a; border-radius: 6px; mso-padding-alt: 0;">
<!--[if mso]><i style="letter-spacing: 36px; mso-font-width: -100%; mso-text-raise: 27pt;">&nbsp;</i><![endif]-->
<a href="${url}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.01em; mso-padding-alt: 0;">${label} &rarr;</a>
<!--[if mso]><i style="letter-spacing: 36px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
</td>
</tr>
</table>
</td>
</tr>
</table>`;
}

function processMessageToHtml(message: string, buttonHtml: string): string {
  const parts = message.split("[VALIDATION_BUTTON]");

  const processTextBlock = (text: string): string => {
    return text
      .split("\n\n")
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        const htmlLines = trimmed.replace(/\n/g, "<br>");
        return `<p style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #1e293b;">${htmlLines}</p>`;
      })
      .filter(Boolean)
      .join("\n");
  };

  if (parts.length === 1) {
    return processTextBlock(parts[0]);
  }

  return parts
    .map((part, i) => {
      const processed = processTextBlock(part);
      if (i < parts.length - 1) {
        return processed + "\n" + buttonHtml;
      }
      return processed;
    })
    .join("\n");
}

export function buildEmailHtml(options: EmailTemplateOptions): string {
  const {
    message,
    companyName,
    companyLogo,
    companyAddress,
    companySiren,
    showSiren,
    documentType,
    documentNumber,
    validationUrl,
    withPayment = false,
    attachmentName,
  } = options;

  const typeLabel = documentType === "billing" ? "Facture" : "Devis";
  const refLabel = documentNumber
    ? `${typeLabel} ${documentNumber}`
    : typeLabel;

  const buttonHtml = validationUrl
    ? buildButtonHtml(
        validationUrl,
        getButtonLabel(documentType, withPayment)
      )
    : "";

  const contentHtml = processMessageToHtml(message, buttonHtml);

  const footerParts = [companyName];
  if (companyAddress) footerParts.push(companyAddress);
  if (companySiren && showSiren === true) footerParts.push(`SIREN ${companySiren}`);
  const footerLine = footerParts.filter(Boolean).join(" &middot; ");

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${refLabel}</title>
<!--[if mso]>
<style type="text/css">
body, table, td, p, a { font-family: Segoe UI, Helvetica, Arial, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f4f0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f4f0;">
<tr>
<td align="center" style="padding: 48px 24px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

<!-- Accent bar -->
<tr>
<td height="3" bgcolor="#0f172a" style="height: 3px; background-color: #0f172a; font-size: 0; line-height: 0;">&nbsp;</td>
</tr>

<!-- Card -->
<tr>
<td bgcolor="#ffffff" style="background-color: #ffffff; border-left: 1px solid #e8e6e1; border-right: 1px solid #e8e6e1;">

<!-- Header -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding: 32px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
${companyLogo ? `<td valign="middle" style="vertical-align: middle; padding-right: 12px;">
<img src="${companyLogo}" width="40" height="40" alt="${companyName || ''}" style="display: block; width: 40px; height: 40px; object-fit: contain; border-radius: 6px;" />
</td>` : ""}
<td valign="middle" style="vertical-align: middle;">
<p style="margin: 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">${companyName || ""}</p>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding: 10px 40px 20px;">
<span style="display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; background-color: #f5f4f0; padding: 5px 12px; border-radius: 3px;">${refLabel}</span>
</td>
</tr>
<tr>
<td style="padding: 0 40px;">
<div style="height: 1px; background-color: #e8e6e1;"></div>
</td>
</tr>
</table>

<!-- Body -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding: 28px 40px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
${contentHtml}
</td>
</tr>
</table>

${
  attachmentName
    ? `<!-- Attachment -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding: 0 40px 28px;">
<div style="height: 1px; background-color: #e8e6e1; margin-bottom: 20px;"></div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding: 10px 16px; background-color: #f8f7f4; border: 1px solid #e8e6e1;">
<span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #64748b;">&#128206;&nbsp;&nbsp;${attachmentName}</span>
</td>
</tr>
</table>
</td>
</tr>
</table>`
    : ""
}

</td>
</tr>

<!-- Card bottom -->
<tr>
<td height="1" style="height: 1px; background-color: #e8e6e1; font-size: 0; line-height: 0;">&nbsp;</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding: 28px 40px;" align="center">
<p style="margin: 0 0 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #94a3b8; line-height: 1.5;">${footerLine}</p>
<p style="margin: 0 0 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #cbd5e1;">Envoy\u00e9 via <span style="color: #94a3b8;">Dev4Ecom</span></p>
<p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; color: #cbd5e1;">Ceci est un message automatique, merci de ne pas y r\u00e9pondre.</p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;
}
