'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { checkAllNotifications, type NotificationItem } from '@/lib/notification-checker';
import type { DbEmployee } from '@/types/database';

export default function NotificationWidget() {
  const { company } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    loadNotifications();
  }, [company]);

  const loadNotifications = async () => {
    if (!company) return;
    try {
      // 직원 데이터
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', company.id);

      // 서류 데이터 (계약 종료일, NDA 등)
      const { data: documents } = await supabase
        .from('documents')
        .select('employee_id, doc_type, data, created_at')
        .eq('company_id', company.id);

      const allItems = checkAllNotifications(
        (employees || []) as DbEmployee[],
        documents as { employee_id: string; doc_type: string; data: Record<string, unknown>; created_at: string }[] | undefined
      );

      setItems(allItems);
    } catch (err) {
      console.error('알림 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (items.length === 0) return null;

  const criticalItems = items.filter(i => i.urgency === 'critical');
  const warningItems = items.filter(i => i.urgency === 'warning');
  const displayItems = expanded ? items : items.slice(0, 3);

  const typeIcon: Record<string, string> = {
    contract_expiry: '⚠️',
    probation_end: '📋',
    annual_leave_notice: '📬',
    nda_renewal: '🔒',
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden mb-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <h3 className="font-bold text-[var(--text)]">알림</h3>
          {criticalItems.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              긴급 {criticalItems.length}
            </span>
          )}
          {warningItems.length > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
              주의 {warningItems.length}
            </span>
          )}
        </div>
        <Link href="/notifications" className="text-sm text-[var(--primary)] hover:underline">
          전체 보기 →
        </Link>
      </div>

      {/* 알림 목록 */}
      <div className="divide-y divide-[var(--border)]">
        {displayItems.map((item, idx) => (
          <Link
            key={`${item.type}-${item.employeeId}-${idx}`}
            href={item.actionUrl}
            className="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--bg)] transition-colors"
          >
            <span className="text-lg mt-0.5 shrink-0">{typeIcon[item.type] || '📌'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{item.message}</p>
            </div>
            <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
              item.urgency === 'critical' ? 'bg-red-100 text-red-600' :
              item.urgency === 'warning' ? 'bg-yellow-100 text-yellow-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              D-{item.daysLeft}
            </span>
          </Link>
        ))}
      </div>

      {/* 더보기 */}
      {items.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors border-t border-[var(--border)]"
        >
          {expanded ? '접기 ▲' : `${items.length - 3}개 더 보기 ▼`}
        </button>
      )}
    </div>
  );
}
