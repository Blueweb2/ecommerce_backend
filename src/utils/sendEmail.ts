import nodemailer from "nodemailer";
import { env } from "../config/env";

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Fazzmi" <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};