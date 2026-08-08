import type { MetadataRoute } from "next";

const BASE_URL = "https://misstice.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/pro",
        "/admin",
        "/auth",
        "/devis/",
        "/invitation/",
        "/rsvp/",
        "/e/",
        "/verifier-telephone",
        "/style-guide",
        "/api/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
