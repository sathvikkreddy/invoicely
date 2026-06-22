import { createTRPCRouter } from "@/trpc/init";
import { listClients } from "./listClients";
import { upsertClient } from "./upsertClient";

export const clientRouter = createTRPCRouter({
  list: listClients,
  upsert: upsertClient,
});
