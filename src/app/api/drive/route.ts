import { NextRequest, NextResponse } from 'next/server';
import { driveService, DriveTokens } from '@/lib/googleDrive';
import { getDb } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            console.error('[API Drive] Unauthorized access attempt');
            return NextResponse.json({ success: false, error: '인증되지 않은 접근입니다. 다시 로그인해 주세요.' }, { status: 401 });
        }

        const body = await req.json();
        const { action, name, parentId, fileId, oldParentId, newParentId, consultantId } = body;
        
        // 보안 검증: 토큰의 UID가 요청 본문의 consultantId와 일치해야 함
        if (consultantId && decodedToken.uid !== consultantId) {
            console.error('[API Drive] Consultant ID mismatch:', { tokenUid: decodedToken.uid, bodyId: consultantId });
            return NextResponse.json({ success: false, error: '본인의 데이터만 수정할 수 있습니다.' }, { status: 403 });
        }

        // 컨설턴트의 구글 드라이브 토큰 가져오기 (SaaS 연동)
        let tokens: DriveTokens | undefined;
        if (consultantId) {
            const dbRef = getDb();
            const consultantDoc = await dbRef.collection('consultants').doc(consultantId).get();
            if (consultantDoc.exists) {
                const data = consultantDoc.data();
                const acc = data?.google_access_token;
                const ref = data?.google_refresh_token;

                if ((acc && acc !== 'undefined') || (ref && ref !== 'undefined')) {
                    tokens = {
                        accessToken: (acc && acc !== 'undefined') ? acc : undefined,
                        refreshToken: (ref && ref !== 'undefined') ? ref : undefined
                    };
                }
            }
        }

        if (!tokens) {
            return NextResponse.json({ success: false, error: '구글 드라이브 인증 정보가 유효하지 않습니다.' }, { status: 401 });
        }

        switch (action) {
            case 'createFolder':
                const newFolderId = await driveService.createFolder(name, tokens, consultantId, parentId);
                return NextResponse.json({ success: true, id: newFolderId });
            case 'getOrCreatePath':
                const { pathNames } = body;
                if (!pathNames || !Array.isArray(pathNames)) {
                    return NextResponse.json({ success: false, error: 'Path names required' }, { status: 400 });
                }
                
                let currentParentId = parentId; // Initial parentId (usually studentRootId)
                for (const folderName of pathNames) {
                    currentParentId = await driveService.getOrCreateFolder(folderName, tokens, consultantId, currentParentId);
                }
                return NextResponse.json({ success: true, id: currentParentId });
            case 'delete':
                if (fileId) await driveService.deleteFile(fileId, tokens, consultantId);
                return NextResponse.json({ success: true });
            case 'rename':
                if (fileId && name) await driveService.renameFile(fileId, name, tokens, consultantId);
                return NextResponse.json({ success: true });
            case 'moveFolder':
                if (fileId && newParentId) {
                    await driveService.moveFile(fileId, oldParentId, newParentId, tokens, consultantId);
                }
                return NextResponse.json({ success: true });
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API Drive Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
