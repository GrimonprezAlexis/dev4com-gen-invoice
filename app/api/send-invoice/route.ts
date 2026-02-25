import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildEmailHtml } from "@/lib/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, subject, message, attachment, validationUrl, invoice } =
      await request.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        {
          error: {
            statusCode: 400,
            message: "Email, subject, and message are required",
            name: "validation_error",
          },
        },
        { status: 400 }
      );
    }

    const attachments = attachment
      ? [
          {
            filename: attachment.filename,
            content: Buffer.from(attachment.content, "base64"),
          },
        ]
      : undefined;

    let companyLogo: string | undefined = invoice?.company?.logo || undefined;
    const logoAttachments: { filename: string; content: Buffer; content_id: string }[] = [];

    if (companyLogo?.startsWith("data:")) {
      const match = companyLogo.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const [, mimeType, base64Content] = match;
        const ext = mimeType.split("/")[1] || "png";
        logoAttachments.push({
          filename: `logo.${ext}`,
          content: Buffer.from(base64Content, "base64"),
          content_id: "company-logo",
        });
        companyLogo = "cid:company-logo";
      }
    }

    const hasPayment = validationUrl?.includes("withPayment=true");

    const htmlContent = buildEmailHtml({
      message,
      companyName: invoice?.company?.name || "",
      companyLogo,
      companyAddress: invoice?.company?.address || "",
      companySiren: invoice?.company?.siren || "",
      billingCountry: invoice?.billingCountry,
      showSiren: invoice?.showSiren,
      documentType: "quote",
      documentNumber: invoice?.number || "",
      validationUrl,
      withPayment: hasPayment,
      attachmentName: attachment?.filename,
    });

    const allAttachments = [...(attachments ?? []), ...logoAttachments];

    const response = await resend.emails.send({
      from: "Dev4Ecom <noreply@dev4com.com>",
      to: email,
      subject,
      html: htmlContent,
      attachments: allAttachments.length ? allAttachments : undefined,
    });

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 403 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Email send error:", error);

    return NextResponse.json(
      {
        error: {
          statusCode: 500,
          message: error?.message || "Failed to send email",
          name: "send_error",
          details: error?.response?.data || null,
        },
      },
      { status: 500 }
    );
  }
}
