import { ManagerBase } from "@hellacardgames/lib";
import { EXPIRY_EXTENSION_MS, MAX_PLAYERS, MIN_PLAYERS } from "./constants.js";
import { emitEvent } from "../lib/emitEvent.js";
import type { ChatMessage } from "./types/ChatMessage.js";
import type { ClientState } from "./types/ClientState.js";
import type { Game } from "./types/Game.js";
import type { GameEvent } from "./types/GameEvent.js";
import type { Player } from "./types/Player.js";

export type CreateGameResult =
  | {
      readonly success: true;
      readonly gameId: string;
      readonly playerId: string;
    }
  | {
      readonly success: false;
      readonly error: "maxGamesReached";
    };

export type GetClientStateAndClearEventsResult =
  | {
      readonly success: true;
      readonly state: ClientState;
    }
  | {
      readonly success: false;
      readonly error: "gameNotFound" | "playerNotFound";
    };

export type GetEventsAndClearAcknowledgedResult =
  | {
      readonly success: true;
      readonly events: readonly GameEvent[];
    }
  | {
      readonly success: false;
      readonly error: "gameNotFound" | "playerNotFound";
    };

export type GetJoinableGamesResult = {
  readonly games: readonly {
    readonly id: string;
    readonly numPlayers: number;
  }[];
};

export type JoinGameResult =
  | {
      readonly success: true;
      readonly playerId: string;
    }
  | {
      readonly success: false;
      readonly error:
        | "gameNotFound"
        | "invalidStatus"
        | "maxPlayersReached"
        | "alreadyInGame";
    };

export type LeaveGameResult =
  | {
      readonly success: true;
    }
  | {
      readonly success: false;
      readonly error: "gameNotFound" | "playerNotFound";
    };

export type SendChatResult =
  | {
      readonly success: true;
    }
  | {
      readonly success: false;
      error: "gameNotFound" | "playerNotFound";
    };

export type StartGameResult =
  | {
      readonly success: true;
    }
  | {
      readonly success: false;
      readonly error:
        | "gameNotFound"
        | "playerNotFound"
        | "invalidStatus"
        | "playerNotAdmin"
        | "minPlayersNotReached";
    };

export class Manager extends ManagerBase<Game> {
  createGame(userId: string, username: string): CreateGameResult {
    if (this.games.size === this.maxGames) {
      return { success: false, error: "maxGamesReached" };
    }
    const player: Player = {
      id: crypto.randomUUID(),
      userId,
      username,
      events: [],
    };
    const createdAt = Date.now();
    const game: Game = {
      status: "created",
      id: crypto.randomUUID(),
      createdAt,
      expiresAt: createdAt + EXPIRY_EXTENSION_MS,
      chatMessages: [],
      players: [player],
    };
    this.games.set(game.id, game);
    return { success: true, gameId: game.id, playerId: player.id };
  }

  getClientStateAndClearEvents(
    gameId: string,
    playerId: string,
  ): GetClientStateAndClearEventsResult {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "gameNotFound" };
    }
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "playerNotFound" };
    }
    const state: ClientState = {
      status: game.status,
      gameId,
      playerId,
      username: player.username,
      players: game.players.map((p) => ({
        username: p.username,
      })),
      expiresAt: game.expiresAt,
      chatMessages: game.chatMessages,
    };
    player.events.length = 0;
    return { success: true, state };
  }

  getEventsAndClearAcknowledged(
    gameId: string,
    playerId: string,
    lastReadId: string | null,
  ): GetEventsAndClearAcknowledgedResult {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "gameNotFound" };
    }
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "playerNotFound" };
    }
    const lastReadEventIndex = player.events.findIndex(
      (e) => e.id === lastReadId,
    );
    player.events.splice(0, lastReadEventIndex + 1);
    return { success: true, events: player.events };
  }

  getJoinableGames(): GetJoinableGamesResult {
    return {
      games: Array.from(this.games.values())
        .filter((g) => g.status === "created" && g.players.length < MAX_PLAYERS)
        .map((g) => ({
          id: g.id,
          numPlayers: g.players.length,
        })),
    };
  }

  joinGame(gameId: string, userId: string, username: string): JoinGameResult {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "gameNotFound" };
    }
    if (game.status !== "created") {
      return { success: false, error: "invalidStatus" };
    }
    if (game.players.length === MAX_PLAYERS) {
      return { success: false, error: "maxPlayersReached" };
    }
    if (game.players.find((p) => p.userId === userId)) {
      return { success: false, error: "alreadyInGame" };
    }
    const player: Player = {
      id: crypto.randomUUID(),
      userId,
      username,
      events: [],
    };
    game.players.push(player);
    emitEvent(game, { type: "playerJoined", username });
    return { success: true, playerId: player.id };
  }

  leaveGame(gameId: string, playerId: string): LeaveGameResult {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "gameNotFound" };
    }
    const playerIndex = game.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, error: "playerNotFound" };
    }

    const player = game.players[playerIndex]!;
    emitEvent(game, { type: "playerLeft", username: player.username });

    game.players.splice(playerIndex, 1);

    if (game.status === "started" && game.players.length < MIN_PLAYERS) {
      const forfeitedGame: Game = {
        ...game,
        status: "forfeited",
        expiresAt: Date.now() + EXPIRY_EXTENSION_MS,
      };
      this.games.set(game.id, forfeitedGame);
      emitEvent(forfeitedGame, { type: "gameForfeited" });
      emitEvent(forfeitedGame, {
        type: "expirationUpdated",
        expiresAt: forfeitedGame.expiresAt,
      });
    }
    if (game.players.length === 0) {
      this.games.delete(game.id);
    }
    return { success: true };
  }

  sendChat(gameId: string, playerId: string, text: string): SendChatResult {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "gameNotFound" };
    }
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "playerNotFound" };
    }
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      username: player.username,
      text,
    };
    game.chatMessages.push(message);
    emitEvent(game, { type: "chat", message });
    return { success: true };
  }

  startGame(gameId: string, playerId: string): StartGameResult {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "gameNotFound" };
    }
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "playerNotFound" };
    }
    if (game.status !== "created") {
      return { success: false, error: "invalidStatus" };
    }
    if (game.players.indexOf(player) !== 0) {
      return { success: false, error: "playerNotAdmin" };
    }
    if (game.players.length < MIN_PLAYERS) {
      return { success: false, error: "minPlayersNotReached" };
    }

    const startedGame: Game = {
      ...game,
      status: "started",
      expiresAt: Date.now() + EXPIRY_EXTENSION_MS,
    };
    this.games.set(game.id, startedGame);
    emitEvent(startedGame, { type: "gameStarted" });
    emitEvent(startedGame, {
      type: "expirationUpdated",
      expiresAt: startedGame.expiresAt,
    });
    return { success: true };
  }
}
