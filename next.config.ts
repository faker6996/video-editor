import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["platform-lookaside.fbsbx.com", "picsum.photos", "lh3.googleusercontent.com"],
  },
};

export default withNextIntl(nextConfig);
