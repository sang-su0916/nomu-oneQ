import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-sm border border-[var(--border)]">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">페이지를 찾을 수 없습니다</h2>
          <p className="text-[var(--text-muted)] mb-6">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90"
            >
              대시보드로
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--bg)]"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
