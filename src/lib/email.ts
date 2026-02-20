/**
 * 이메일 발송 유틸리티 (Nodemailer)
 * 
 * 환경변수:
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * - fallback: 환경변수 없으면 console.log으로 이메일 내용 출력 (개발용)
 */
import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  fallback?: boolean; // 개발용 console.log fallback 사용 여부
}

// SMTP 설정 확인
function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return {
    host,
    port: parseInt(port || '587', 10),
    secure: parseInt(port || '587', 10) === 465,
    auth: { user, pass },
  };
}

// Nodemailer 트랜스포터 (싱글턴)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const config = getSmtpConfig();
  if (!config) return null;

  transporter = nodemailer.createTransport(config);
  return transporter;
}

/**
 * 이메일 발송
 * - SMTP 설정이 있으면 실제 발송
 * - 없으면 console.log fallback (개발용)
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@nomu-oneq.com';
  const transport = getTransporter();

  // fallback: SMTP 미설정 시 콘솔 출력
  if (!transport) {
    console.log('═══════════════════════════════════════');
    console.log('📧 [EMAIL FALLBACK - SMTP 미설정]');
    console.log(`To: ${options.to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${options.subject}`);
    console.log('───────────────────────────────────────');
    console.log(options.text || '(HTML only)');
    console.log('═══════════════════════════════════════');
    return { success: true, fallback: true, messageId: `fallback-${Date.now()}` };
  }

  try {
    const info = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('이메일 발송 실패:', message);
    return { success: false, error: message };
  }
}

/**
 * 다수 수신자에게 이메일 일괄 발송
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const to of recipients) {
    const result = await sendEmail({ to, subject, html, text });
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${to}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}
