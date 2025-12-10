"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UI_STRINGS } from "@/lib/utils/constants";

export default function HomePage() {
  const [inviteCode, setInviteCode] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {UI_STRINGS.APP_TITLE}
            </h1>
            <p className="text-xs text-muted">
              {UI_STRINGS.APP_SUBTITLE}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle>{UI_STRINGS.HOW_IT_WORKS}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>1. {UI_STRINGS.INSTRUCTION_1}</p>
              <p>2. {UI_STRINGS.INSTRUCTION_2}</p>
              <p>3. {UI_STRINGS.INSTRUCTION_3}</p>
            </CardContent>
          </Card>

          {/* Create Group */}
          <Card>
            <CardHeader>
              <CardTitle>{UI_STRINGS.ROLE_LEADER}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Yeni bir sürüş grubu oluşturun ve diğer sürücüleri davet edin.
              </p>
              <Link href="/create">
                <Button size="lg" className="w-full">
                  {UI_STRINGS.CREATE_GROUP}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Join Group */}
          <Card>
            <CardHeader>
              <CardTitle>{UI_STRINGS.ROLE_RIDER}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Davet kodunu girerek mevcut bir gruba katılın.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inviteCode.trim()) {
                    window.location.href = `/join/${inviteCode.toUpperCase().trim()}`;
                  }
                }}
              >
                <Input
                  label={UI_STRINGS.INVITE_CODE_LABEL}
                  placeholder={UI_STRINGS.INVITE_CODE_PLACEHOLDER}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center tracking-widest"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={inviteCode.length < 6}
                >
                  {UI_STRINGS.JOIN_GROUP}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Privacy note */}
          <p className="text-center text-xs text-muted">
            Konum verileriniz sunucuda saklanmaz. Sadece gruptaki diğer cihazlarla doğrudan paylaşılır.
          </p>
        </div>
      </main>
    </div>
  );
}
