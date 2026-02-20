'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { DOC_TYPE_LABELS } from '@/hooks/useDocumentSave';
import { formatDateShort } from '@/lib/storage';
import SignedBadge from '@/components/SignedBadge';
import SwipeableItem from '@/components/SwipeableItem';
import PullToRefresh from '@/components/PullToRefresh';
import Link from 'next/link';

interface ArchivedDoc {
  id: string;
  doc_type: string;
  title: string;
  data: Record<string, unknown>;
  employee_id: string | null;
  signed: boolean;
  signed_at: string | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function ArchivePage() {
  const { company, loading: authLoading } = useAuth();
  const [docs, setDocs] = useState<ArchivedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const supabase = createClient();

  const loadDocs = useCallback(async () => {
    if (!company) return;
    setLoading(true);

    let query = supabase
      .from('documents')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('doc_type', filter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('서류 로드 실패:', error);
    } else {
      setDocs(data || []);
    }
    setLoading(false);
  }, [company, filter, supabase]);

  useEffect(() => {
    if (!authLoading && company) loadDocs();
  }, [authLoading, company, loadDocs]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      setDocs(prev => prev.filter(d => d.id !== id));
      setDeleteConfirm(null);
    }
  };

  // 필터된 결과
  const filteredDocs = searchQuery
    ? docs.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (DOC_TYPE_LABELS[d.doc_type] || '').includes(searchQuery)
      )
    : docs;

  // 서류 유형별 통계
  const typeCounts: Record<string, number> = {};
  docs.forEach(d => {
    typeCounts[d.doc_type] = (typeCounts[d.doc_type] || 0) + 1;
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleRefresh = async () => {
    await loadDocs();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            <span className="text-3xl">🗄️</span> 서류 보관함
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            생성한 서류를 안전하게 보관하고 언제든 다시 확인하세요
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--text)]">{docs.length}</p>
          <p className="text-xs text-[var(--text-muted)]">보관 서류</p>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="서류명 또는 유형으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <span className="absolute left-3 top-3 text-[var(--text-muted)]">🔍</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="all">전체 서류</option>
          {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
            typeCounts[key] ? (
              <option key={key} value={key}>{label} ({typeCounts[key]})</option>
            ) : null
          ))}
        </select>
      </div>

      {/* 서류 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-medium text-[var(--text)]">보관된 서류가 없습니다</p>
          <p className="text-[var(--text-muted)] mt-2 mb-6">서류를 작성한 후 &quot;보관함에 저장&quot; 버튼으로 보관하세요</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contract/fulltime" className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90">
              📋 근로계약서 작성
            </Link>
            <Link href="/documents/certificate" className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90">
              📜 재직증명서 작성
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => (
            <SwipeableItem
              key={doc.id}
              onDelete={() => {
                if (doc.signed) return;
                setDeleteConfirm(doc.id);
              }}
              disabled={doc.signed}
            >
              <div
                className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(30,58,95,0.08)] flex items-center justify-center text-lg">
                    {getDocIcon(doc.doc_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[var(--text)]">
                        {doc.signed && <span className="mr-1">🔒</span>}
                        {doc.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(30,58,95,0.08)] text-[var(--primary)] font-medium">
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDateShort(doc.created_at.split('T')[0])}
                      </span>
                      {doc.signed && doc.signed_at && (
                        <SignedBadge
                          signedAt={doc.signed_at}
                          signatureUrl={doc.signature_url}
                          compact
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.signed && doc.signed_at && (
                    <SignedBadge signedAt={doc.signed_at} signatureUrl={doc.signature_url} />
                  )}
                  {deleteConfirm === doc.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 touch-target"
                      >
                        확인
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--bg)] touch-target"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      disabled={doc.signed}
                      className="hidden md:inline-flex px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={doc.signed ? '서명된 서류는 삭제할 수 없습니다' : ''}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </SwipeableItem>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}

function getDocIcon(docType: string): string {
  const icons: Record<string, string> = {
    contract_fulltime: '📋', contract_parttime: '📋', contract_freelancer: '📋',
    certificate: '📜', career_certificate: '📜',
    payslip: '💵', wage_ledger: '📊', retirement_pay: '💰',
    annual_leave: '🏖️', annual_leave_notice: '📬', leave_application: '🏖️', reinstatement: '🔄',
    attendance: '🕐', overtime: '⏰', work_hours_change: '🕐', remote_work: '🏠', business_trip: '✈️',
    warning_letter: '⚠️', disciplinary_notice: '🔴', termination_notice: '❌',
    personnel_card: '👤', probation_eval: '📝', training_record: '🎓', handover: '🤝',
    privacy_consent: '🔒', nda: '🤫', pledge: '✍️', side_job_permit: '📄', resignation: '📤',
    work_rules: '📖',
  };
  return icons[docType] || '📄';
}
