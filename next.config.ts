// next.config.ts
import type { NextConfig } from "next";

// Build a list of allowed dev origins
const devOrigins = ["http://localhost:3000"];

// If you’re running on Replit, add that domain too
if (process.env.REPLIT_DOMAINS) {
  const replits = process.env.REPLIT_DOMAINS.split(",");
  if (replits[0]) devOrigins.push(`https://${replits[0]}`);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // During `next dev`, these origins can access your app
  allowedDevOrigins: devOrigins,
};

export default nextConfig;