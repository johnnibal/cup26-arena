import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Allow loading /_next/* from LAN / alternate hostnames during `next dev`
  // (e.g. http://192.168.x.x:3000 while the server reports Local: localhost).
  allowedDevOrigins: ["192.168.2.150", "*.local"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
