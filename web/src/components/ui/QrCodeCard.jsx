import { useMemo } from 'react';
import { QrCode, Copy, Check, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

/**
 * Generates a deterministic 15x15 QR-style matrix SVG from a patient's qr_code_hash
 * so every patient has an immediate visual QR pass card without external network calls.
 */
function buildMatrixFromCode(code = 'VABC') {
  const size = 15;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let hash = 2166136261;
  for (let i = 0; i < code.length; i += 1) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const charCode = code.charCodeAt((r * size + c) % code.length) || 65;
      const bit = ((hash >>> ((r + c) % 24)) ^ charCode ^ (r * 17 + c * 31)) & 1;
      grid[r][c] = Boolean(bit);
    }
  }

  return grid;
}

export function QrCodeCard({ patient, onCheckIn }) {
  const [copied, setCopied] = useState(false);
  const qrToken = patient?.qr_code_hash || 'VABC-UNKNOWN';
  const matrix = useMemo(() => buildMatrixFromCode(qrToken), [qrToken]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-slate-50 p-4 shadow-sm">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 shadow-inner">
          <svg viewBox="0 0 15 15" className="h-full w-full" aria-label={`QR Code ${qrToken}`}>
            {matrix.map((row, rIdx) =>
              row.map((cell, cIdx) =>
                cell ? (
                  <rect
                    key={`${rIdx}-${cIdx}`}
                    x={cIdx}
                    y={rIdx}
                    width="0.92"
                    height="0.92"
                    rx="0.12"
                    fill="#0f172a"
                  />
                ) : null
              )
            )}
          </svg>
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
            <QrCode className="h-3.5 w-3.5" />
            <span>Victorio ABC Patient Digital QR Pass</span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{patient?.full_name}</p>
            <p className="text-xs text-slate-500">
              Brgy. {patient?.barangay}, {patient?.municipality || 'San Jose del Monte'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <code className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-900">
              {qrToken}
            </code>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy QR Token'}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              <span>Print Pass</span>
            </Button>
            {onCheckIn && (
              <Button variant="primary" size="sm" onClick={() => onCheckIn(patient)}>
                Check In to Queue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
