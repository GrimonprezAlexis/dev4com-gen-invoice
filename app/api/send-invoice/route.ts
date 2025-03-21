import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, subject, message, invoice } = await request.json();

    const response = await resend.emails.send({
      from: "Dev4Ecom <devis@dev4ecom.com>",
      to: email,
      subject: subject,
      html: message.replace(/\n/g, '<br>'),
      attachments: [
        {
          filename: `devis-${invoice.number}.pdf`,
          content: Buffer.from("PDF content here"), // You'll need to generate the PDF here
        },
      ],
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}