import { NextResponse } from "next/server";
import { Resend } from "resend";
import VerificationEmail from "@/components/email/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { to, url } = await request.json();

  if (!to || !url) {
    return NextResponse.json(
      { error: "Missing `to` or `url` field" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "SplitBuy <onboarding@resend.dev>",
      to: [to],
      subject: "Verify your email address",
      react: VerificationEmail({ url }),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
} 