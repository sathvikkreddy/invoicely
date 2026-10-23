import { Metadata, Viewport } from "next";

export const defaultWebsiteViewport: Viewport = {
  themeColor: "#09090B",
  maximumScale: 1,
  initialScale: 1,
  width: "device-width",
  userScalable: false,
};

export const defaultWebsiteMetadata: Metadata = {
  metadataBase: new URL("https://invoicely.sathvikkreddy.xyz"),
  title: "Invoicely - Create Beautiful & Professional Invoices",
  description:
    "Invoicely is a simple and easy to use invoice generator where you can create beautiful and professional invoices in minutes. ~ Proudly OSS - Backed by Cloudflare OSS",
  icons: {
    icon: "/official/invoicely-logo.png",
  },
  openGraph: {
    images: "/official/og-banner.png",
  },
  // This is chatgpt aah generated shit lmao :3
  keywords: [
    "generate invoice",
    "invoice generator",
    "invoice",
    "invoicely",
    "invoicely.gg",
    "generate beautiful invoices",
    "create invoice",
    "create beautiful invoices",
    "create professional invoices",
    "create invoices",
    "create invoice online",
    "create invoice online free",
    "create invoice online for free",
    // Free invoice keywords
    "free invoice generator",
    "free invoice maker",
    "free invoice template",
    "free invoice creator",
    "free online invoice generator",
    "free professional invoice generator",
    "no signup invoice generator",
    "instant invoice generator",
    // Business & freelancing keywords
    "freelancer invoice generator",
    "small business invoice generator",
    "contractor invoice generator",
    "consultant invoice generator",
    "business invoice maker",
    "startup invoice generator",
    // Template & design keywords
    "invoice template generator",
    "custom invoice generator",
    "professional invoice template",
    "modern invoice generator",
    "elegant invoice maker",
    "customizable invoice generator",
    "invoice design tool",
    "branded invoice generator",
    // Feature-specific keywords
    "pdf invoice generator",
    "downloadable invoice generator",
    "printable invoice generator",
    "invoice generator with logo",
    "invoice maker with tax calculation",
    "multi-currency invoice generator",
    "recurring invoice generator",
    // Industry-specific keywords
    "service invoice generator",
    "product invoice generator",
    "hourly rate invoice generator",
    "project invoice generator",
    "photography invoice generator",
    "web design invoice generator",
    // Alternative terms
    "bill generator",
    "billing software free",
    "invoice software online",
    "invoicing tool free",
    "receipt generator",
    "quote generator",
    "estimate generator",
    // Long-tail SEO keywords
    "how to create professional invoice",
    "best free invoice generator",
    "simple invoice generator online",
    "quick invoice maker",
    "easy invoice creator",
    "online invoice builder",
    "invoice generator no registration",
    "generate invoice in minutes",
    // Popular search terms
    "invoice generator",
    "online invoice generator",
    "free invoice generator",
    "invoice generator online",
    "invoice generator free",
    "online invoice generator free",
    "zoho invoice generator",
    "gst invoice generator",
    "free invoice generator online",
    "invoice generator online free",
    "best free invoice generator",
    "free gst invoice generator",
    // AI-related keywords
    "ai invoice generator",
    "ai powered invoice generator",
    "intelligent invoice generator",
    "automated invoice generator",
    // Payment-specific keywords
    "paypal invoice generator",
    "payment invoice generator",
    "secure invoice generator",
    // Additional popular search terms
    "invoice generator online free",
    "free online invoice generator",
    "free invoice generator online",
  ],
};

export interface IGenerateWebsiteMetadata {
  title: string;
  description?: string;
  image?: string;
  keywords?: string[];
}

export const generateWebsiteMetadata = ({
  title,
  description,
  image,
  keywords,
}: IGenerateWebsiteMetadata): Metadata => {
  return {
    ...defaultWebsiteMetadata,
    keywords: [...(defaultWebsiteMetadata.keywords || []), ...(keywords || [])],
    title: title || defaultWebsiteMetadata.title,
    description: description || defaultWebsiteMetadata.description,
    openGraph: {
      images: image || defaultWebsiteMetadata.openGraph?.images,
    },
  };
};
