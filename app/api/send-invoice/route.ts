import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, subject, message, attachment } = await request.json();

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

    const response = await resend.emails.send({
      from: "Dev4Ecom <contact@dev4com.com>",
      to: email,
      subject: subject,
      html: message.replace(/\n/g, '<br>'),
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