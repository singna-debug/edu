import { NextRequest, NextResponse } from 'next/server';
import { driveService, DriveTokens } from '@/lib/googleDrive';
import { studentService } from '@/lib/services/studentService';
import { autoTagContent } from '@/lib/gemini';
import { getDb } from '@/lib/firebaseAdmin';
import type { StudentFile } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const studentId = formData.get('studentId') as string;
        const consultantId = formData.get('consultantId') as string; // 추가됨
        const category = formData.get('category') as string;
        const semester = formData.get('semester') as string;
        const folderId = formData.get('folderId') as string || undefined;
        const driveParentId = formData.get('driveParentId') as string || undefined;

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

        // 2. 해당 컨설턴트의 개인 구글 드라이브에 업로드 (실패해도 AI 분석은 진행되도록 예외 처리)
        let driveFileId = '';
        try {
            if (tokens) {
                driveFileId = await driveService.uploadFile(fileName, buffer, contentType, tokens, consultantId, driveParentId);
            }
        } catch (driveErr: any) {
            console.warn('[Upload] Google Drive Sync Failed, but continuing with AI analysis:', driveErr.message);
            // 드라이브 업로드 실패 시에도 AI 분석을 위해 프로세스 계속 진행
        }

        // 3. AI 분석 (텍스트 추출 시도) - 드라이브 성공 여부와 상관없이 수행
        let parsedText = '';
        if (contentType === 'application/pdf') {
            try {
                // 더 호환성 높은 다이나믹 임포트 처리
                const pdfModule = await import('pdf-parse');
                const pdf = (pdfModule as any).default || pdfModule;
                
                // 만약 여전히 함수가 아니라면 (CommonJS 대응)
                const extractText = typeof pdf === 'function' ? pdf : (pdf as any);
                
                if (typeof extractText === 'function') {
                    const data = await extractText(buffer);
                    parsedText = data.text;
                    console.log(`[Upload] PDF parsed successfully: ${parsedText.length} chars`);
                }
            } catch (err) {
                console.error('PDF Parse Error:', err);
            }
        } else if (contentType.startsWith('text/') || contentType === 'application/json') {
            parsedText = buffer.toString('utf8');
        } else if (contentType.startsWith('image/')) {
            // 이미지의 경우 현재 OCR 엔진이 없으므로 파일명 기반으로 컨텐츠 유추
            parsedText = `이미지 파일: ${fileName}. 이 파일의 내용을 분석하려면 AI 이미지 인식 모듈이 필요합니다.`;
        }

        let tags: string[] = [];
        let summary = '';
        
        // 텍스트가 있거나 최소한 파일명이라도 있으면 분석 시도
        try {
            const analysis = await autoTagContent(parsedText || `파일명: ${fileName}, 카테고리: ${category}`);
            tags = analysis.tags || [];
            summary = analysis.summary || '';
        } catch (err) {
            console.error('AI Analysis Error:', err);
            summary = `${fileName} 파일이 업로드되었습니다.`;
        }

        // 4. Firestore 저장
        const fileData: Omit<StudentFile, 'id' | 'uploadedAt'> = {
            studentId: studentId || '',
            fileName: fileName || '',
            gcsPath: gcsPath || '',
            driveFileId: driveFileId || '',
            fileType: (fileName.split('.').pop()?.toLowerCase() === 'pdf' ? 'pdf' : (fileName.split('.').pop()?.toLowerCase() === 'hwp' ? 'hwp' : (contentType.startsWith('image/') ? 'image' : 'other'))) as any,
            category: category || '',
            folderId: folderId || '',
            semester: semester || '',
            parsedText: parsedText || '',
            tags: tags || [],
            summary: summary || '',
        };

        const uploadedAt = new Date().toISOString();
        const dbRef = getDb();
        const docRef = await dbRef.collection('files').add({
            ...fileData,
            uploadedAt,
        });

        return NextResponse.json({ success: true, data: { id: docRef.id, ...fileData, uploadedAt } });

    } catch (error: any) {
        console.error('Upload Route Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
