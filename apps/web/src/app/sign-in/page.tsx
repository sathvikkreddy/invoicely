import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getServerSession } from "@/lib/server-session";
import { SignInCard } from "./sign-in.client";
import { redirect } from "next/navigation";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);
  const session = await getServerSession();

  if (session) redirect(safeCallbackUrl);

  return <SignInCard callbackUrl={safeCallbackUrl} />;
}

export default SignInPage;
