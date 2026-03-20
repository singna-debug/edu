import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.googleusercontent.com https://*.firebasestorage.app; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebasestorage.app https://api.resend.com https://*.firebaseapp.com; frame-src 'self' https://*.firebaseapp.com https://apis.google.com https://*.googleapis.com;"
          },
        ],
      },
    ];
  },
  
  // 압축 활성 및 기타
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
