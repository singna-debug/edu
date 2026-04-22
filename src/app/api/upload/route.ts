import { NextRequest, NextResponse } from 'next/server';
import { driveService, DriveTokens } from '@/lib/googleDrive';
import { studentService } from '@/lib/services/studentService';
import { autoTagContent } from '@/lib/gemini';
import { getDb } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/auth-server'; // 추가됨
import type { StudentFile } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const studentId = formData.get('studentId') as string;
        const consultantId = formData.get('consultantId') as string;
        
        const category = formData.get('category') as string;
        const semester = formData.get('semester') as string;
        const folderId = formData.get('folderId') as string || undefined;
        const driveParentId = formData.get('driveParentId') as string || undefined;

        // [중요] 권한 체크: 본인이거나 초대된 조교인 경우 허용
        if (consultantId && decodedToken.uid !== consultantId) {
            const dbRef = getDb();
            const managerDoc = await dbRef.collection('managers').doc(decodedToken.email || '').get();
            const managerData = managerDoc.data();
            
            // 조교 명단에 있고, 부모 ID가 요청한 consultantId와 일치하는지 확인
            if (!managerDoc.exists || managerData?.parentId !== consultantId) {
                return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to upload for this consultant' }, { status: 403 });
            }
            console.log(`[Upload] Manager ${decodedToken.email} authorized for consultant ${consultantId}`);
        }

        if (!file || !studentId || !category) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
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

                console.log(`[Upload] Consultant: ${consultantId}, Found Tokens: Acc(${!!acc}), Ref(${!!ref})`);

                if ((acc && acc !== 'undefined') || (ref && ref !== 'undefined')) {
                    tokens = {
                        accessToken: (acc && acc !== 'undefined') ? acc : undefined,
                        refreshToken: (ref && ref !== 'undefined') ? ref : undefined
                    };
                }
            } else {
                console.warn(`[Upload] Consultant document not found: ${consultantId}`);
            }
        }

        // [완화] 토큰이 없어도 AI 분석을 위해 일단 진행합니다. (구글 드라이브 업로드만 나중에 실패 처리)
        if (!tokens) {
            console.warn('[Upload] No Google Drive tokens found for:', consultantId, '. Will proceed with AI analysis only.');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const contentType = file.type;

        // 1. GCS 업로드 스킵 (유료 플랜 미사용으로 주석 처리)
        // const gcsPath = buildGcsPath(studentId, category, fileName);
        // const gcsUri = await uploadToGcs(buffer, gcsPath, contentType);
        const gcsPath = ""; 

        // [중요 수정] 드라이브 부모 폴더 ID가 비어있을 경우, 학생의 기본 루트 폴더를 Firestore에서 조회하여 보완
        let finalDriveParentId = driveParentId;
        if (!finalDriveParentId && studentId) {
            const dbRef = getDb();
            try {
                const studentDoc = await dbRef.collection('students').doc(studentId).get();
                if (studentDoc.exists) {
                    finalDriveParentId = studentDoc.data()?.driveFolderId;
                    if (finalDriveParentId) {
                        console.log(`[Upload] Using Student Root Folder as fallback: ${finalDriveParentId}`);
                    }
                }
            } catch (err) {
                console.error("[Upload] Error fetching student root folder fallback:", err);
            }
        }

        // 2. 해당 컨설턴트의 개인 구글 드라이브에 업로드 (백그라운드 비동기 처리 - 속도 향상)
        let driveFileId = '';
        const driveError: string | null = null;
        
        // [핵심] 드라이브 업로드를 기다리지 않고 비동기로 실행 (Fire and forget if needed for UI speed)
        // 하지만 ID를 저장하려면 기다려야 하므로, 여기서는 최대한 빠르게 시도하고 실패 시 로그만 남김
        try {
            if (tokens) {
                console.log(`[Upload] Triggering Async Drive Sync for: ${consultantId}`);
                // [참고] 일부러 await를 하지만, 업로드 도중 에러가 나더라도 Firestore 저장은 막지 않음
                driveFileId = await driveService.uploadFile(fileName, buffer, contentType, tokens, consultantId, finalDriveParentId);
                console.log(`[Upload] Drive Sync Success: ${driveFileId}`);
            }
        } catch (err: any) {
            console.error(`[Upload] Drive Sync error (background): ${err.message}`);
        }

        // AI 분석 없이 즉시 텍스트(메타데이터)만Firestore 저장
        const memo = formData.get('memo') as string || '';
        const summary = memo;
        const uploadedAt = new Date().toISOString();

        // 4. Firestore 저장 (이 정보가 리스트에 노출됨 - 공짜!)
        const fileData: Omit<StudentFile, 'id' | 'uploadedAt'> = {
            studentId: studentId || '',
            fileName: fileName || '',
            gcsPath: '', // GCS 스킵 (유료 방지)
            driveFileId: driveFileId || '', // 드라이브 ID (SaaS 활용)
            fileType: (fileName.split('.').pop()?.toLowerCase() === 'pdf' ? 'pdf' : (fileName.split('.').pop()?.toLowerCase() === 'hwp' ? 'hwp' : (contentType.startsWith('image/') ? 'image' : 'other'))) as any,
            category: category || '',
            folderId: folderId || '',
            semester: semester || '',
            parsedText: '',
            tags: [],
            summary: summary || '',
        };

        const dbRef = getDb();
        const docRef = await dbRef.collection('files').add({
            ...fileData,
            uploadedAt,
        });

        // 즉시 응답하여 메모 모달이 빨리 뜨게 함
        return NextResponse.json({ 
            success: true, 
            data: { id: docRef.id, ...fileData, uploadedAt },
            driveError: driveFileId ? null : 'Pending Sync' 
        });

    } catch (error: any) {
        console.error('Upload Route Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
