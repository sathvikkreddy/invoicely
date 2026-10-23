import { getUserImages } from "@/lib/cloudflare/r2/getUserImages";
import { createR2Client } from "@/lib/cloudflare/r2/client";

async function listUserImageKeys(userId: string): Promise<string[]> {
  const images = await getUserImages(createR2Client(), userId);
  return images.map((image) => image.Key).filter((key): key is string => key !== undefined);
}

export { listUserImageKeys };
