import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  await resend.emails.send({
    from: "Fazzmi <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
};