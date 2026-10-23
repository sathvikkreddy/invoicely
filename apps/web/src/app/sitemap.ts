import { allBlogs } from "content-collections";
import { MetadataRoute } from "next";

const routes = ["/", "/blog", "/assets", "/create/invoice", "/invoices"];

export default function sitemap(): MetadataRoute.Sitemap {
  const blogs = allBlogs.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date().toISOString(),
  }));

  const genRoutes = routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date().toISOString(),
  }));

  return [...genRoutes, ...blogs];
}

const absoluteUrl = (path: string) => {
  return `https://invoicely.sathvikkreddy.xyz${path}`;
};
