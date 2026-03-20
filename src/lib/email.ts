import { Resend } from 'resend';

// Resend 인스턴스 초기화
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 관리자에게 신규 가입 승인 요청 이메일 발송 (Resend API 사용)
 */
export async function sendApprovalRequestEmail(userEmail: string, userId: string, userName: string) {
    const adminEmail = process.env.ADMIN_EMAIL || userEmail;
    const resendApiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const secretToken = process.env.ADMIN_APPROVE_TOKEN || 'admitflow_secret_123';
    
    // 승인 링크 생성
    const approveUrl = `${appUrl}/api/admin/approve?userId=${userId}&token=${secretToken}`;

    console.log(`[Email] Preparing Resend approval request for ${userEmail} to ${adminEmail}`);

    // API Key가 설정이 안 되어 있는 경우 로그로만 출력 (테스트용)
    if (!resendApiKey) {
        console.warn('[Email] Resend API Key missing! (RESEND_API_KEY)');
        console.log(`[Approval Link For Dev] ${approveUrl}`);
        return { success: false, error: 'Configuration Missing' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'AdmitFlow AI <onboarding@resend.dev>', // 도메인 연결 전에는 이 주소만 사용 가능
            to: adminEmail,
            subject: `[AdmitFlow AI] 신규 가입 승인 요청: ${userName} (${userEmail})`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #6366f1; margin-bottom: 20px;">AdmitFlow AI 가입 요청</h2>
                    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                        새로운 컨설턴트 가입 신청이 도착했습니다. 내용을 확인하시고 승인 여부를 결정해 주세요.
                    </p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">가입자 성함</p>
                        <p style="margin: 4px 0 16px 0; font-size: 18px; font-weight: 700; color: #111827;">${userName}</p>
                        
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">이메일 주소</p>
                        <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827;">${userEmail}</p>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px; margin-bottom: 20px;">
                        * 아래 버튼을 누르면 즉시 해당 계정이 승인되어 서비스 이용이 가능해집니다.
                    </p>
                    
                    <a href="${approveUrl}" 
                       style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; width: 100%; text-align: center;">
                        즉시 가입 승인하기
                    </a>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
                        본 메일은 AdmitFlow AI 시스템에서 자동으로 발송되었습니다.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('[Email] Resend API Error:', error);
            return { success: false, error };
        }

        console.log('[Email] Resend approval request sent successfully:', data?.id);
        return { success: true };
    } catch (err: any) {
        console.error('[Email] Resend Unexpected Error:', err.message);
        return { success: false, error: err };
    }
}

