import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { requireServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<CallbackSearchParams>;
}

const Page = async ({ searchParams }: PageProps) => {
  await requireServerSession(createCallbackUrl("/edit", await searchParams));
  redirect("/invoices");
};

export default Page;
