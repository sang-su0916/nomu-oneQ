'use client';

import { useState } from 'react';

interface SignedBadgeProps {
  signedAt: string;
  signatureUrl?: string | null;
  compact?: boolean;
}

export default function SignedBadge({ signedAt, signatureUrl, compact = false }: SignedBadgeProps) {
  const [showPreview, setShowPreview] = useState(false);

  const dateStr = new Date(signedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
        ✅ 서명완료
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => signatureUrl && setShowPreview(true)}
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium transition-colors ${
          signatureUrl ? 'hover:bg-green-100 cursor-pointer' : 'cursor-default'
        }`}
      >
        <span>✅</span>
        <span>전자서명 완료</span>
        <span className="text-green-500">{dateStr}</span>
        {signatureUrl && <span className="text-green-400 text-[10px]">🔍</span>}
      </button>

      {/* 서명 미리보기 모달 */}
      {showPreview && signatureUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>
            <p className="text-sm font-medium text-gray-700 mb-3">📝 전자서명 이미지</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <img
                src={signatureUrl}
                alt="전자서명"
                className="w-full h-auto"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              서명일시: {new Date(signedAt).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
