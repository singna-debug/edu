// Gemini AI API 래퍼
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI;
let model: GenerativeModel;
let embeddingModel: GenerativeModel;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAI;
}

export function getGeminiModel(): GenerativeModel {
    if (!model) {
        model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
    return model;
}

export function getEmbeddingModel(): GenerativeModel {
    if (!embeddingModel) {
        embeddingModel = getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
    }
    return embeddingModel;
}

/**
 * 텍스트를 벡터 임베딩으로 변환
 */
export async function embedText(text: string): Promise<number[]> {
    const model = getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

/**
 * Gemini에 프롬프트를 보내고 텍스트 응답 받기
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const m = systemInstruction
        ? getGenAI().getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction,
        })
        : getGeminiModel();

    const result = await m.generateContent(prompt);
    return result.response.text();
}

/**
 * Gemini에 프롬프트를 보내고 JSON 응답 받기
 */
export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
    const m = getGenAI().getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction,
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const result = await m.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
}

/**
 * 파일 카테고리 자동 태깅
 */
export async function autoTagContent(text: string): Promise<{
    category: string;
    tags: string[];
    summary: string;
}> {
    const prompt = `다음 학생 활동 텍스트를 분석하여 JSON으로 응답하시오.

분석할 텍스트:
${text.substring(0, 3000)}

응답 형식:
{
  "category": "수행평가 | 자율활동 | 진로활동 | 봉사활동 | 동아리 | 성적표 | 기타" 중 하나,
  "tags": ["관련 키워드 태그 배열, 최대 5개"],
  "summary": "100자 이내 요약문"
}`;

    return generateJSON(prompt);
}

/**
 * 역량 분석 (5대 역량 점수 + 근거)
 */
export interface CompetencyAnalysis {
    학업역량: number;
    진로역량: number;
    자기주도성: number;
    발전가능성: number;
    공동체의식: number;
    evidences: {
        competency: string;
        score: number;
        evidence: string;
    }[];
}

export async function analyzeCompetency(
    allTexts: string[]
): Promise<CompetencyAnalysis> {
    const combinedText = allTexts.join('\n---\n').substring(0, 10000);

    const prompt = `다음은 한 학생의 활동 기록을 모은 것이다. 이를 분석하여 5개 역량 각각에 1~10점을 부여하고, 각 점수의 근거가 되는 원문 문장을 인용하라.

5개 역량:
1. 학업역량 - 학업 성취도, 학습 태도, 탐구 능력
2. 진로역량 - 진로 관련 활동, 전공 적합성
3. 자기주도성 - 자기주도적 학습, 도전 정신
4. 발전가능성 - 성장 추이, 잠재력
5. 공동체의식 - 협력, 봉사, 리더십

학생 활동 기록:
${combinedText}

다음 JSON 형식으로 응답하라:
{
  "학업역량": 점수(1-10),
  "진로역량": 점수(1-10),
  "자기주도성": 점수(1-10),
  "발전가능성": 점수(1-10),
  "공동체의식": 점수(1-10),
  "evidences": [
    {"competency": "역량명", "score": 점수, "evidence": "근거 문장"}
  ]
}`;

    const systemInstruction = '너는 입시 전문 컨설턴트이며, 학생 역량을 객관적으로 분석하는 전문가다.';
    return generateJSON<CompetencyAnalysis>(prompt, systemInstruction);
}
