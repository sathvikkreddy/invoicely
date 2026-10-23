import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { getDefaultDetailsQuery } from "@/lib/db-queries/invoice/default-details";
import { listUserImageKeys } from "@/lib/cloudflare/r2/list-user-image-keys";
import { requireServerSession } from "@/lib/server-session";
import AssetsPage from "./assets";

interface PageProps {
  searchParams: Promise<CallbackSearchParams>;
}

const Page = async ({ searchParams }: PageProps) => {
  const session = await requireServerSession(createCallbackUrl("/assets", await searchParams));
  const [images, defaultDetails] = await Promise.all([
    listUserImageKeys(session.user.id),
    getDefaultDetailsQuery(session.user.id),
  ]);

  return <AssetsPage images={images} defaultDetails={defaultDetails} />;
};

export default Page;
