"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface InviteShareProps {
  inviteCode: string;
  groupId?: string;
}

export function InviteShare({ inviteCode }: InviteShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

  // Generate QR code
  useEffect(() => {
    if (!canvasRef.current || !inviteUrl) return;

    QRCode.toCanvas(canvasRef.current, inviteUrl, {
      width: 150,
      margin: 2,
      color: {
        dark: "#e5e7eb",
        light: "#020617",
      },
    });
  }, [inviteUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MotoBunker - Gruba Katıl",
          text: `Sürüş grubumuza katıl! Davet kodu: ${inviteCode}`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sürücüleri Davet Et</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col items-center sm:items-start gap-4">
          {/* QR Code - Centered on mobile, right side on desktop */}
          <div className="flex-shrink-0 order-first sm:order-last">
            <p className="text-xs text-muted mb-1 text-center">QR Kod</p>
            <div className="rounded-lg border border-border p-2 bg-background">
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted mb-1">Davet Kodu</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-foreground">
                {inviteCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted mb-1">Davet Linki</p>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? "✓" : "Kopyala"}
                </Button>
              </div>
            </div>

            <Button onClick={handleShare} className="w-full">
              Davet Paylaş
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted text-center sm:text-left">
          Sürücüler bu linki açtığında veya QR kodu tarattığında grubunuza katılabilirler.
        </p>
      </CardContent>
    </Card>
  );
}
