import nodemailer from "nodemailer";

// Envoi d'email transactionnel via le relais SMTP de Brevo (serveur uniquement).
export async function sendEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const login = process.env.BREVO_SMTP_LOGIN;
  const smtpKey = process.env.BREVO_SMTP_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Misstice";
  if (!login || !smtpKey || !senderEmail) {
    throw new Error("Configuration SMTP Brevo incomplète.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user: login, pass: smtpKey },
  });

  // Anti-injection d'en-tête : pas de CR/LF dans le sujet ni les noms.
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

  await transporter.sendMail({
    from: `"${oneLine(senderName)}" <${senderEmail}>`,
    to: opts.toName ? `"${oneLine(opts.toName)}" <${opts.to}>` : opts.to,
    replyTo: senderEmail,
    subject: oneLine(opts.subject),
    html: opts.html,
    text: opts.text,
  });
}

// Gabarit d'email Misstice (entête violet + contenu).
export function emailShell(bodyHtml: string): string {
  return `
  <div style="margin:0;padding:24px;background:#FAFAF9;font-family:Segoe UI,Arial,sans-serif;color:#1E1B2E">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eee">
      <div style="background:#6C3CE1;padding:22px 28px">
        <span style="color:#fff;font-size:20px;font-weight:700">Misstice</span>
      </div>
      <div style="padding:28px">${bodyHtml}</div>
    </div>
  </div>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export function escapeAttr(s: string): string {
  return escapeHtml(s);
}
