import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

/**
 * 이메일 버튼 클릭 시 유저를 승인하는 API
 * GET /api/admin/approve?userId=...&token=...
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    // 1. 보안 검증 (토큰이 일치해야 승인 가능)
    const adminToken = process.env.ADMIN_APPROVE_TOKEN;
    
    // 배포 환경에서 토큰이 설정되지 않았거나 일치하지 않으면 거부
    if (!adminToken || !token || token !== adminToken) {
        return new NextResponse(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #ef4444;">접근 거부</h1>
                <p>승인 보안 토큰이 일치하지 않거나 유효하지 않습니다.</p>
                <a href="/" style="color: #6366f1;">메인으로 돌아가기</a>
            </div>
        `, { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (!userId) {
        return new NextResponse('User ID is missing', { status: 400 });
    }

    try {
        const db = getDb();
        const userRef = db.collection('consultants').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return new NextResponse('유효하지 않은 사용자 정보입니다.', { status: 404 });
        }

        const userData = userDoc.data();
        
        // 2. 승인 처리
        await userRef.update({
            approved: true,
            approvedAt: new Date().toISOString()
        });

        console.log(`[Admin] User Approved via Email: ${userData?.email} (${userId})`);

        // 3. 성공 화면 반환
        return new NextResponse(`
            <div style="font-family: sans-serif; text-align: center; padding: 100px; background: #f9fafb; min-height: 100vh;">
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: inline-block; max-width: 400px;">
                    <div style="font-size: 50px; margin-bottom: 20px;">✅</div>
                    <h1 style="color: #111827; margin-bottom: 10px;">가입 승인 완료!</h1>
                    <p style="color: #4b5563; line-height: 1.5; margin-bottom: 25px;">
                        <strong>${userData?.display_name || '컨설턴트'}</strong>님의 계정이 성공적으로 승인되었습니다.<br/>
                        이제 해당# ============================================
# EduFlow AI - 환경 변수 설정
# ============================================
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
                       style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        대시보드로 가기
                    </a>
                </div>
            </div>
        `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } catch (err: any) {
        console.error('Approval API Error:', err);
        return new NextResponse(`오류 발생: ${err.message}`, { status: 500 });
    }
}
