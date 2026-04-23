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

                const hasAcc = (acc && acc !== 'undefined' && acc.length > 10);
                const hasRef = (ref && ref !== 'undefined' && ref.length > 10);

                console.log(`[Upload] Consultant: ${consultantId} | DB Tokens: Access(${hasAcc}), Refresh(${hasRef})`);

                if (hasAcc || hasRef) {
                    tokens = {
                        accessToken: hasAcc ? acc : undefined,
                        refreshToken: hasRef ? ref : undefined
                    };
                }
            } else {
                console.warn(`[Upload] Consultant document not found in DB: ${consultantId}`);
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

        // [경로 자동 생성 로직 - 서버 사이드 강제화 (Bulletproof)]
        // 프론트엔드의 driveParentId에 의존하지 않고 서버가 무조건 전체 경로를 검증 및 생성합니다.
        // 목표 구조: EduFlow_Files > 학생루트(학생명_학교명) > 학년 > 학기 > 카테고리 > [선택적 서브폴더] > 파일
        let currentParentId = (driveParentId === 'undefined' || driveParentId === 'null' || !driveParentId) ? undefined : driveParentId;

        if (tokens && studentId) {
            try {
                const dbRef = getDb();
                const studentDoc = await dbRef.collection('students').doc(studentId).get();
                const studentData = studentDoc.data();
                
                if (studentData) {
                    let studentRootId = studentData.driveFolderId;
                    const studentName = studentData.name || '이름없음';
                    const studentSchool = studentData.school || '학교미정';
                    const GLOBAL_ROOT_NAME = 'EduFlow_Files';

                    // 1. 글로벌 루트 및 학생 루트 보장
                    if (!studentRootId || studentRootId === 'undefined' || studentRootId === 'null') {
                        console.log(`[Upload] Creating missing student root for: ${studentName}`);
                        const globalRootId = await driveService.getOrCreateFolder(GLOBAL_ROOT_NAME, tokens, consultantId, 'root');
                        if (globalRootId) {
                            studentRootId = await driveService.getOrCreateFolder(`${studentName}_${studentSchool}`, tokens, consultantId, globalRootId);
                            // DB 업데이트 (다음에 또 생성 안 하게)
                            if (studentRootId) {
                                await dbRef.collection('students').doc(studentId).update({ driveFolderId: studentRootId });
                            }
                        }
                    }

                    // 2. 경로 (학년 > 학기 > 카테고리) 서버에서 순차적 보장
                    let gradeName = "";
                    let semesterName = "";
                    
                    if (semester && semester.includes('학년')) {
                        const parts = semester.split(' ');
                        gradeName = parts[0];
                        semesterName = parts[1];
                    } else if (semester && semester.includes('-')) {
                        const [g, s] = semester.split('-');
                        gradeName = `${g}학년`;
                        semesterName = `${s}학기`;
                    } else if (semester) {
                        gradeName = semester;
                    }

                    // 빈 값은 필터링하여 유효한 경로 배열 생성
                    const pathNames = [gradeName, semesterName, category].filter(Boolean);
                    
                    let resolvedParentId = studentRootId;
                    if (resolvedParentId) {
                        for (const folderName of pathNames) {
                            resolvedParentId = await driveService.getOrCreateFolder(folderName, tokens, consultantId, resolvedParentId);
                        }
                    }

                    // 3. 서브폴더가 있다면 카테고리 폴더 하위에 생성
                    if (folderId && folderId !== 'root' && folderId !== 'undefined') {
                        const subfolderName = formData.get('folderName') as string || '기타';
                        if (resolvedParentId) {
                            resolvedParentId = await driveService.getOrCreateFolder(subfolderName, tokens, consultantId, resolvedParentId);
                        }
                    }

                    // 4. 결정된 최종 부모 ID를 currentParentId로 덮어씀
                    if (resolvedParentId) {
                        currentParentId = resolvedParentId;
                    } else if (!currentParentId) {
                        // 최후의 폴백: 어떻게든 EduFlow_Files 안에는 넣음
                        currentParentId = await driveService.getOrCreateFolder(GLOBAL_ROOT_NAME, tokens, consultantId, 'root') as string;
                    }
                }
            } catch (pathErr: any) {
                console.error("[Upload] Server-side path creation failed:", pathErr);
                
                // 자가 치유 로직: 휴지통으로 이동되거나 삭제된 폴더를 참조하여 404 에러가 발생한 경우
                if ((pathErr.status === 404 || pathErr.code === 404 || pathErr.message?.includes('File not found')) && studentId) {
                    console.warn(`[Drive Healing] Resetting broken studentRootId for ${studentId}`);
                    const dbRef = getDb();
                    await dbRef.collection('students').doc(studentId).update({ driveFolderId: '' });
                    return NextResponse.json({ 
                        success: false, 
                        error: '드라이브 폴더 구조가 손상되어 초기화했습니다. 다시 업로드 버튼을 눌러주세요.' 
                    }, { status: 400 });
                }
                
                // 그 외의 에러는 그대로 프론트로 던져서 원인을 파악하게 함
                return NextResponse.json({ 
                    success: false, 
                    error: `폴더 생성 실패: ${pathErr.message}` 
                }, { status: 500 });
            }
        }

        // [최종 부모 ID 정제] 'undefined' 문자열이 들어가는 것 방지
        if (currentParentId === 'undefined' || currentParentId === 'null') {
            currentParentId = undefined;
        }

        // 2. 해당 컨설턴트의 개인 구글 드라이브에 업로드
        let driveFileId = '';
        if (tokens) {
            if (!currentParentId) {
                console.error("[Upload] Critical Error: currentParentId is undefined. Aborting Drive upload to prevent saving to root.");
                return NextResponse.json({ 
                    success: false, 
                    error: '드라이브 부모 폴더 ID가 비어있습니다. 폴더 생성 단계를 확인해주세요.' 
                }, { status: 500 });
            }
            try {
                console.log(`[Upload] Uploading to Drive: ${fileName} in Parent: ${currentParentId}`);
                driveFileId = await driveService.uploadFile(fileName, buffer, contentType, tokens, consultantId, currentParentId);
                console.log(`[Upload] Drive Sync Success: ${driveFileId}`);
            } catch (err: any) {
                console.error(`[Upload] Drive Sync error: ${err.message}`);
                return NextResponse.json({ 
                    success: false, 
                    error: `파일 업로드 실패: ${err.message}` 
                }, { status: 500 });
            }
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
