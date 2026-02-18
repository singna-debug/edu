// Memos API Route
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const studentId = request.nextUrl.searchParams.get('studentId');

    const memos = [
        { id: 'm1', studentId: 'stu-001', content: '물리 심화 탐구 보고서 초안 제출. 엔트로피 관련 실험 설계 우수.', tags: ['물리', '탐구'], category: '진로활동', createdAt: '2026-02-17T14:30:00' },
        { id: 'm2', studentId: 'stu-001', content: '수학 경시대회 예선 통과. AMC 12 준비 중.', tags: ['수학', '경시대회'], category: '자율활동', createdAt: '2026-02-14T10:00:00' },
    ];

    const filtered = studentId ? memos.filter(m => m.studentId === studentId) : memos;
    return NextResponse.json({ success: true, data: filtered });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, content, tags, category } = body;

        if (!studentId || !content) {
            return NextResponse.json({ success: false, error: '학생 ID와 내용은 필수입니다.' }, { status: 400 });
        }

        const newMemo = {
            id: `m-${Date.now()}`,
            studentId,
            content,
            tags: tags || [],
            category: category || '기타',
            createdAt: new Date().toISOString(),
        };

        // 프로덕션에서는:
        // 1. Firestore에 메모 저장
        // 2. 텍스트 임베딩 생성 → Vector DB 저장
        // await upsertDocument(newMemo.id, content, { studentId, source: 'memo', category });

        return NextResponse.json({ success: true, data: newMemo }, { status: 201 });
    } catch {
        return NextResponse.json({ success: false, error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
