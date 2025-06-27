/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for the Vercel HeartbeatWorker.js issue
    config.module.rules.push({
      test: /\.js$/,
      loader: 'string-replace-loader',
      options: {
        search: /export {};/g,
        replace: '',
      },
    });

    return config;
  },
};

export default nextConfig;
