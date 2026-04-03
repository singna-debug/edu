import 'server-only';
import nodemailer from 'nodemailer';

/**
 * Gmail SMTP 설정을 이용한 이메일 전송 (Nodemailer)
 */
const getTransporter = () => {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    
    if (!user || !pass) return null;
    
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
};

/**
 * 관리자에게 신규 가입 승인 요청 이메일 발송
 */
export async function sendApprovalRequestEmail(userEmail: string, userId: string, userName: string) {
    const adminEmail = process.env.ADMIN_EMAIL || userEmail;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const secretToken = process.env.ADMIN_APPROVE_TOKEN || 'eduflow_secret_123';
    
    // 승인 링크 생성
    const approveUrl = `${appUrl}/api/admin/approve?userId=${userId}&token=${secretToken}`;

    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[Email] Gmail configuration missing! (GMAIL_USER, GMAIL_APP_PASSWORD)');
        console.log(`[Approval Link For Dev] ${approveUrl}`);
        return { success: false, error: 'Configuration Missing' };
    }

    try {
        await transporter.sendMail({
            from: `"EduFlow AI" <${process.env.GMAIL_USER}>`,
            to: adminEmail,
            subject: `[EduFlow AI] 신규 가입 승인 요청: ${userName} (${userEmail})`,
            html: `
                <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
                    <div style="background-color: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 25px rgba(0,0,0,0.05);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; color: white; font-weight: 800; font-size: 20px; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);">
                                EF
                            </div>
                            <h2 style="color: #1e293b; margin-top: 24px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">신규 가입 승인 요청</h2>
                        </div>
                        
                        <p style="font-size: 16px; color: #475569; line-height: 1.7; text-align: center; margin-bottom: 32px;">
                            에듀플로우 AI에 새로운 컨설턴트가 가입을 신청했습니다.<br/>아래 정보를 확인하신 후 승인 여부를 결정해 주세요.
                        </p>
                        
                        <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                            <div style="margin-bottom: 16px;">
                                <span style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px;">가입자 이름</span>
                                <span style="font-size: 18px; font-weight: 700; color: #0f172a;">${userName}</span>
                            </div>
                            <div>
                                <span style="display: block; font-size: 12px; color: #64748b; margin-bottom: 4px;">이메일 주소</span>
                                <span style="font-size: 16px; color: #0f172a;">${userEmail}</span>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${approveUrl}" 
                               style="display: inline-block; background: #6366f1; color: white; padding: 18px 40px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 16px; transition: all 0.2s;">
                                즉시 가입 승인하기
                            </a>
                            <p style="margin-top: 24px; color: #ef4444; font-size: 13px; font-weight: 500;">
                                * 승인 버튼을 누르면 해당 계정의 서비스 이용 권한이 즉시 활성화됩니다.
                            </p>
                        </div>
                    </div>
                    
                    <p style="margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        본 메일은 에듀플로우 AI 시스템에서 자동으로 발송되었습니다.<br/>
                        © 2024 EduFlow AI. All rights reserved.
                    </p>
                </div>
            `,
        });

        console.log('[Email] Gmail approval request sent successfully');
        return { success: true };
    } catch (err: any) {
        console.error('[Email] Gmail Send Error:', err.message);
        return { success: false, error: err };
    }
}
