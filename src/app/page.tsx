'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = () => {
    setIsLoading(true);
    // 데모 모드: 바로 대시보드로 이동
    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        <div className="login-card card-glass">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <span>AF</span>
            </div>
            <h1 className="login-title">AdmitFlow AI</h1>
            <p className="login-subtitle">
              GCP & Telegram 통합 입시 컨설팅 관리 시스템
            </p>
          </div>

          {/* Login Form */}
          <div className="login-form">
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                type="email"
                className="form-input"
                placeholder="consultant@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <button
              className="btn btn-primary w-full btn-lg"
              onClick={handleDemoLogin}
              disabled={isLoading}
              style={{ marginTop: '8px' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>

            <div className="login-divider">
              <span>또는</span>
            </div>

            <button
              className="btn btn-secondary w-full"
              onClick={handleDemoLogin}
              style={{ gap: '10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google 계정으로 로그인
            </button>

            <button
              className="btn btn-ghost w-full"
              onClick={handleDemoLogin}
              style={{ marginTop: '8px', color: 'var(--accent-400)' }}
            >
              🚀 데모 모드로 체험하기
            </button>
          </div>

          {/* Features */}
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <span>AI 성적 분석</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📱</span>
              <span>텔레그램 연동</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📝</span>
              <span>자동 보고서</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-bg-effects {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
        }

        .login-orb-1 {
          width: 400px;
          height: 400px;
          background: var(--primary-600);
          top: -100px;
          right: -100px;
          animation: pulse 4s ease-in-out infinite;
        }

        .login-orb-2 {
          width: 300px;
          height: 300px;
          background: var(--accent-600);
          bottom: -50px;
          left: -50px;
          animation: pulse 5s ease-in-out infinite 1s;
        }

        .login-orb-3 {
          width: 200px;
          height: 200px;
          background: var(--primary-400);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 6s ease-in-out infinite 2s;
        }

        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: var(--space-md);
        }

        .login-card {
          padding: var(--space-2xl);
        }

        .login-brand {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .login-brand-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          border-radius: var(--radius-lg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-md);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .login-brand-icon span {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--primary-300), var(--accent-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: var(--space-xs);
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: var(--space-md) 0;
          gap: var(--space-md);
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-color);
        }

        .login-divider span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .login-features {
          display: flex;
          justify-content: center;
          gap: var(--space-lg);
          margin-top: var(--space-xl);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border-color);
        }

        .login-feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .login-feature-icon {
          font-size: 1.3rem;
        }
      `}</style>
    </div>
  );
}
