// Analysis Search API Route (RAG)
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, studentId } = body;

        if (!query) {
            return NextResponse.json({ success: false, error: '검색어를 입력하세요.' }, { status: 400 });
        }

        // 프로덕션에서는:
        // import { ragSearch } from '@/lib/rag';
        // const result = await ragSearch(query, studentId);

        // 데모 응답
        const result = {
            answer: `"${query}"에 대한 검색 결과입니다.\n\n학생 활동 기록에서 관련 내용을 찾았습니다.`,
            sources: [
                { id: 'doc-1', text: '관련 활동 내용...', source: 'memo', category: '진로활동', score: 0.92 },
            ],
        };

        return NextResponse.json({ success: true, data: result });
    } catch {
        return NextResponse.json({ success: false, error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
