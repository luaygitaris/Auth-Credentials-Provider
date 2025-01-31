import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*',
			},
		],
	},
	eslint: {
		ignoreDuringBuilds: true, // Menonaktifkan pemeriksaan ESLint selama build
	},
};

export default nextConfig;
