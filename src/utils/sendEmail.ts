import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  // Extract 6-digit OTP code from html if present for developer convenience
  const otpMatch = html.match(/>\s*(\d{6})\s*</) || html.match(/\b(\d{6})\b/);
  const extractedOtp = otpMatch ? otpMatch[1] : null;

  console.log("\n==================================================");
  console.log(`📧 [SIMULATED EMAIL]`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  if (extractedOtp) {
    console.log(`OTP Code: ${extractedOtp}`);
  }
  console.log("==================================================\n");

  try {
    // Send to dynamic recipient, fallback to info@blueweb2.com if empty
    const recipient = to || "info@blueweb2.com";
    
    await resend.emails.send({
      from: "Zenfaz <onboarding@resend.dev>",
      to: recipient,
      subject,
      html,
    });
  } catch (error) {
    console.error("⚠️ Resend email delivery failed (Logged to console instead):", error);
  }
};