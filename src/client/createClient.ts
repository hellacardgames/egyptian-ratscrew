import { createClientFactory } from "@hellacardgames/lib";
import type { createManager } from "../manager/createManager.js";
import type { createServer } from "../server/createServer.js";

export const createClient = createClientFactory<
  ReturnType<typeof createServer>,
  ReturnType<typeof createManager>
>({});
