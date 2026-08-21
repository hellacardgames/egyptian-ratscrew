import type { ChatMessage } from "./ChatMessage.js";

export type ClientState = {
  readonly status: "created" | "started" | "completed" | "forfeited";
  readonly gameId: string;
  readonly playerId: string;
  readonly username: string;
  readonly players: readonly Player[];
  readonly expiresAt: number;
  readonly chatMessages: readonly ChatMessage[];
};

type Player = {
  readonly username: string;
};
