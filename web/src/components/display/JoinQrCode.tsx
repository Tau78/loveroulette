"use client";

import { QRCodeSVG } from "qrcode.react";

interface JoinQrCodeProps {
  url: string;
  size?: number;
  className?: string;
  showUrl?: boolean;
}

export function JoinQrCode({
  url,
  size = 280,
  className,
  showUrl = true,
}: JoinQrCodeProps) {
  return (
    <div
      className={
        className ??
        "inline-flex flex-col items-center gap-4 rounded-2xl border border-white/15 bg-white p-6 shadow-[0_0_40px_rgba(233,30,140,0.25)]"
      }
    >
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#1a0308"
        includeMargin={false}
      />
      {showUrl ? (
        <p className="text-sm text-black/50 font-mono tracking-wide max-w-[280px] truncate">
          {url.replace(/^https?:\/\//, "")}
        </p>
      ) : null}
    </div>
  );
}
