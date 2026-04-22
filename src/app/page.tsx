'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null); // null: 로그인 전, false: 승인 대기, true: 승인 완료
  const [userEmail, setUserEmailState] = useState<string>('');

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Google Login (Real User)
    try {
      const { consultantService } = await import('@/lib/services/consultantService');
      const provider = new GoogleAuthProvider();
      
      // 구글 드라이브 권한 추가 (SaaS 모델 전환)
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      // 리프레시 토큰을 받기 위한 파라미터 설정 (명시적 동의 요청 포함)
      provider.setCustomParameters({ 
        access_type: 'offline',
        prompt: 'consent'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      // 1. 토큰 저장 (있을 경우에만)
      if (credential?.accessToken) {
        const tokenResponse = (result as any)._tokenResponse;
        const googleRefreshToken = tokenResponse?.oauthRefreshToken || undefined;

        await consultantService.saveTokens(user.uid, {
          display_name: user.displayName || '컨설턴트',
          email: user.email || '',
          photo_url: user.photoURL || '',
          google_access_token: credential.accessToken,
          google_refresh_token: googleRefreshToken,
          google_token_expiry: Date.now() + 3500 * 1000
        });
      }

      // 2. 권한 확인 (최우선: 조교 -> 컨설턴트)
      const managerData = await consultantService.findManagerByEmail(user.email || '');
      if (managerData) {
        setIsApproved(true);
        localStorage.setItem('role', 'manager');
        localStorage.setItem('parentId', managerData.parentId);
      } else {
        const consultantData = await consultantService.getConsultant(user.uid);
        if (consultantData?.approved) {
          setIsApproved(true);
          localStorage.setItem('role', 'consultant');
          localStorage.setItem('parentId', user.uid);
        } else {
          setIsApproved(false);
          setUserEmailState(user.email || '');
          setIsLoading(false);
          return;
        }
      }

      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userName', user.displayName || '');
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('authMode', 'secure');
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error detail:', error);
      alert(`로그인 중 오류가 발생했습니다 (${error.name || 'Error'}): ${error.message || '알 수 없는 오류'}. \n구글 드라이브 권한 요청을 승인했는지 확인해 주세요.`);
      setIsLoading(false);
    }
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
              <span>EF</span>
            </div>
            <h1 className="login-title">EduFlow AI</h1>
            <p className="login-subtitle">
              통합 입시 컨설팅 관리 시스템
            </p>
          </div>

          {/* Login Form / Approval Status */}
          <div className="login-form">
            {isApproved === false ? (
              <div className="approval-pending-container">
                <div className="glass-card-premium">
                  <div className="status-icon-wrapper">
                    <div className="status-icon-pulse"></div>
                    <span className="status-icon">⌛</span>
                  </div>
                  
                  <h3 className="status-title">가입 승인 대기 중</h3>
                  
                  <div className="status-info-box">
                    <div className="info-row">
                      <span className="info-label">계정</span>
                      <span className="info-value">{userEmail}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">상태</span>
                      <span className="info-value status-tag">검토 중</span>
                    </div>
                  </div>

                  <p className="status-description">
                    에듀플로우 AI 가입을 환영합니다! ✨<br />
                    보안을 위해 <strong>관리자의 승인</strong> 후 정식 이용이 가능합니다.<br />
                    승인이 완료되면 이메일로 알려드립니다.
                  </p>

                  <div className="divider-subtle" />

                  <button 
                    className="btn btn-ghost w-full btn-switch-account" 
                    onClick={() => { setIsApproved(null); auth.signOut(); }}
                  >
                    <span>다른 계정으로 로그인</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="btn btn-primary w-full btn-lg"
                  onClick={() => handleLogin()}
                  disabled={isLoading}
                  style={{ gap: '10px', height: '54px', fontSize: '1.05rem', marginTop: 'var(--space-md)' }}
                >
                  {isLoading ? (
                    <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> 로그인 중...</>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="white" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" fillOpacity="0.8" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white" fillOpacity="0.8" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" fillOpacity="0.8" />
                      </svg>
                      Google 계정으로 시작하기
                    </>
                  )}
                </button>

                <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    구글 계정으로만 가입이 가능하며,<br />관리자의 승인 후 정식 이용이 가능합니다.
                  </p>
                </div>

              </>
            )}
          </div>

          {/* Features */}
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <span>AI 성적 분석</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📂</span>
              <span>AI 파일 분석</span>
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

        /* 추가 프리미엄 스타일 */
        .approval-pending-container {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-card-premium {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .status-icon-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto var(--space-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-icon-pulse {
          position: absolute;
          inset: 0;
          background: var(--warning-500);
          border-radius: 50%;
          filter: blur(20px);
          opacity: 0.15;
          animation: statusPulse 2s ease-in-out infinite;
        }

        .status-icon {
          font-size: 3rem;
          z-index: 1;
        }

        .status-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: var(--space-lg);
          letter-spacing: -0.02em;
        }

        .status-info-box {
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-lg);
          padding: var(--space-md) var(--space-lg);
          margin-bottom: var(--space-lg);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .info-row:first-child {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .info-value {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .status-tag {
          color: var(--warning-400);
          background: rgba(245, 158, 11, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .status-description {
          font-size: 0.88rem;
          line-height: 1.7;
          color: var(--text-muted);
          margin-bottom: var(--space-xl);
        }

        .divider-subtle {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.05), transparent);
          margin-bottom: var(--space-lg);
        }

        .btn-switch-account {
          font-size: 0.85rem;
          color: var(--text-muted);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-switch-account:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        @keyframes statusPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }

        @keyframes slideUpFade {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
