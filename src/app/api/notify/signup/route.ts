import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalRequestEmail } from '@/lib/email';

/**
 * 신규 가입 발생 시 관리자에게 이메일 알림을 보내는 내부 API
 * (nodemailer의 브라우저 로딩 빌드 에러를 피하기 위해 서버 사이드에서만 동작)
 */
export async function POST(req: NextRequest) {
    try {
        const { userEmail, userId, userName } = await req.json();

        if (!userEmail || !userId) {
            return NextResponse.json({ error: 'Missing information' }, { status: 400 });
        }

        console.log(`[Notify API] Sending signup notification for: ${userEmail}`);
        
        await sendApprovalRequestEmail(userEmail, userId, userName || '신규 사용자');

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Notify API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
