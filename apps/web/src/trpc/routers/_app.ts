import { cloudflareRouter } from "@/trpc/services/cloudflare";
import { invoiceRouter } from "@/trpc/services/invoice";
import { clientRouter } from "@/trpc/services/client";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  invoice: invoiceRouter,
  client: clientRouter,
  cloudflare: cloudflareRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
