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

    const hasPayment = validationUrl?.includes("withPayment=true");

    const htmlContent = buildEmailHtml({
      message,
      companyName: invoice?.company?.name || "",
      companyLogo: invoice?.company?.logo || undefined,
      companyAddress: invoice?.company?.address || "",
      companySiren: invoice?.company?.siren || "",
      documentType: "billing",
      documentNumber: invoice?.number || "",
      validationUrl,
      withPayment: hasPayment,
      attachmentName: attachment?.filename,
    });

    const response = await resend.emails.send({
      from: "Dev4Ecom <contact@dev4com.com>",
      to: email,
      subject,
      html: htmlContent,
      attachments,
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
