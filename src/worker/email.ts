/**
 * Envío de emails transaccionales vía Resend API.
 * https://resend.com/docs/api-reference/emails/send-email
 */

interface EmailEnv {
  RESEND_API_KEY: string;
  FROM_EMAIL?: string;
  APP_BASE_URL?: string;
}

const RESEND_API = "https://api.resend.com/emails";

async function send(
  env: EmailEnv,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const from = env.FROM_EMAIL ?? "Split Fun PRO <onboarding@resend.dev>";
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

export async function sendVerificationEmail(
  env: EmailEnv,
  to: string,
  token: string
): Promise<void> {
  const base = env.APP_BASE_URL ?? "https://split-fun-pro.pages.dev";
  const link = `${base}/verify-email?token=${token}`;

  await send(
    env,
    to,
    "Verifica tu cuenta en Split Fun PRO",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#111">¡Bienvenido a Split Fun PRO!</h2>
      <p style="color:#444">Haz clic en el botón para confirmar tu correo electrónico y activar tu cuenta:</p>
      <a href="${link}"
         style="display:inline-block;background:#22c55e;color:#fff;padding:12px 28px;
                border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Verificar correo
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Este enlace expira en 24 horas.<br>
        Si no creaste una cuenta en Split Fun PRO, ignora este correo.
      </p>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(
  env: EmailEnv,
  to: string,
  token: string
): Promise<void> {
  const base = env.APP_BASE_URL ?? "https://split-fun-pro.pages.dev";
  const link = `${base}/reset-password?token=${token}`;

  await send(
    env,
    to,
    "Restablece tu contraseña en Split Fun PRO",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#111">Restablecer contraseña</h2>
      <p style="color:#444">Recibimos una solicitud para cambiar tu contraseña. Haz clic en el botón para continuar:</p>
      <a href="${link}"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;
                border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Restablecer contraseña
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Este enlace expira en 1 hora.<br>
        Si no solicitaste esto, ignora este correo — tu contraseña no cambiará.
      </p>
    </div>
    `
  );
}
