"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map } from "@/components/map";
import { InviteShare } from "@/components/group/InviteShare";
import { RidersList } from "@/components/group/RidersList";
import { useWebRTC } from "@/lib/hooks/useWebRTC";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { UI_STRINGS } from "@/lib/utils/constants";

interface GroupSession {
  id: string;
  inviteCode: string;
  name: string | null;
  leaderNickname: string;
  role: "leader" | "rider";
  myPeerId: string;
  myNickname: string;
}

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<GroupSession | null>(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);

  // Load session from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("currentGroup");
    if (stored) {
      const parsed = JSON.parse(stored) as GroupSession;
      if (parsed.id === groupId) {
        setSession(parsed);
      } else {
        // Different group, redirect to home
        router.push("/");
      }
    } else {
      // No session, redirect to home
      router.push("/");
    }
  }, [groupId, router]);

  // Geolocation
  const {
    latitude,
    longitude,
    heading,
    speed,
    error: geoError,
    startTracking,
    stopTracking,
  } = useGeolocation();

  // WebRTC
  const {
    isConnected,
    riders,
    riderLocations,
    sendLocation,
    disconnect,
  } = useWebRTC({
    inviteCode: session?.inviteCode || "",
    peerId: session?.myPeerId || "",
    nickname: session?.myNickname || "",
    role: session?.role || "rider",
  });

  // Send location updates
  useEffect(() => {
    if (isLocationSharing && latitude !== null && longitude !== null) {
      sendLocation(latitude, longitude, heading ?? undefined, speed ?? undefined);
    }
  }, [isLocationSharing, latitude, longitude, heading, speed, sendLocation]);

  const handleStartSharing = useCallback(() => {
    startTracking();
    setIsLocationSharing(true);
  }, [startTracking]);

  const handleStopSharing = useCallback(() => {
    stopTracking();
    setIsLocationSharing(false);
  }, [stopTracking]);

  const handleLeaveGroup = useCallback(() => {
    disconnect();
    stopTracking();
    sessionStorage.removeItem("currentGroup");
    router.push("/");
  }, [disconnect, stopTracking, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Yükleniyor...</p>
      </div>
    );
  }

  const myLocation = latitude !== null && longitude !== null
    ? { lat: latitude, lng: longitude }
    : null;

  const connectedCount = riders.filter((r) => r.isConnected).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {session.name || `${session.leaderNickname}'in Grubu`}
            </h1>
            <p className="text-xs text-muted">
              {session.role === "leader" ? UI_STRINGS.ROLE_LEADER : UI_STRINGS.ROLE_RIDER}
              {" • "}
              Kod: {session.inviteCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={isConnected || session.role === "leader" ? "success" : "default"} dot>
              {session.role === "leader"
                ? UI_STRINGS.RIDERS_CONNECTED(connectedCount)
                : isConnected ? UI_STRINGS.CONNECTED : UI_STRINGS.CONNECTING}
            </Badge>

            {!isLocationSharing ? (
              <Button onClick={handleStartSharing} disabled={!isConnected && session.role === "rider"}>
                {UI_STRINGS.START_SHARING}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleStopSharing}>
                {UI_STRINGS.STOP_SHARING}
              </Button>
            )}

            <Button variant="ghost" onClick={handleLeaveGroup}>
              {UI_STRINGS.LEAVE_GROUP}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
          {/* Location error */}
          {geoError && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {geoError}
            </div>
          )}

          {/* Invite (leader only) */}
          {session.role === "leader" && (
            <InviteShare
              inviteCode={session.inviteCode}
              groupId={session.id}
            />
          )}

          {/* Riders list */}
          <RidersList
            myNickname={session.myNickname}
            myRole={session.role}
            riders={riders}
          />

          {/* Location status */}
          {isLocationSharing && myLocation && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
              <p className="text-success font-medium">Konum paylaşılıyor</p>
              <p className="text-muted text-xs mt-1">
                {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </aside>

        {/* Map */}
        <section className="flex-1 relative">
          <Map
            myLocation={myLocation}
            myNickname={session.myNickname}
            riderLocations={riderLocations}
          />
        </section>
      </main>
    </div>
  );
}
