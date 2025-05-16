// next.config.ts
import type { NextConfig } from "next";

// Build a list of allowed dev origins
const devOrigins = ["http://localhost:3000", "https://happynet-pi.vercel.app/"];
if (process.env.REPLIT_DOMAINS) {
  const replits = process.env.REPLIT_DOMAINS.split(",");
  if (replits[0]) devOrigins.push(`https://${replits[0]}`);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: devOrigins,

  // 1) Rewrite /api/v1/videos → tv.roarzone.info JSON
  async rewrites() {
    return [
      {
        source: "/api/v1/videos",
        destination: "http://tv.roarzone.info/app.php?per=true",
      },
    ];
  },

  // 2) Inject CORS headers on that path so client fetches succeed
  async headers() {
    return [
      {
        source: "/api/v1/videos",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
