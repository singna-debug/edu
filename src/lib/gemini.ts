// Gemini AI API 래퍼
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI;
let model: GenerativeModel;
let embeddingModel: GenerativeModel;

/**
 * JSON 응답에서 불필요한 코드 블록이나 공백 제거
 */
function cleanJson(text: string): string {
    // 1. Markdown 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
    let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
    
    // 2. 양 끝 공백 제거
    cleaned = cleaned.trim();
    
    // 3. 만약 여전히 { 나 [ 로 시작하지 않는다면, 첫 { 나 [ 부터 마지막 } 나 ] 까지만 추출 시도
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
        const startMatch = cleaned.match(/[\{\[]/);
        if (startMatch) {
            const startIndex = startMatch.index!;
            const lastIndex = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
            if (lastIndex > startIndex) {
                cleaned = cleaned.substring(startIndex, lastIndex + 1);
            }
        }
    }

    return cleaned;
}

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAI;
}

export function getGeminiModel(): GenerativeModel {
    if (!model) {
        model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
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
            model: 'gemini-2.5-flash',
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
        model: 'gemini-2.5-flash',
        systemInstruction,
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const result = await m.generateContent(prompt);
    const text = result.response.text();
    try {
        return JSON.parse(cleanJson(text)) as T;
    } catch (err) {
        console.error('JSON Parsing Error in generateJSON:', err, '\nRaw Text:', text);
        throw new Error('AI 응답을 해석할 수 없습니다. 형식이 올바르지 않습니다.');
    }
}

/**
 * 파일 카테고리 자동 태깅
 */
export async function autoTagContent(text: string): Promise<{
    category: string;
    tags: string[];
    summary: string;
}> {
    const prompt = `다음 학생 활동 텍스트를 분석하여 JSON으로 구체적으로 응답하시오.

분석할 텍스트:
${text.substring(0, 4000)}

응답 형식 및 분석 지침:
{
  "category": "수행평가 | 자율활동 | 진로활동 | 봉사활동 | 동아리 | 성적표 | 기타" 중 하나로 분류,
  "tags": ["가장 중요한 핵심 키워드 5개 배열"],
  "summary": "학생의 구체적인 활동 내용, 탐구 주제, 결과 및 배운 점을 포함하여 3~5문장으로 상세히 요약하시오 (300자 내외). 
              단순히 파일 형식을 언급하기보다 '무엇을 위해', '어떤 주제로', '어떤 역량을 발휘했는지'를 전문적으로 서술하시오."
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

/**
 * 이미지(사진)에서 학생 성적표 또는 시간표 데이터 추출
 */
export async function analyzeImage<T>(
    base64Data: string,
    mimeType: string,
    prompt: string
): Promise<T> {
    const m = getGenAI().getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const result = await m.generateContent([
        {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        },
        prompt,
    ]);

    const text = result.response.text();
    try {
        return JSON.parse(cleanJson(text)) as T;
    } catch (err) {
        console.error('JSON Parsing Error in analyzeImage:', err, '\nRaw Text:', text);
        throw new Error('이미지 분석 결과를 해석할 수 없습니다. 다시 시도해 주세요.');
    }
}

/**
 * 성적표 사진 분석 전용 (내신/모의고사 정밀 분석)
 */
export async function analyzeGradeImage(base64Data: string, mimeType: string, currentStudentGrade?: number) {
    const prompt = `이 성적표 이미지(생활기록부 또는 모의고사 성적표)를 분석하여 JSON 배열로 추출하시오.
    현재 학생의 학년은 ${currentStudentGrade || '알 수 없음'}학년입니다.
    
    [JSON 가이드라인 - 엄격히 준수]
    1. 모든 문자열 키와 값은 반드시 큰따옴표(")를 사용하시오.
    2. JSON 내부에 절대 주석(// 또는 /* */)을 포함하지 마시오.
    3. 객체나 배열의 마지막 요소 뒤에 절대 쉼표(Trailing Comma)를 넣지 마시오.
    4. 숫자 데이터가 없을 경우 null이 아닌 0으로 입력하거나 필드를 생략하시오.

    [핵심 분석 지시]
    1. 시험 유형(examType) 판단: '내신' 또는 '모의고사' 중 하나로 판단하시오.
    2. 학년(studentGrade) 및 기간 인식: 
       - 내신: '1학년 1학기 중간고사'와 같이 학년, 학기, 기간을 구분하시오.
       - 모의고사: '2학년 9월 모의고사'와 같이 학년과 시행 월을 정확히 인식하시오.
    3. 데이터 추출: 원점수, 표준점수, 백분위, 등급, 석차, 수강자수, 평균, 표준편차를 정확히 추출하시오.
    
    표준 응답 구조:
    [
      {
        "info": {
          "examType": "내신", 
          "studentGrade": 1, 
          "semester": 1,
          "examPeriod": "중간고사",
          "month": 0
        },
        "subjects": [
          {
            "name": "국어",
            "score": 95,
            "standardScore": 0,
            "percentile": 0,
            "grade": 1,
            "rank": "1/200",
            "studentCount": 200,
            "average": 72.5,
            "stdDev": 15.2
          }
        ]
      }
    ]
    
    - 위 형식을 완벽하게 따르는 순수 JSON 배열만 응답하시오.
    - 여러 시험이 한 사진에 있다면 배열에 모두 담으시오.`;

    return analyzeImage<any[]>(base64Data, mimeType, prompt);
}

/**
 * 시간표 사진 분석 전용
 */
export async function analyzeTimetableImage(base64Data: string, mimeType: string) {
    const prompt = `이 주간 시간표 이미지에서 요일별/교시별 과목명을 JSON으로 추출하시오.
    
    형식:
    {
      "월": ["1교시과목", "2교시과목", "3교시과목", ...],
      "화": [...],
      "수": [...],
      "목": [...],
      "금": [...]
    }
    
    점심시간이나 공강인 경우 빈 문자열("")로 채우시오.`;

    return analyzeImage<Record<string, string[]>>(base64Data, mimeType, prompt);
}

/**
 * 웹 페이지 내용에서 교과 목차 및 정보 추출
 */
export async function analyzeWebResource(html: string) {
    // HTML 정제: 스크립트, 스타일, SVG, iframe 등 분석에 불필요한 태그 제거 및 공백 최적화
    const cleanedHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 150000); // 15만 자로 확장

    const prompt = `다음 웹 페이지의 HTML 내용을 분석하여 교과 리소스 정보(과목명, 출판사, 목차)를 JSON으로 추출하시오.
    분석할 내용:
    ${cleanedHtml}

    [JSON 가이드라인]
    1. 과목명(subjectName): 가장 적합한 과목명을 추출하시오. (예: 물리학Ⅱ, 미적분)
    2. 출판사(publisher): 출판사명을 추출하시오. (예: 비상교육, 더퀘스트)
    3. 목차(tableOfContents): 대단원, 중단원 등을 포함한 상세 목차를 사람이 읽기 좋은 텍스트 형식으로 추출하시오. (줄바꿈 포함)
    
    * 쇼핑몰(알라딘 등) 페이지의 경우, 제품 상세 설명이나 메타데이터에 포함된 목차 정보를 집중적으로 찾으시오.

    구조:
    {
      "subjectName": "과목명",
      "publisher": "출판사명",
      "tableOfContents": "1. 역학적 에너지\\n  - 운동 에너지...\\n2. 열역학..."
    }

    위 형식을 완벽하게 따르는 순수 JSON만 응답하시오.`;

    return generateJSON<{ subjectName: string; publisher: string; tableOfContents: string }>(prompt);
}

/**
 * 사용자가 입력한 날 것의 목차 텍스트를 AI 검색에 최적화된 형식으로 정형화
 */
export async function formatTocWithAI(rawText: string) {
    const prompt = `다음은 사용자가 도서 또는 학습 리소스에서 복사한 정제되지 않은 목차 데이터이다. 
    이를 분석하여 AI 검색이 용이하도록 대단원, 중단원, 핵심 키워드가 포함된 깔끔한 구조로 정형화하여 응답하라.

    분석할 텍스트:
    ${rawText.substring(0, 8000)}

    [정형화 가이드라인]
    1. 계층 구조 유지: 대단원(Ⅰ, Ⅱ...), 중단원(1, 2...), 소단원 순으로 줄바꿈을 사용하여 정리하라.
    2. 불필요한 정보 제거: 페이지 번호, 저작권 문구, 광고성 멘트 등은 모두 삭제하라.
    3. 검색 최적화: 각 단원 뒤에 해당 단원에서 다루는 주요 과학적/학술적 핵심 키워드를 괄호() 안에 추가하라.
    4. 가독성: 불필요한 특수문자는 제거하고 사람이 읽기 좋게 들여쓰기를 활용하라.

    [응답 형식]
    {
      "formattedToc": "정형화된 목차 텍스트 (줄바꿈 포함)"
    }

    위 형식을 완벽하게 따르는 순수 JSON만 응답하라.`;

    return generateJSON<{ formattedToc: string }>(prompt);
}

/**
 * 생활기록부 PDF 파싱 (텍스트 원문 및 표 완벽 추출)
 */
export async function parseSchoolRecordPDF(base64Data: string, mimeType: string): Promise<string> {
    const genAIInstance = getGenAI();
    
    // Use gemini-2.5-flash as the primary engine for ultra-low real-time latency (blazing fast!)
    const modelName = 'gemini-2.5-flash';
    const m = genAIInstance.getGenerativeModel({ model: modelName });
    
    const promptText = `당신은 생활기록부 전문 고속 텍스트 판독기입니다.
입력된 PDF 페이지 이미지에서 텍스트를 정확하게 판독하여 플레인 텍스트(Plain Text) 형태로 무손실 추출해 주십시오.

[핵심 지침]
1. 표 모양(마크다운 표 등)을 억지로 재구성하거나 다시 그릴 필요가 전혀 없습니다. 표가 있던 자리의 텍스트는 행(Row) 단위로 자연스럽게 글자만 읽어서 출력해 주십시오.
2. 행정용 메타데이터, 헤더, 푸터(예: 출력 학교명, 출력 일시, 문서확인번호, 페이지 번호 "1/21")는 불필요한 노이즈이므로 추출하지 말고 완전히 제외하십시오.
3. 텍스트의 어떤 내용도 누락, 요약, 변형하지 말고 있는 그대로 100% 무손실로 추출하십시오.
4. 오직 판독된 본문 텍스트만 응답하고, 다른 부연 설명이나 설명용 마크다운 기호 등은 일절 생략하십시오.`;

    console.log(`[SchoolRecord] Initializing ultra-fast visual OCR using ${modelName}...`);
    const result = await m.generateContent([
        {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        },
        promptText
    ]);
    return result.response.text();
}
