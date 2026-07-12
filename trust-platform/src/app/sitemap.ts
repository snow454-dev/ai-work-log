import type { MetadataRoute } from "next";

const routes = ["", "/solutions", "/developers", "/companies", "/ai-solutions"];

export default function sitemap(): MetadataRoute.Sitemap {
  const modified = new Date();

  return routes.map((route, index) => ({
    url: `https://jisseki.io${route}`,
    lastModified: modified,
    changeFrequency: index < 2 ? "daily" : "weekly",
    priority: index === 0 ? 1 : index === 1 ? 0.9 : 0.7,
  }));
}
