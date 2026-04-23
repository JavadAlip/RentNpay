/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow importing shared PNG assets from admin-next in this monorepo.
    externalDir: true,
  },
};

export default nextConfig;
