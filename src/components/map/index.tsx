"use client";

import dynamic from "next/dynamic";
import type { RiderLocation } from "@/lib/types";

// Dynamically import the map to avoid SSR issues with Leaflet
export const DynamicMap = dynamic(
  () => import("./MapContainer").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <p className="text-muted">Harita yükleniyor...</p>
      </div>
    ),
  }
);

export interface MapProps {
  myLocation: { lat: number; lng: number } | null;
  myNickname: string;
  riderLocations: Map<string, RiderLocation>;
  className?: string;
}

export function Map(props: MapProps) {
  return <DynamicMap {...props} />;
}
