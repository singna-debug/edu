// API 인증 미들웨어
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from './firebaseAdmin';

/**
 * Firebase Auth 토큰 검증 미들웨어
 * Authorization: Bearer <idToken> 헤더에서 토큰 추출 후 검증
 */
export async function verifyAuth(request: NextRequest): Promise<{
    authenticated: boolean;
    uid?: string;
    email?: string;
    error?: string;
}> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { authenticated: false, error: '인증 토큰이 필요합니다.' };
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(token);

        return {
            authenticated: true,
            uid: decoded.uid,
            email: decoded.email,
        };
    } catch {
        return { authenticated: false, error: '유효하지 않은 인증 토큰입니다.' };
    }
}

/**
 * 인증 실패 시 401 응답 생성 헬퍼
 */
export function unauthorizedResponse(message?: string): NextResponse {
    return NextResponse.json(
        { success: false, error: message || '인증이 필요합니다.' },
        { status: 401 }
    );
}
