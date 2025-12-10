import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { SignalingMessage } from "@/lib/types";

export class SignalingService {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private peerId: string;
  private inviteCode: string;
  private onMessage: (msg: SignalingMessage) => void;

  constructor(
    inviteCode: string,
    peerId: string,
    onMessage: (msg: SignalingMessage) => void
  ) {
    this.inviteCode = inviteCode;
    this.peerId = peerId;
    this.onMessage = onMessage;
  }

  async connect(): Promise<void> {
    const channelName = `group:${this.inviteCode}:signaling`;

    this.channel = this.supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
      },
    });

    this.channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      const msg = payload as SignalingMessage;
      // Only process messages meant for us or broadcast (no toPeerId)
      if (!msg.toPeerId || msg.toPeerId === this.peerId) {
        this.onMessage(msg);
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.channel!.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Signaling] Connected to channel:", channelName);
          resolve();
        } else if (status === "CHANNEL_ERROR") {
          reject(new Error("Failed to subscribe to signaling channel"));
        }
      });
    });
  }

  async send(
    message: Omit<SignalingMessage, "fromPeerId" | "timestamp">
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("Not connected to signaling channel");
    }

    const fullMessage: SignalingMessage = {
      ...message,
      fromPeerId: this.peerId,
      timestamp: Date.now(),
    } as SignalingMessage;

    console.log("[Signaling] Sending:", message.type, "to:", message.toPeerId || "all");

    const result = await this.channel.send({
      type: "broadcast",
      event: "signal",
      payload: fullMessage,
    });

    if (result !== "ok") {
      console.error("[Signaling] Failed to send message:", result);
    }
  }

  async sendJoin(nickname: string): Promise<void> {
    await this.send({
      type: "join",
      payload: { nickname },
    });
  }

  async sendOffer(
    toPeerId: string,
    description: RTCSessionDescriptionInit,
    candidates: RTCIceCandidateInit[]
  ): Promise<void> {
    await this.send({
      type: "offer",
      toPeerId,
      payload: { description, candidates },
    });
  }

  async sendAnswer(
    toPeerId: string,
    description: RTCSessionDescriptionInit,
    candidates: RTCIceCandidateInit[]
  ): Promise<void> {
    await this.send({
      type: "answer",
      toPeerId,
      payload: { description, candidates },
    });
  }

  async sendIce(toPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.send({
      type: "ice",
      toPeerId,
      payload: { candidate },
    });
  }

  async sendLeave(reason?: string): Promise<void> {
    await this.send({
      type: "leave",
      payload: { reason },
    });
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      console.log("[Signaling] Disconnecting...");
      await this.sendLeave("disconnected");
      await this.channel.unsubscribe();
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  get connected(): boolean {
    return this.channel !== null;
  }
}
