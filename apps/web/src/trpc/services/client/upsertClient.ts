import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { upsertClientQuery } from "@/lib/db-queries/client/upsertClient";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { upsertClientSchema } from "@/zod-schemas/client/client";
import { InternalServerError } from "@/lib/effect/error/trpc";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

export const upsertClient = authorizedProcedure.input(upsertClientSchema).mutation(async ({ ctx, input }) => {
  const upsertClientEffect = Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () => upsertClientQuery(input, ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });
  });

  return Effect.runPromise(
    upsertClientEffect.pipe(
      Effect.catchTags({
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
