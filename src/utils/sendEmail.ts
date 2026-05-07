import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { env } from "../config/env";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  const config: SMTPTransport.Options = {
    host: "smtp.gmail.com",

    port: 587,

    secure: false,

    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },

    tls: {
      rejectUnauthorized: false,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  const transporter = nodemailer.createTransport(config);

  await transporter.verify();

  await transporter.sendMail({
    from: `"Fazzmi" <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};