import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/projects", "/verify", "/verification-receipt"],
    },
    sitemap: "https://jisseki.io/sitemap.xml",
  };
}
