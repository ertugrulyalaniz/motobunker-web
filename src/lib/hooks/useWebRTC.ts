"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SignalingService } from "@/lib/webrtc/signaling";
import { PeerConnectionManager } from "@/lib/webrtc/peer-connection";
import type {
  SignalingMessage,
  RiderLocation,
  RiderInfo,
  JoinPayload,
  OfferPayload,
  AnswerPayload,
  IcePayload,
} from "@/lib/types";

interface UseWebRTCOptions {
  inviteCode: string;
  peerId: string;
  nickname: string;
  role: "leader" | "rider";
}

interface UseWebRTCReturn {
  isConnected: boolean;
  riders: RiderInfo[];
  riderLocations: Map<string, RiderLocation>;
  sendLocation: (lat: number, lng: number, heading?: number, speed?: number) => void;
  disconnect: () => void;
}

export function useWebRTC({
  inviteCode,
  peerId,
  nickname,
  role,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [riders, setRiders] = useState<RiderInfo[]>([]);
  const [riderLocations, setRiderLocations] = useState<Map<string, RiderLocation>>(new Map());

  const signalingRef = useRef<SignalingService | null>(null);
  const peersRef = useRef<Map<string, PeerConnectionManager>>(new Map());
  const ridersInfoRef = useRef<Map<string, RiderInfo>>(new Map());

  const updateRiders = useCallback(() => {
    setRiders(Array.from(ridersInfoRef.current.values()));
  }, []);

  const handleLocationReceived = useCallback((location: RiderLocation, sourcePeerId: string) => {
    console.log("[WebRTC] Location received from:", sourcePeerId, "peerId in msg:", location.peerId);

    setRiderLocations((prev) => {
      const next = new Map(prev);
      next.set(location.peerId, location);
      return next;
    });

    // For riders: if we receive a relayed location (peerId != sourcePeerId),
    // add that rider to our riders list so they appear in the UI
    if (role === "rider" && location.peerId !== sourcePeerId) {
      // This is a relayed location from another rider via the leader
      if (!ridersInfoRef.current.has(location.peerId)) {
        ridersInfoRef.current.set(location.peerId, {
          peerId: location.peerId,
          nickname: location.nickname,
          isLeader: false,
          isConnected: true,
        });
        updateRiders();
      }
    }

    // If leader, relay to ALL other peers (hub-spoke relay)
    if (role === "leader") {
      console.log("[WebRTC] Leader relaying location from", location.peerId, "to other peers");

      const msg = {
        id: location.peerId,
        nickname: location.nickname,
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        speed: location.speed,
      };

      peersRef.current.forEach((peer, remotePeerId) => {
        // Don't send back to the original source
        if (remotePeerId !== sourcePeerId && peer.isDataChannelOpen) {
          console.log("[WebRTC] Relaying to:", remotePeerId);
          peer.sendLocation(msg);
        }
      });
    }
  }, [role, updateRiders]);

  const createPeerConnection = useCallback(
    (remotePeerId: string, remoteNickname: string): PeerConnectionManager => {
      const peer = new PeerConnectionManager(peerId, remotePeerId, {
        onConnected: () => {
          console.log("[WebRTC] Connected to:", remotePeerId);
          ridersInfoRef.current.set(remotePeerId, {
            peerId: remotePeerId,
            nickname: remoteNickname,
            isLeader: role === "rider",
            isConnected: true,
          });
          updateRiders();
          setIsConnected(true);
        },
        onDisconnected: () => {
          console.log("[WebRTC] Disconnected from:", remotePeerId);
          ridersInfoRef.current.delete(remotePeerId);
          peersRef.current.delete(remotePeerId);
          updateRiders();

          // Check if any peers are still connected
          const anyConnected = Array.from(peersRef.current.values()).some(
            (p) => p.isConnected
          );
          if (!anyConnected) {
            setIsConnected(false);
          }
        },
        onLocationReceived: (location) => handleLocationReceived(location, remotePeerId),
        onIceCandidate: () => {
          // ICE candidates are gathered in batch with the offer/answer
        },
      });

      peersRef.current.set(remotePeerId, peer);
      return peer;
    },
    [peerId, role, handleLocationReceived, updateRiders]
  );

  const handleSignalingMessage = useCallback(
    async (msg: SignalingMessage) => {
      console.log("[WebRTC] Received signal:", msg.type, "from:", msg.fromPeerId);

      switch (msg.type) {
        case "join": {
          // Only leader handles join
          if (role !== "leader") return;

          const { nickname: joinerNickname } = msg.payload as JoinPayload;
          console.log("[WebRTC] Rider joining:", joinerNickname);

          // Create peer connection and send offer
          const peer = createPeerConnection(msg.fromPeerId, joinerNickname);
          const { description, candidates } = await peer.createOffer();

          await signalingRef.current?.sendOffer(
            msg.fromPeerId,
            description,
            candidates
          );
          break;
        }

        case "offer": {
          // Only rider handles offer
          if (role !== "rider") return;

          const { description, candidates } = msg.payload as OfferPayload;
          console.log("[WebRTC] Received offer from leader");

          // Get leader nickname from riders info or use a default
          const leaderNickname = "Lider";

          const peer = createPeerConnection(msg.fromPeerId, leaderNickname);
          const answer = await peer.handleOffer(description, candidates);

          await signalingRef.current?.sendAnswer(
            msg.fromPeerId,
            answer.description,
            answer.candidates
          );
          break;
        }

        case "answer": {
          // Only leader handles answer
          if (role !== "leader") return;

          const { description, candidates } = msg.payload as AnswerPayload;
          const peer = peersRef.current.get(msg.fromPeerId);

          if (peer) {
            await peer.handleAnswer(description, candidates);
          }
          break;
        }

        case "ice": {
          const { candidate } = msg.payload as IcePayload;
          const peer = peersRef.current.get(msg.fromPeerId);

          if (peer) {
            await peer.addIceCandidate(candidate);
          }
          break;
        }

        case "leave": {
          console.log("[WebRTC] Peer left:", msg.fromPeerId);
          const peer = peersRef.current.get(msg.fromPeerId);
          if (peer) {
            peer.close();
            peersRef.current.delete(msg.fromPeerId);
            ridersInfoRef.current.delete(msg.fromPeerId);
            updateRiders();
          }
          break;
        }
      }
    },
    [role, createPeerConnection, updateRiders]
  );

  // Initialize signaling and connections
  useEffect(() => {
    let mounted = true;

    // Capture ref values at effect start for cleanup
    const peersMap = peersRef.current;
    const signalingService = signalingRef.current;

    async function initialize() {
      try {
        // Create signaling service
        signalingRef.current = new SignalingService(
          inviteCode,
          peerId,
          handleSignalingMessage
        );

        await signalingRef.current.connect();

        if (!mounted) return;

        // If rider, announce join
        if (role === "rider") {
          await signalingRef.current.sendJoin(nickname);
        }
      } catch (error) {
        console.error("[WebRTC] Initialization error:", error);
      }
    }

    initialize();

    return () => {
      mounted = false;

      // Cleanup using captured refs
      peersMap.forEach((peer) => peer.close());
      peersMap.clear();
      signalingService?.disconnect();
      signalingRef.current?.disconnect();
    };
  }, [inviteCode, peerId, nickname, role, handleSignalingMessage]);

  const sendLocation = useCallback(
    (lat: number, lng: number, heading?: number, speed?: number) => {
      const msg = {
        id: peerId,
        nickname,
        lat,
        lng,
        heading,
        speed,
      };

      peersRef.current.forEach((peer) => {
        if (peer.isDataChannelOpen) {
          peer.sendLocation(msg);
        }
      });
    },
    [peerId, nickname]
  );

  const disconnect = useCallback(() => {
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    signalingRef.current?.disconnect();
    setIsConnected(false);
    setRiders([]);
  }, []);

  return {
    isConnected,
    riders,
    riderLocations,
    sendLocation,
    disconnect,
  };
}
