"use client";

import dynamic from "next/dynamic";

const InvoicePage = dynamic(() => import("./invoice"), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">Loading invoice editor…</div>
  ),
});

export default InvoicePage;
