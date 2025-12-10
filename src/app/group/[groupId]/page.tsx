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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      {/* Header - Mobile optimized */}
      <header className="px-3 py-2 md:px-4 md:py-3 border-b border-border flex-shrink-0 bg-background z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Menu button (mobile) + Group info */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 -ml-2 text-muted hover:text-foreground"
              aria-label="Menü"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                {session.name || `${session.leaderNickname}'in Grubu`}
              </h1>
              <p className="text-xs text-muted">
                <span className="hidden sm:inline">
                  {session.role === "leader" ? UI_STRINGS.ROLE_LEADER : UI_STRINGS.ROLE_RIDER}
                  {" • "}
                </span>
                Kod: <span className="font-mono">{session.inviteCode}</span>
              </p>
            </div>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2">
            <Badge variant={isConnected || session.role === "leader" ? "success" : "default"} dot>
              <span className="hidden sm:inline">
                {session.role === "leader"
                  ? UI_STRINGS.RIDERS_CONNECTED(connectedCount)
                  : isConnected ? UI_STRINGS.CONNECTED : UI_STRINGS.CONNECTING}
              </span>
              <span className="sm:hidden">
                {session.role === "leader" ? connectedCount : isConnected ? "✓" : "..."}
              </span>
            </Badge>

            {!isLocationSharing ? (
              <Button
                onClick={handleStartSharing}
                disabled={!isConnected && session.role === "rider"}
                size="sm"
                className="text-xs md:text-sm"
              >
                <span className="hidden sm:inline">{UI_STRINGS.START_SHARING}</span>
                <span className="sm:hidden">Başlat</span>
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleStopSharing} size="sm" className="text-xs md:text-sm">
                <span className="hidden sm:inline">{UI_STRINGS.STOP_SHARING}</span>
                <span className="sm:hidden">Durdur</span>
              </Button>
            )}

            <Button variant="ghost" onClick={handleLeaveGroup} size="sm" className="text-xs md:text-sm px-2">
              <span className="hidden sm:inline">{UI_STRINGS.LEAVE_GROUP}</span>
              <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Slide-out on mobile, fixed on desktop */}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-40
            w-72 md:w-80 flex-shrink-0
            bg-background border-r border-border
            overflow-y-auto p-4 space-y-4
            transform transition-transform duration-200 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            pt-16 md:pt-4
          `}
        >
          {/* Close button (mobile) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden absolute top-3 right-3 p-2 text-muted hover:text-foreground"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

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

        {/* Map - Full screen on mobile */}
        <section className="flex-1 relative">
          <Map
            myLocation={myLocation}
            myNickname={session.myNickname}
            riderLocations={riderLocations}
          />

          {/* Mobile floating info button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute bottom-4 left-4 z-10 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
            aria-label="Sürücüleri göster"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {riders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-success text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {riders.length}
              </span>
            )}
          </button>
        </section>
      </main>
    </div>
  );
}
