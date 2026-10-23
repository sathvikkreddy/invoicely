import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { redirect } from "next/navigation";
import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";

const getServerSession = cache(async () =>
  serverAuth.api.getSession({
    headers: await headers(),
  }),
);

async function requireServerSession(callbackUrl: string) {
  const session = await getServerSession();

  if (!session) {
    const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`);
  }

  return session;
}

export { getServerSession, requireServerSession };
