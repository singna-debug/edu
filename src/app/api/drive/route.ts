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
        
        // [중요] 권한 체크: 본인이거나 초대된 조교인 경우 허용
        if (consultantId && decodedToken.uid !== consultantId) {
            const dbRef = getDb();
            const managerDoc = await dbRef.collection('managers').doc(decodedToken.email || '').get();
            const managerData = managerDoc.data();
            
            if (!managerDoc.exists || managerData?.parentId !== consultantId) {
                console.error('[API Drive] Forbidden access:', { tokenEmail: decodedToken.email, targetConsultant: consultantId });
                return NextResponse.json({ success: false, error: '본인 또는 소속된 대표님의 데이터만 수정할 수 있습니다.' }, { status: 403 });
            }
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

        // [수정] tokens가 없어도 getDriveClient 내부에서 전역 토큰(폴백)을 사용하므로 통과시킴
        const tokensToPass = tokens || { accessToken: '', refreshToken: '' };

        const GLOBAL_ROOT_NAME = 'EduFlow_Files';

        switch (action) {
            case 'createFolder':
                // 1. 부모 ID 정제
                let targetParentId = (parentId === 'null' || parentId === 'undefined' || !parentId) ? null : parentId;
                
                if (!targetParentId) {
                    // 부모가 없으면 EduFlow_Files를 찾거나 생성해서 거기다 넣음
                    targetParentId = (await driveService.getOrCreateFolder(GLOBAL_ROOT_NAME, tokensToPass, consultantId, 'root')) as string;
                }
                
                // getOrCreateFolder를 사용하여 중복 생성을 방지하면서 폴더 생성/ID 반환
                const createdId = await driveService.getOrCreateFolder(name, tokensToPass, consultantId, targetParentId);
                return NextResponse.json({ success: true, id: createdId });
            case 'getOrCreatePath':
                const { pathNames } = body;
                if (!pathNames || !Array.isArray(pathNames)) {
                    return NextResponse.json({ success: false, error: 'Path names required' }, { status: 400 });
                }
                
                // 1. 부모 ID 정제 (문자열 "null", "undefined" 등 방지)
                const safeParentId = (parentId === 'null' || parentId === 'undefined' || !parentId) ? null : parentId;
                
                let currentParentId: string;
                if (safeParentId) {
                    currentParentId = safeParentId;
                } else {
                    // 학생 루트가 없으면 EduFlow_Files부터 새로 찾음
                    currentParentId = (await driveService.getOrCreateFolder(GLOBAL_ROOT_NAME, tokensToPass, consultantId, 'root')) as string;
                    console.warn(`[Drive] No parentId provided, starting from GLOBAL_ROOT: ${currentParentId}`);
                }
                
                // 2. 나머지 경로 탐색/생성 
                console.log(`[Drive] Nesting Path: ${pathNames.join(' > ')} starting from ${currentParentId}`);
                for (const folderName of pathNames) {
                    currentParentId = (await driveService.getOrCreateFolder(folderName, tokensToPass, consultantId, currentParentId)) as string;
                }
                return NextResponse.json({ success: true, id: currentParentId });
            case 'delete':
                if (fileId) await driveService.deleteFile(fileId, tokensToPass, consultantId);
                return NextResponse.json({ success: true });
            case 'rename':
                if (fileId && name) await driveService.renameFile(fileId, name, tokensToPass, consultantId);
                return NextResponse.json({ success: true });
            case 'moveFolder':
                if (fileId && newParentId) {
                    await driveService.moveFile(fileId, oldParentId, newParentId, tokensToPass, consultantId);
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
