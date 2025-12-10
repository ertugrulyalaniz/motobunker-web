export * from "./database";

// WebRTC signaling types
export interface SignalingMessage {
  type: "join" | "offer" | "answer" | "ice" | "leave";
  fromPeerId: string;
  toPeerId?: string; // undefined means broadcast
  payload: JoinPayload | OfferPayload | AnswerPayload | IcePayload | LeavePayload;
  timestamp: number;
}

export interface JoinPayload {
  nickname: string;
}

export interface OfferPayload {
  description: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
}

export interface AnswerPayload {
  description: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
}

export interface IcePayload {
  candidate: RTCIceCandidateInit;
}

export interface LeavePayload {
  reason?: string;
}

// Rider location types
export interface RiderLocation {
  peerId: string;
  nickname: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface RiderInfo {
  peerId: string;
  nickname: string;
  isLeader: boolean;
  isConnected: boolean;
}

// Location message sent via DataChannel
export interface LocationMessage {
  type: "location";
  id: string;
  nickname: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  ts: number;
}
