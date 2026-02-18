// RAG (Retrieval-Augmented Generation) 파이프라인
import { searchSimilar } from './vectordb';
import { generateText } from './gemini';

export interface RAGResult {
    answer: string;
    sources: {
        id: string;
        text: string;
        source: string;
        category: string;
        score: number;
    }[];
}

/**
 * RAG 기반 자연어 검색 + 답변 생성
 * 예: "OO학생의 물리 관련 활동 찾아줘"
 */
export async function ragSearch(
    query: string,
    studentId: string,
    topK: number = 5
): Promise<RAGResult> {
    // 1. 벡터 유사도 검색
    const results = await searchSimilar(query, topK, { studentId });

    if (results.length === 0) {
        return {
            answer: '관련 활동 기록을 찾을 수 없습니다.',
            sources: [],
        };
    }

    // 2. 검색된 문서를 컨텍스트로 조합
    const context = results
        .map(
            (r, i) =>
                `[출처 ${i + 1}] (${r.metadata.source || '알 수 없음'} / ${r.metadata.category || '미분류'}):\n${r.metadata.text || ''}`
        )
        .join('\n\n');

    // 3. Gemini로 종합 답변 생성
    const prompt = `너는 입시 전문 컨설턴트 비서다. 아래 학생 활동 기록에서 사용자의 질문에 정확하게 답변하라.
내용에 없는 정보는 추론하지 말고, 근거를 명확하게 인용하라.

## 사용자 질문
${query}

## 학생 활동 기록
${context}

## 응답 형식
1. 질문에 대한 답변을 먼저 제시
2. 각 근거의 출처를 [출처 N] 형태로 인용`;

    const answer = await generateText(prompt);

    return {
        answer,
        sources: results.map(r => ({
            id: r.id,
            text: (r.metadata.text || '').substring(0, 200),
            source: r.metadata.source || '',
            category: r.metadata.category || '',
            score: r.score,
        })),
    };
}
