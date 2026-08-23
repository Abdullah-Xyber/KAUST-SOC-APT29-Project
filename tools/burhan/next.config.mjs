/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The exhibition build runs fully offline; no remote image hosts are required.
  images: { unoptimized: true },
};

export default nextConfig;
