"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RiderInfo } from "@/lib/types";

interface RidersListProps {
  myNickname: string;
  myRole: "leader" | "rider";
  riders: RiderInfo[];
}

export function RidersList({ myNickname, myRole, riders }: RidersListProps) {
  const connectedCount = riders.filter((r) => r.isConnected).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sürücüler</CardTitle>
          <Badge variant={connectedCount > 0 ? "success" : "default"} dot>
            {connectedCount + 1} kişi
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {/* Self */}
          <li className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-medium text-foreground">{myNickname}</span>
              <span className="text-xs text-muted">(Sen)</span>
            </div>
            {myRole === "leader" && (
              <span className="text-xs text-primary">Lider</span>
            )}
          </li>

          {/* Other riders */}
          {riders.map((rider) => (
            <li
              key={rider.peerId}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    rider.isConnected ? "bg-success" : "bg-error"
                  }`}
                />
                <span className="text-foreground">{rider.nickname}</span>
              </div>
              {rider.isLeader && (
                <span className="text-xs text-primary">Lider</span>
              )}
            </li>
          ))}

          {/* Empty state */}
          {riders.length === 0 && (
            <li className="py-4 text-center text-muted text-sm">
              {myRole === "leader"
                ? "Henüz katılan sürücü yok. Davet kodunu paylaşın."
                : "Bağlantı kuruluyor..."}
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
