import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { listClientsQuery } from "@/lib/db-queries/client/listClients";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { InternalServerError } from "@/lib/effect/error/trpc";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

export const listClients = authorizedProcedure.query(async ({ ctx }) => {
  const listClientsEffect = Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () => listClientsQuery(ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });
  });

  return Effect.runPromise(
    listClientsEffect.pipe(
      Effect.catchTags({
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
