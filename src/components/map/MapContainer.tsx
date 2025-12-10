"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/utils/constants";
import type { RiderLocation } from "@/lib/types";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapContainerProps {
  myLocation: { lat: number; lng: number } | null;
  myNickname: string;
  riderLocations: Map<string, RiderLocation>;
  className?: string;
}

// Custom marker icons - modern, soft style
function createMarkerIcon(color: string, label: string, isMe: boolean = false): L.DivIcon {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${color};
        color: white;
        padding: 4px ;
        border-radius: 32px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: 2px solid rgba(255,255,255,0.9);
        width: fit-content;
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        ${isMe ? 'animation: pulse 2s infinite;' : ''}
      " id="map-marker-label"
      >${label}</div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function MapContainer({
  myLocation,
  myNickname,
  riderLocations,
  className = "",
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const selfMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView(
      [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      DEFAULT_MAP_ZOOM
    );

    // CartoDB Positron - clean, soft, modern map style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update self marker
  useEffect(() => {
    if (!mapRef.current || !myLocation) return;

    // Soft blue for self marker
    const icon = createMarkerIcon("#3b82f6", `${myNickname} (Sen)`, true);

    if (!selfMarkerRef.current) {
      selfMarkerRef.current = L.marker([myLocation.lat, myLocation.lng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current);

      // Center on first location
      mapRef.current.setView([myLocation.lat, myLocation.lng], 14);
    } else {
      selfMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng]);
      selfMarkerRef.current.setIcon(icon);
    }
  }, [myLocation, myNickname]);

  // Update rider markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Update existing markers and add new ones
    riderLocations.forEach((location, peerId) => {
      // Soft teal for other riders
      const icon = createMarkerIcon("#14b8a6", location.nickname);

      if (riderMarkersRef.current.has(peerId)) {
        const marker = riderMarkersRef.current.get(peerId)!;
        marker.setLatLng([location.lat, location.lng]);
        marker.setIcon(icon);
      } else {
        const marker = L.marker([location.lat, location.lng], { icon }).addTo(
          mapRef.current!
        );
        riderMarkersRef.current.set(peerId, marker);
      }
    });

    // Remove markers for disconnected riders
    riderMarkersRef.current.forEach((marker, peerId) => {
      if (!riderLocations.has(peerId)) {
        marker.remove();
        riderMarkersRef.current.delete(peerId);
      }
    });
  }, [riderLocations]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "300px" }}
    />
  );
}
