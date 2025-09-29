import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		optimizePackageImports: ["@phosphor-icons/react"],
	},
	// Enable static export
	output: "export",
	// Disable image optimization for static export
	images: {
		unoptimized: true,
	},
	// Optional: Add a base path if deploying to a subdirectory
	// basePath: '/your-subdirectory',
	// Optional: Add trailing slash for static hosting
	trailingSlash: true,
};

export default nextConfig;
