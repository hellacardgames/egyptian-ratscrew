export { Client } from "./Client.js";

export type {
  CreateGameResult,
  GetClientStateAndClearEventsResult,
  GetEventsAndClearAcknowledgedResult,
  GetJoinableGamesResult,
  JoinGameResult,
  LeaveGameResult,
  SendChatResult,
  StartGameResult,
} from "../server/index.js";

export type {
  Card,
  ChatMessage,
  ClientState,
  GameEvent,
} from "../server/index.js";
