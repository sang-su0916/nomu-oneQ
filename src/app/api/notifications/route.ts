import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications — 알림 목록 조회
 * PATCH /api/notifications — 알림 읽음 처리
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!companyId) return NextResponse.json({ error: 'company_id 필수' }, { status: 400 });

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await request.json();
  const { notificationIds, markAllRead, companyId } = body;

  if (markAllRead && companyId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('company_id', companyId)
      .eq('is_read', false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (notificationIds && Array.isArray(notificationIds)) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'notificationIds 또는 markAllRead + companyId 필수' }, { status: 400 });
}
