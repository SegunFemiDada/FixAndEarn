import type { NextConfig } from "next";

const noIndexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow",
  },
];

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.fixandearn.com/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/app",
        headers: noIndexHeaders,
      },
      {
        source: "/app/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/admin",
        headers: noIndexHeaders,
      },
      {
        source: "/admin/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/login",
        headers: noIndexHeaders,
      },
      {
        source: "/register",
        headers: noIndexHeaders,
      },
      {
        source: "/forgot-password",
        headers: noIndexHeaders,
      },
      {
        source: "/reset-password",
        headers: noIndexHeaders,
      },
      {
        source: "/verify-email-prompt",
        headers: noIndexHeaders,
      },
      {
        source: "/verify-email/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/resend-verification",
        headers: noIndexHeaders,
      },
      {
        source: "/select-role",
        headers: noIndexHeaders,
      },
      {
        source: "/payment",
        headers: noIndexHeaders,
      },
      {
        source: "/payment/:path*",
        headers: noIndexHeaders,
      },
      {
        source: "/support/contact",
        headers: noIndexHeaders,
      },
    ];
  },

  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;