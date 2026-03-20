import { NextRequest } from 'next/server';
import { getAdminAuth } from './firebaseAdmin';

/**
 * API Route에서 클라이언트의 Firebase ID Token을 검증하는 서버 사이드 유틸리티
 */
export async function verifyAuth(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Server Auth] No Bearer token found in headers');
        return null; // 인증 실패
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        return decodedToken; // { uid, email, etc. }
    } catch (error) {
        console.error('[Server Auth] Token validation error:', error);
        return null;
    }
}
