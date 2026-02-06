import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "r2.theaudiodb.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "www.theaudiodb.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
        pathname: "/**"
      }
    ],
  },
};

export default nextConfig;
