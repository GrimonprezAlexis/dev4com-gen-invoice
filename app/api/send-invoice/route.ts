import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, subject, message, attachment, validationUrl } = await request.json();

    // Validate input
    if (!email || !subject || !message) {
      return NextResponse.json(
        {
          error: {
            statusCode: 400,
            message: "Email, subject, and message are required",
            name: "validation_error"
          }
        },
        { status: 400 }
      );
    }

    // Prepare attachments if provided
    const attachments = attachment ? [{
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
    }] : undefined;

    // Create validation button HTML
    const validationButtonHtml = validationUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${validationUrl}"
           style="display: inline-block;
                  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                  color: white;
                  padding: 16px 40px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
                  transition: all 0.2s ease;">
          ✅ Accepter et signer le devis
        </a>
      </div>
    ` : '';

    // Replace placeholder with button
    let htmlContent = message.replace(/\n/g, '<br>');
    htmlContent = htmlContent.replace('[VALIDATION_BUTTON]', validationButtonHtml);

    const response = await resend.emails.send({
      from: "Dev4Ecom <contact@dev4com.com>",
      to: email,
      subject: subject,
      html: htmlContent,
      attachments,
    });

    // Handle Resend API errors
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 403 }
      );
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Email send error:", error);

    // Return detailed error information
    return NextResponse.json(
      {
        error: {
          statusCode: 500,
          message: error?.message || "Failed to send email",
          name: "send_error",
          details: error?.response?.data || null
        }
      },
      { status: 500 }
    );
  }
}