import { ICE_SERVERS } from "@/lib/utils/constants";
import type { LocationMessage, RiderLocation } from "@/lib/types";

export interface PeerConnectionCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onLocationReceived: (location: RiderLocation) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
}

export class PeerConnectionManager {
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  private candidates: RTCIceCandidateInit[] = [];
  private peerId: string;
  private remotePeerId: string;
  private callbacks: PeerConnectionCallbacks;
  private iceGatheringComplete: Promise<void>;
  private resolveIceGathering: (() => void) | null = null;

  constructor(
    peerId: string,
    remotePeerId: string,
    callbacks: PeerConnectionCallbacks
  ) {
    this.peerId = peerId;
    this.remotePeerId = remotePeerId;
    this.callbacks = callbacks;

    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.iceGatheringComplete = new Promise((resolve) => {
      this.resolveIceGathering = resolve;
    });

    this.setupPeerConnectionEvents();
  }

  private setupPeerConnectionEvents(): void {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.candidates.push(event.candidate.toJSON());
        this.callbacks.onIceCandidate(event.candidate);
      } else {
        // ICE gathering complete
        console.log("[PeerConnection] ICE gathering complete");
        this.resolveIceGathering?.();
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log("[PeerConnection] State:", this.pc.connectionState);
      if (this.pc.connectionState === "connected") {
        this.callbacks.onConnected();
      } else if (
        this.pc.connectionState === "disconnected" ||
        this.pc.connectionState === "failed" ||
        this.pc.connectionState === "closed"
      ) {
        this.callbacks.onDisconnected();
      }
    };

    this.pc.ondatachannel = (event) => {
      console.log("[PeerConnection] Received data channel");
      this.dc = event.channel;
      this.setupDataChannel();
    };
  }

  private setupDataChannel(): void {
    if (!this.dc) return;

    this.dc.onopen = () => {
      console.log("[DataChannel] Open with", this.remotePeerId);
    };

    this.dc.onclose = () => {
      console.log("[DataChannel] Closed with", this.remotePeerId);
    };

    this.dc.onerror = (error) => {
      console.error("[DataChannel] Error:", error);
    };

    this.dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as LocationMessage;
        if (msg.type === "location") {
          this.callbacks.onLocationReceived({
            peerId: msg.id,
            nickname: msg.nickname,
            lat: msg.lat,
            lng: msg.lng,
            heading: msg.heading,
            speed: msg.speed,
            timestamp: msg.ts,
          });
        }
      } catch (e) {
        console.error("[DataChannel] Failed to parse message:", e);
      }
    };
  }

  async createOffer(): Promise<{
    description: RTCSessionDescriptionInit;
    candidates: RTCIceCandidateInit[];
  }> {
    // Create data channel for location sharing
    this.dc = this.pc.createDataChannel("location");
    this.setupDataChannel();

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await this.iceGatheringComplete;

    return {
      description: this.pc.localDescription!.toJSON(),
      candidates: this.candidates,
    };
  }

  async handleOffer(
    description: RTCSessionDescriptionInit,
    candidates: RTCIceCandidateInit[]
  ): Promise<{
    description: RTCSessionDescriptionInit;
    candidates: RTCIceCandidateInit[];
  }> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(description));

    // Add remote ICE candidates
    for (const candidate of candidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    // Wait for ICE gathering to complete
    await this.iceGatheringComplete;

    return {
      description: this.pc.localDescription!.toJSON(),
      candidates: this.candidates,
    };
  }

  async handleAnswer(
    description: RTCSessionDescriptionInit,
    candidates: RTCIceCandidateInit[]
  ): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(description));

    // Add remote ICE candidates
    for (const candidate of candidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  sendLocation(location: {
    id: string;
    nickname: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }): boolean {
    if (!this.dc || this.dc.readyState !== "open") {
      return false;
    }

    const msg: LocationMessage = {
      type: "location",
      id: location.id,
      nickname: location.nickname,
      lat: location.lat,
      lng: location.lng,
      heading: location.heading,
      speed: location.speed,
      ts: Date.now(),
    };

    try {
      this.dc.send(JSON.stringify(msg));
      return true;
    } catch (e) {
      console.error("[DataChannel] Failed to send:", e);
      return false;
    }
  }

  get isConnected(): boolean {
    return this.pc.connectionState === "connected";
  }

  get isDataChannelOpen(): boolean {
    return this.dc?.readyState === "open";
  }

  close(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    this.pc.close();
  }
}
