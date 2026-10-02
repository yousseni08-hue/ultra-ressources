/** @type {import('next').NextConfig} */
export default {
  outputFileTracingIncludes: { '/**': ['./content/**/*'] },
  // Ancien nom de la ressource : les vieux liens /roadmap continuent de marcher (les paramètres ?kw=… sont conservés).
  async redirects() {
    return [
      { source: '/roadmap', destination: '/plan', permanent: false },
      { source: '/roadmap/:path*', destination: '/plan/:path*', permanent: false },
    ];
  },
};
