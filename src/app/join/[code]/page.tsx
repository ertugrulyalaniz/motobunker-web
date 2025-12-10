"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UI_STRINGS } from "@/lib/utils/constants";

interface GroupInfo {
  id: string;
  inviteCode: string;
  name: string | null;
  leaderNickname: string;
  memberCount: number;
}

function generatePeerId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "peer-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function JoinGroupPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [peerId, setPeerId] = useState("");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate peer ID on mount
    setPeerId(generatePeerId());

    // Fetch group info
    async function fetchGroup() {
      try {
        const response = await fetch(`/api/groups/${code}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || UI_STRINGS.ERROR_INVALID_CODE);
        }
        const data = await response.json();
        setGroupInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : UI_STRINGS.ERROR_INVALID_CODE);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGroup();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError(UI_STRINGS.ERROR_NICKNAME_REQUIRED);
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch(`/api/groups/${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          peerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join group");
      }

      const group = await response.json();

      // Store group info in sessionStorage for the group page
      sessionStorage.setItem("currentGroup", JSON.stringify({
        ...group,
        role: "rider",
        myPeerId: peerId,
        myNickname: nickname.trim(),
      }));

      // Redirect to group page
      router.push(`/group/${group.id}`);
    } catch (err) {
      console.error("Error joining group:", err);
      setError(err instanceof Error ? err.message : "Failed to join group");
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Grup bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="px-4 py-3 border-b border-border">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/" className="text-muted hover:text-foreground transition-colors">
              &larr; Geri
            </Link>
            <h1 className="text-base font-semibold text-foreground">
              Grup Bulunamadı
            </h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="text-center py-8">
              <p className="text-error mb-4">{error}</p>
              <p className="text-muted mb-4">
                Bu davet kodu geçersiz veya grubun süresi dolmuş olabilir.
              </p>
              <Link href="/">
                <Button variant="secondary">Ana Sayfaya Dön</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-muted hover:text-foreground transition-colors">
            &larr; Geri
          </Link>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {UI_STRINGS.JOIN_GROUP}
            </h1>
            <p className="text-xs text-muted">
              Kod: {code.toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>
                {groupInfo.name || `${groupInfo.leaderNickname}'in Grubu`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted">
                <p>Lider: <span className="text-foreground">{groupInfo.leaderNickname}</span></p>
                <p>Katılımcı: <span className="text-foreground">{groupInfo.memberCount} kişi</span></p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={UI_STRINGS.NICKNAME_LABEL + " *"}
                  placeholder={UI_STRINGS.NICKNAME_PLACEHOLDER}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={50}
                  required
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-error">{error}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isJoining || !nickname.trim()}
                >
                  {isJoining ? "Katılınıyor..." : UI_STRINGS.JOIN_GROUP}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
