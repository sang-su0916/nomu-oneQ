'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  width?: number;
  height?: number;
  penColor?: string;
  penWidth?: number;
  label?: string;
}

export default function SignaturePad({
  onSign,
  width = 400,
  height = 200,
  penColor = '#1e3a5f',
  penWidth = 2.5,
  label,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Canvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 고해상도 지원
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 배경 흰색
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 서명 안내선
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // 안내 텍스트
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('여기에 서명하세요', width / 2, height / 2);
  }, [width, height]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, imageData]);
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 첫 획 시작 시 안내 텍스트 제거
    if (!hasSignature) {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      // 안내선 다시 그리기
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(20, height - 40);
      ctx.lineTo(width - 20, height - 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    saveHistory();
    setIsDrawing(true);
    setHasSignature(true);
    const point = getCanvasPoint(e);
    lastPoint.current = point;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [hasSignature, saveHistory, getCanvasPoint, penColor, penWidth, width, height]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getCanvasPoint(e);

    // 부드러운 곡선을 위한 quadratic curve
    if (lastPoint.current) {
      const midX = (lastPoint.current.x + point.x) / 2;
      const midY = (lastPoint.current.y + point.y) / 2;
      ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
    }

    lastPoint.current = point;
  }, [isDrawing, getCanvasPoint]);

  const stopDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 안내선 + 텍스트
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('여기에 서명하세요', width / 2, height / 2);

    setHasSignature(false);
    setHistory([]);
  }, [width, height]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastState = history[history.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setHistory(prev => prev.slice(0, -1));

    if (history.length <= 1) {
      setHasSignature(false);
    }
  }, [history]);

  const handleComplete = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // 투명 배경 PNG로 export
    const exportCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // 원본 캔버스 복사
    exportCtx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    onSign(dataUrl);
  }, [hasSignature, onSign]);

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
      )}
      <div
        className="relative border-2 border-dashed border-[var(--border)] rounded-xl overflow-hidden bg-white"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          style={{ width, height, touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↩️ 되돌리기
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          disabled={!hasSignature}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          🗑️ 지우기
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={!hasSignature}
          className="px-4 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          ✅ 서명 완료
        </button>
      </div>
    </div>
  );
}
