'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePlanGate } from '@/hooks/usePlanGate';
import UpgradeModal from '@/components/UpgradeModal';
import { checkAllNotifications, type NotificationItem } from '@/lib/notification-checker';
import type { DbEmployee } from '@/types/database';

interface NotificationSetting {
  type: string;
  label: string;
  description: string;
  icon: string;
  appEnabled: boolean;
  emailEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    type: 'contract_expiry',
    label: '근로계약서 만료',
    description: '계약 종료일 30일/7일 전 알림',
    icon: '📋',
    appEnabled: true,
    emailEnabled: true,
  },
  {
    type: 'probation_end',
    label: '수습 기간 만료',
    description: '입사일 + 3개월 수습 종료 알림',
    icon: '📝',
    appEnabled: true,
    emailEnabled: true,
  },
  {
    type: 'annual_leave_notice',
    label: '연차촉진 통보 시기',
    description: '연말 기준 연차촉진 통보 시기 알림',
    icon: '📬',
    appEnabled: true,
    emailEnabled: true,
  },
  {
    type: 'nda_renewal',
    label: '비밀유지서약서 갱신',
    description: '작성일 기준 1년 주기 갱신 알림',
    icon: '🔒',
    appEnabled: true,
    emailEnabled: true,
  },
];

interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  target_date: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const { user, company, loading } = useAuth();
  const planGate = usePlanGate();
  const router = useRouter();
  const supabase = createClient();

  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_SETTINGS);
  const [liveAlerts, setLiveAlerts] = useState<NotificationItem[]>([]);
  const [savedNotifications, setSavedNotifications] = useState<DbNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'history' | 'settings'>('alerts');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // 플랜 체크
  const canUseNotifications = planGate.canUseFeature('notifications') || planGate.plan !== 'free';
  const canUseEmail = planGate.plan === 'business' || planGate.plan === 'pro';

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    if (!company) { router.push('/onboarding'); return; }

    if (!canUseNotifications) {
      setShowUpgrade(true);
      setAlertsLoading(false);
      return;
    }

    loadData();
  }, [user, company, loading]);

  const loadData = useCallback(async () => {
    if (!company) return;

    // 저장된 설정 로드 (localStorage)
    const saved = localStorage.getItem(`nomu_notification_settings_${company.id}`);
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }

    // 실시간 알림 체크
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', company.id);

    const { data: documents } = await supabase
      .from('documents')
      .select('employee_id, doc_type, data, created_at')
      .eq('company_id', company.id);

    const alerts = checkAllNotifications(
      (employees || []) as DbEmployee[],
      documents as { employee_id: string; doc_type: string; data: Record<string, unknown>; created_at: string }[] | undefined
    );
    setLiveAlerts(alerts);

    // DB 알림 내역
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setSavedNotifications((notifs || []) as DbNotification[]);

    setAlertsLoading(false);
  }, [company, supabase]);

  const toggleSetting = (type: string, field: 'appEnabled' | 'emailEnabled') => {
    if (field === 'emailEnabled' && !canUseEmail) {
      setShowUpgrade(true);
      return;
    }
    setSettings(prev => {
      const updated = prev.map(s => s.type === type ? { ...s, [field]: !s[field] } : s);
      if (company) localStorage.setItem(`nomu_notification_settings_${company.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (!error) {
      setSavedNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!company) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('company_id', company.id)
      .eq('is_read', false);
    if (!error) {
      setSavedNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const typeIcon: Record<string, string> = {
    contract_expiry: '⚠️',
    probation_end: '📋',
    annual_leave_notice: '📬',
    nda_renewal: '🔒',
  };

  const unreadCount = savedNotifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">🔔 알림</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">서류 만료 및 갱신 알림을 관리합니다</p>
        </div>
        {!canUseNotifications && (
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            업그레이드 →
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-[var(--bg)] rounded-lg p-1">
        {([
          { key: 'alerts', label: '실시간 알림', badge: liveAlerts.length },
          { key: 'history', label: '알림 내역', badge: unreadCount },
          { key: 'settings', label: '알림 설정', badge: 0 },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              if (!canUseNotifications) { setShowUpgrade(true); return; }
              setActiveTab(tab.key);
            }}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[var(--bg-card)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                tab.key === 'alerts' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 실시간 알림 탭 */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alertsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : liveAlerts.length === 0 ? (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-[var(--text)] font-medium">알림이 없습니다</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">모든 서류가 최신 상태입니다</p>
            </div>
          ) : (
            liveAlerts.map((item, idx) => (
              <Link
                key={`${item.type}-${item.employeeId}-${idx}`}
                href={item.actionUrl}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                  item.urgency === 'critical'
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : item.urgency === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                    : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                <span className="text-2xl mt-0.5">{typeIcon[item.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[var(--text)] text-sm">{item.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      item.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                      item.urgency === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      D-{item.daysLeft}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{item.message}</p>
                </div>
                <svg className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          )}
        </div>
      )}

      {/* 알림 내역 탭 */}
      {activeTab === 'history' && (
        <div>
          {savedNotifications.length > 0 && unreadCount > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={markAllAsRead}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                모두 읽음 처리
              </button>
            </div>
          )}
          <div className="space-y-2">
            {savedNotifications.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-[var(--text)] font-medium">알림 내역이 없습니다</p>
              </div>
            ) : (
              savedNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                    notif.is_read
                      ? 'bg-[var(--bg)] border-[var(--border)] opacity-70'
                      : 'bg-[var(--bg-card)] border-[var(--border)]'
                  }`}
                >
                  <span className="text-lg mt-0.5">{typeIcon[notif.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.is_read ? 'text-[var(--text-muted)]' : 'text-[var(--text)] font-medium'}`}>
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{notif.message}</p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(notif.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs text-[var(--primary)] hover:underline shrink-0"
                    >
                      읽음
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 알림 설정 탭 */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {settings.map(setting => (
            <div key={setting.type} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{setting.icon}</span>
                  <div>
                    <h3 className="font-bold text-[var(--text)] text-sm">{setting.label}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{setting.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 ml-9">
                {/* 앱 내 알림 토글 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={setting.appEnabled}
                      onChange={() => toggleSetting(setting.type, 'appEnabled')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-[var(--primary)] transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">앱 알림</span>
                </label>
                {/* 이메일 알림 토글 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={setting.emailEnabled}
                      onChange={() => toggleSetting(setting.type, 'emailEnabled')}
                      className="sr-only peer"
                      disabled={!canUseEmail}
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors ${
                      !canUseEmail ? 'bg-gray-200 cursor-not-allowed' :
                      setting.emailEnabled ? 'bg-[var(--primary)]' : 'bg-gray-300'
                    }`} />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">
                    이메일
                    {!canUseEmail && (
                      <span className="text-xs text-orange-500 ml-1">(Business+)</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          ))}

          {/* 플랜 안내 */}
          <div className="bg-[var(--bg)] rounded-xl p-4 text-sm text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text)] mb-2">📌 플랜별 알림 기능</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>무료 플랜:</strong> 알림 기능 사용 불가</li>
              <li>• <strong>Starter 이상:</strong> 앱 내 알림</li>
              <li>• <strong>Business 이상:</strong> 앱 내 알림 + 이메일 알림</li>
            </ul>
          </div>
        </div>
      )}

      {/* 업그레이드 모달 */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="알림 기능은 유료 플랜에서 사용 가능합니다"
        message={
          !canUseNotifications
            ? 'Starter 이상 플랜에서 앱 내 알림을, Business 이상에서 이메일 알림을 사용할 수 있습니다.'
            : 'Business 이상 플랜에서 이메일 알림을 사용할 수 있습니다.'
        }
      />
    </div>
  );
}
