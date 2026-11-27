import { useMemo, useState } from 'react';
import { QrCode, Copy, Check, Printer } from 'lucide-react';
import { Button } from './Button';
import { encodeQrMatrix } from '../../utils/qrEncoder';

export function QrCodeCard({ patient, onCheckIn }) {
  const [copied, setCopied] = useState(false);
  const qrToken = patient?.qr_code_hash || 'VABC-UNKNOWN';
  const matrix = useMemo(() => encodeQrMatrix(qrToken), [qrToken]);
  const qrSize = matrix.length;

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
    <div className="rounded-xl border border-[#7CD5C7] bg-gradient-to-br from-[#EAFBF8] via-white to-[#F2F2ED] p-4 shadow-sm">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-[#DDDCD4] bg-white p-2.5 shadow-inner">
          <svg
            viewBox={`0 0 ${qrSize} ${qrSize}`}
            className="h-full w-full"
            shapeRendering="crispEdges"
            aria-label={`QR Code ${qrToken}`}
          >
            {matrix.map((row, rIdx) =>
              row.map((cell, cIdx) =>
                cell ? (
                  <rect
                    key={`${rIdx}-${cIdx}`}
                    x={cIdx}
                    y={rIdx}
                    width="1"
                    height="1"
                    fill="#464B71"
                  />
                ) : null
              )
            )}
          </svg>
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/35 px-2.5 py-0.5 text-xs font-extrabold text-[#464B71]">
            <QrCode className="h-3.5 w-3.5 text-[#118AB2]" />
            <span>Victorio ABC Patient Digital QR Pass</span>
          </div>
          <div>
            <p className="text-base font-extrabold text-[#464B71]">{patient?.full_name}</p>
            <p className="text-xs text-[#464B71]/75">
              Brgy. {patient?.barangay}, {patient?.municipality || 'Bulacan'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <code className="rounded-lg border border-[#DDDCD4] bg-white px-2.5 py-1 font-mono text-xs font-extrabold tracking-wider text-[#464B71]">
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
