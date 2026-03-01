'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRGenerator({ value, size = 200, label }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    }).then(url => setDataUrl(url)).catch(() => {});

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
      {label && <p className="text-xs text-gray-500 text-center">{label}</p>}
      {dataUrl && (
        <a
          href={dataUrl}
          download={`qr-${label || 'event'}.png`}
          className="text-xs text-indigo-600 hover:underline"
        >
          Download QR Code
        </a>
      )}
    </div>
  );
}
