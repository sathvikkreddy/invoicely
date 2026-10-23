const protectedPaths = ["/dashboard", "/invoices", "/assets", "/create/invoice", "/edit"];

type CallbackSearchParams = Record<string, string | string[] | undefined>;

function getSafeCallbackUrl(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return "/dashboard";

  try {
    const url = new URL(candidate, "https://invoicely.local");
    const isInternal = url.origin === "https://invoicely.local";
    const isProtected = protectedPaths.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));

    if (!isInternal || !isProtected) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

function createCallbackUrl(pathname: string, searchParams: CallbackSearchParams): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return getSafeCallbackUrl(queryString ? `${pathname}?${queryString}` : pathname);
}

export { createCallbackUrl, getSafeCallbackUrl };
export type { CallbackSearchParams };
