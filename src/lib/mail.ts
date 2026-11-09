import { Resend } from "resend";
import { BRAND } from "./brand";
const escape = (value: string | number) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
async function send(
  email: string,
  subject: string,
  title: string,
  body: string,
  action = "/dashboard",
  label = "Open your account",
) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw new Error("Cryptcona email is not configured.");
  const url = new URL(action, process.env.NEXT_PUBLIC_SITE_URL || BRAND.url)
    .href;
  const { error } = await new Resend(key).emails.send({
    from,
    to: email,
    subject: subject + " | " + BRAND.name,
    html: `<div style="background:#edf3ef;padding:32px;font-family:Arial,sans-serif;color:#192d21"><div style="max-width:560px;margin:auto;background:white;padding:32px;border-top:4px solid #46b584"><p style="font-size:20px;font-weight:bold">cryptcona <span style="font-size:12px">BROKER</span></p><h1 style="font-size:24px;margin-top:32px">${escape(title)}</h1><p style="font-size:15px;line-height:1.8;white-space:pre-line">${escape(body)}</p><a href="${escape(url)}" style="display:inline-block;background:#71efb2;color:#183124;padding:14px 24px;text-decoration:none;border-radius:6px;margin:20px 0">${escape(label)}</a><p style="font-size:12px;color:#68786e;border-top:1px solid #dce5de;padding-top:20px">Cryptcona Broker · cryptcona.pro</p></div></div>`,
  });
  if (error) throw new Error("Cryptcona email could not be delivered.");
}
async function notify(...args: Parameters<typeof send>) {
  try {
    await send(...args);
  } catch {
    console.error(
      "Cryptcona notification was not delivered. Check email configuration.",
    );
  }
}
export const sendPasswordResetEmail = (email: string, token: string) =>
  send(
    email,
    "Password reset",
    "Reset your password",
    "A password reset was requested for your account. This link expires in one hour. If this was not you, ignore this email.",
    "/reset-password?token=" + encodeURIComponent(token),
    "Reset password",
  );
export const sendVerificationEmail = (email: string, code: string) =>
  send(
    email,
    "Verify your email",
    "Your verification code",
    "Your code is: " + code + "\nThis code expires in 10 minutes.",
    "/verify",
    "Verify email",
  );
export const sendWelcomeEmail = (email: string, name: string) =>
  notify(
    email,
    "Welcome",
    "Welcome to Cryptcona",
    "Hello " + name + ", your account is ready.",
  );
export const sendDepositPendingEmail = (
  email: string,
  amount: string | number,
  method: string,
) =>
  notify(
    email,
    "Deposit submitted",
    "Your deposit is under review",
    "We received your deposit request for " +
      amount +
      " via " +
      method +
      ". Check your activity for updates.",
  );
export const sendDepositApprovedEmail = (
  email: string,
  amount: string | number,
) =>
  notify(
    email,
    "Deposit approved",
    "Deposit approved",
    "Your deposit of " + amount + " has been approved.",
  );
export const sendBalanceAddedEmail = (
  email: string,
  amount: string | number,
  currency: string,
) =>
  notify(
    email,
    "Account credit",
    "Your balance has been updated",
    amount + " " + currency + " has been added to your account.",
  );
export const sendCustomTemplateEmail = (
  email: string,
  subject: string,
  title: string,
  body: string,
) => send(email, subject, title, body);
export const sendChatPendingEmail = (email: string) =>
  notify(
    email,
    "New message",
    "You have a new message",
    "Your support team has sent you a message.",
    "/dashboard/chat",
    "Read message",
  );
