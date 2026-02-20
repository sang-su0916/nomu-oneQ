import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/send-email
 * 이메일 발송 API
 * 인증: SUPABASE_SERVICE_ROLE_KEY 또는 내부 호출
 */
export async function POST(request: NextRequest) {
  // 인증 확인
  const authHeader = request.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // service_role key 인증 또는 내부 호출 (localhost)
  const isInternal = request.headers.get('x-internal-call') === 'true'
    && (request.headers.get('host')?.startsWith('localhost') || request.headers.get('host')?.startsWith('127.0.0.1'));
  const isServiceRole = serviceKey && authHeader === `Bearer ${serviceKey}`;

  if (!isInternal && !isServiceRole) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'to, subject, html 필수' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html, text });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        fallback: result.fallback || false,
      });
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
