// Vector DB 클라이언트 (Pinecone 호환)
// 실제 프로덕션에서는 Pinecone SDK를 사용하며,
// 개발 환경에서는 인메모리 스토어로 대체 가능

import { embedText } from './gemini';

interface VectorRecord {
    id: string;
    values: number[];
    metadata: Record<string, string>;
}

interface SearchResult {
    id: string;
    score: number;
    metadata: Record<string, string>;
}

// 개발용 인메모리 벡터 스토어
const inMemoryStore: VectorRecord[] = [];

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 벡터 DB에 문서 저장 (임베딩 자동 생성)
 */
export async function upsertDocument(
    id: string,
    text: string,
    metadata: Record<string, string>
): Promise<void> {
    const values = await embedText(text);

    if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== 'your-pinecone-api-key') {
        // Pinecone REST API 호출
        const response = await fetch(
            `https://${process.env.PINECONE_INDEX}-${process.env.PINECONE_ENVIRONMENT}.svc.pinecone.io/vectors/upsert`,
            {
                method: 'POST',
                headers: {
                    'Api-Key': process.env.PINECONE_API_KEY!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vectors: [{ id, values, metadata: { ...metadata, text } }],
                }),
            }
        );
        if (!response.ok) {
            throw new Error(`Pinecone upsert failed: ${response.statusText}`);
        }
    } else {
        // 인메모리 스토어 (개발용)
        const existingIdx = inMemoryStore.findIndex(r => r.id === id);
        const record: VectorRecord = { id, values, metadata: { ...metadata, text } };
        if (existingIdx >= 0) {
            inMemoryStore[existingIdx] = record;
        } else {
            inMemoryStore.push(record);
        }
    }
}

/**
 * 벡터 유사도 검색
 */
export async function searchSimilar(
    query: string,
    topK: number = 5,
    filter?: Record<string, string>
): Promise<SearchResult[]> {
    const queryVector = await embedText(query);

    if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== 'your-pinecone-api-key') {
        const body: Record<string, unknown> = {
            vector: queryVector,
            topK,
            includeMetadata: true,
        };
        if (filter) {
            body.filter = Object.fromEntries(
                Object.entries(filter).map(([k, v]) => [k, { $eq: v }])
            );
        }

        const response = await fetch(
            `https://${process.env.PINECONE_INDEX}-${process.env.PINECONE_ENVIRONMENT}.svc.pinecone.io/query`,
            {
                method: 'POST',
                headers: {
                    'Api-Key': process.env.PINECONE_API_KEY!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );
        const data = await response.json();
        return (data.matches || []).map((m: { id: string; score: number; metadata: Record<string, string> }) => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata,
        }));
    } else {
        // 인메모리 검색
        let results = inMemoryStore.map(record => ({
            id: record.id,
            score: cosineSimilarity(queryVector, record.values),
            metadata: record.metadata,
        }));

        if (filter) {
            results = results.filter(r =>
                Object.entries(filter).every(([k, v]) => r.metadata[k] === v)
            );
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
}
