'use client';

import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = '업그레이드가 필요합니다',
  message = '이 기능은 유료 플랜에서 사용할 수 있습니다.',
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-xl max-w-md w-full p-6 border border-[var(--border)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)] text-xl"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-2">{title}</h3>
          <p className="text-[var(--text-muted)] text-sm mb-6">{message}</p>

          <div className="space-y-3">
            <Link
              href="/pricing#license-code"
              className="block w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              onClick={onClose}
            >
              🔑 인증코드 입력하기
            </Link>
            <Link
              href="/pricing"
              className="block w-full py-3 border border-[var(--border)] text-[var(--text)] rounded-lg font-medium hover:border-[var(--primary)] transition-colors"
              onClick={onClose}
            >
              요금제 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
