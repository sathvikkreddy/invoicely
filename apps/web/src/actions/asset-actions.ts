"use server";

import { getFileSizeFromBase64 } from "@/lib/invoice/get-file-size-from-base64";
import { getUserImagesCount } from "@/lib/cloudflare/r2/getUserImagesCount";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { uploadImage } from "@/lib/cloudflare/r2/uploadImage";
import { deleteImage } from "@/lib/cloudflare/r2/deleteImage";
import { createR2Client } from "@/lib/cloudflare/r2/client";
import type { ActionResult } from "@/types/action-result";
import { actionFailure } from "@/actions/action-result";
import { getServerSession } from "@/lib/server-session";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const fileSizes = {
  logo: 400_000,
  signature: 150_000,
} as const;

const uploadImageSchema = z.object({
  type: z.enum(["logo", "signature"]),
  base64: z.string().startsWith("data:image"),
});

function revalidateAssetPaths(): void {
  revalidatePath("/assets");
  revalidatePath("/create/invoice");
  revalidatePath("/edit", "layout");
}

async function uploadImageAction(
  input: z.input<typeof uploadImageSchema>,
): Promise<ActionResult<{ url: string; message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to upload an image.");

  const parsed = uploadImageSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid image.");

  const sizeLimit = fileSizes[parsed.data.type];
  if (getFileSizeFromBase64(parsed.data.base64) > sizeLimit) {
    return actionFailure(
      "PAYLOAD_TOO_LARGE",
      `${parsed.data.type === "logo" ? "Logo" : "Signature"} must be below ${Math.round(sizeLimit / 1000)} KB.`,
    );
  }

  try {
    const s3 = createR2Client();
    if ((await getUserImagesCount(s3, session.user.id)) >= 25) {
      return actionFailure("LIMIT_REACHED", ERROR_MESSAGES.MAX_IMAGES_REACHED);
    }

    const url = await uploadImage(s3, parsed.data.base64, session.user.id, parsed.data.type);
    if (!url) return actionFailure("INTERNAL", ERROR_MESSAGES.UPLOADING_IMAGE);

    revalidateAssetPaths();
    return { success: true, data: { url, message: SUCCESS_MESSAGES.IMAGE_UPLOADED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", ERROR_MESSAGES.UPLOADING_IMAGE);
  }
}

async function deleteImageAction(input: { key: string }): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to delete an image.");

  const parsed = z.object({ key: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", "Invalid image key.");
  if (!parsed.data.key.startsWith(`${session.user.id}/`)) {
    return actionFailure("UNAUTHORIZED", ERROR_MESSAGES.NOT_ALLOWED_TO_DELETE_IMAGE);
  }

  try {
    const deleted = await deleteImage(createR2Client(), parsed.data.key);
    if (!deleted) return actionFailure("INTERNAL", ERROR_MESSAGES.IMAGE_DELETED);

    revalidateAssetPaths();
    return { success: true, data: { message: SUCCESS_MESSAGES.IMAGE_DELETED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", ERROR_MESSAGES.IMAGE_DELETED);
  }
}

export { deleteImageAction, uploadImageAction };
