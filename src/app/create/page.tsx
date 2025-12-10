"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UI_STRINGS } from "@/lib/utils/constants";

function generatePeerId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "peer-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CreateGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [nickname, setNickname] = useState("");
  const [peerId, setPeerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate peer ID on mount (client-side only)
    setPeerId(generatePeerId());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError(UI_STRINGS.ERROR_NICKNAME_REQUIRED);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName.trim() || null,
          leaderNickname: nickname.trim(),
          leaderPeerId: peerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create group");
      }

      const group = await response.json();

      // Store group info in sessionStorage for the group page
      sessionStorage.setItem("currentGroup", JSON.stringify({
        ...group,
        role: "leader",
        myPeerId: peerId,
        myNickname: nickname.trim(),
      }));

      // Redirect to group page
      router.push(`/group/${group.id}`);
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err instanceof Error ? err.message : "Failed to create group");
      setIsLoading(false);
    }
  };

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
              {UI_STRINGS.CREATE_GROUP}
            </h1>
            <p className="text-xs text-muted">
              Yeni bir sürüş grubu oluşturun
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Grup Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
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

                <Input
                  label={UI_STRINGS.GROUP_NAME_LABEL}
                  placeholder={UI_STRINGS.GROUP_NAME_PLACEHOLDER}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={100}
                />

                {error && (
                  <p className="text-sm text-error">{error}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || !nickname.trim()}
                >
                  {isLoading ? "Oluşturuluyor..." : UI_STRINGS.CREATE_GROUP}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted">
            Grup oluşturduktan sonra diğer sürücüleri davet edebileceksiniz.
          </p>
        </div>
      </main>
    </div>
  );
}
