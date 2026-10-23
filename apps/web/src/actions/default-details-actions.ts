"use server";

import { defaultDetailsSchema, type ZodDefaultDetailsSchema } from "@/zod-schemas/invoice/default-details";
import { saveDefaultDetailsQuery } from "@/lib/db-queries/invoice/default-details";
import type { ActionResult } from "@/types/action-result";
import { actionFailure } from "@/actions/action-result";
import { getServerSession } from "@/lib/server-session";
import { SUCCESS_MESSAGES } from "@/constants/issues";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";

async function saveDefaultDetailsAction(input: ZodDefaultDetailsSchema): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to save default details.");

  const parsed = defaultDetailsSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid details.");

  try {
    await saveDefaultDetailsQuery(session.user.id, parsed.data);
    revalidatePath("/assets");
    revalidatePath("/create/invoice");
    return { success: true, data: { message: SUCCESS_MESSAGES.DEFAULT_DETAILS_SAVED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", "Failed to save default details.");
  }
}

export { saveDefaultDetailsAction };
