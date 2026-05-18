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
    
    const promptText = `당신은 생활기록부 전문 초고정밀 디지털 복원 인공지능입니다.
입력된 PDF는 학생의 고등학교 학교생활기록부(생기부) 스캔 이미지 또는 디지털 문서입니다.
각 페이지의 이미지(시각적 문서 레이아웃)를 극도로 정밀하게 스캔하고 시각적으로 "눈으로 직접 판독(OCR)"하여, 원래 표(Table)의 모양과 구조, 행/열 매칭을 한 치의 오차도 없이 100% 똑같이 마크다운(Markdown) 표 구조로 재구성해 주세요.

[문서 워터마크, 헤더, 푸터 제거 지침 (노이즈 제거)]
- 생활기록부 PDF 페이지마다 상단/하단에 반복적으로 인쇄되어 있는 행정용 메타데이터, 헤더, 푸터는 불필요한 노이즈이므로 마크다운 본문에서 **완전히 제거**해 주십시오.
- 제거 대상 예시:
  * 학교명 및 출력 정보: "광덕고등학교 2026년 3월 16일 1/21 반 7 번호 10 이름 류인승"
  * 정부 문서확인 및 신청인 정보: "문서확인번호: 1773-6676-4607-6183(신청인:류인승)"
  * 페이지 번호: "1/21", "2/21" 등
- 이러한 워터마크성 반복 문구들을 제외하고 오직 학생의 실제 교과/비교과 활동 내용만 순수하게 남기십시오.

[학년 및 학기 정보 누락 방지 지침 (Rowspan 완벽 복원)]
- 생활기록부 표(예: 수상경력, 출결상황, 창체활동, 성적표 등)에서 첫 번째 또는 두 번째 열의 '학년' 또는 '학기' 셀이 세로로 병합(Rowspan)되어 있는 경우, 마크다운 표로 변환할 때 하위 행들의 해당 칸을 빈칸으로 비워두지 마십시오.
- 병합된 학년 및 학기 값을 모든 하위 데이터 행에 **동일하게 복사하여 명시**해 주어야 합니다.
  * 예시 (원본): 
    학년 1이 세로로 6줄 병합되어 있고, 학기 1이 2줄, 학기 2가 4줄 병합되어 있다면:
    마크다운 표 변환 시 모든 행에 학년과 학기를 명확히 복사하여 적어줍니다:
    | 1학년(1학기) | 교과우수상... |
    | 1학년(1학기) | 교과창의상... |
    | 1학년(2학기) | 나눔실천상... |
    | 1학년(2학기) | 교내 수학경시대회... |
    | 1학년(2학기) | 교과우수상... |
    | 1학년(2학기) | 교과창의상... |
- 이렇게 모든 데이터 행에 '학년'과 '학기' 정보를 빈칸 없이 온전히 채워주셔야 테이블 렌더링이 정확하게 작동합니다!

[시각적 표(Table) 추출 엄격 지침 - 생기부 표 복원의 핵심]
1. 계층 구조 평탄화 (Flat Headers):
   - 원본 표에서 '결석일수' 아래에 '질병', '미인정', '기타' 칸이 나란히 병합되어 있다면, 이를 단일 행 헤더로 납작하게 통합해 주셔야 브라우저가 완벽한 격자로 그립니다.
   - 예시: | 학년 | 수업일수 | 결석일수_질병 | 결석일수_미인정 | 결석일수_기타 | 지각_질병 | 지각_미인정 | 지각_기타 | 조퇴_질병 | 조퇴_미인정 | 조퇴_기타 | 결과_질병 | 결과_미인정 | 결과_기타 | 특기사항 |
   - 칸의 개수가 아래 데이터 행과 1:1로 정확하게 일치해야 합니다. 절대로 헤더 칸 개수와 데이터 칸 개수가 다르게 파싱되어서는 안 됩니다.

2. 모든 칸의 데이터 채우기 (No Skewing):
   - 이미지 속 표의 가로 행들을 눈으로 하나씩 매칭해가며 데이터가 들어갈 올바른 칸을 찾으십시오.
   - 1학년 수업일수가 193일이고 질병/미인정 결석이 모두 0(또는 빈칸/점 '.')이라면, 아래와 같이 정밀하게 빈칸 또는 점('.')으로 열 매칭을 맞춰주십시오.
   - 예시: | 1 | 193 | . | . | . | . | . | . | . | . | . | . | . | . | 개근 |
   - 데이터가 누락되거나 옆 칸으로 밀려 들어가지 않도록 이미지의 세로 경계선(Grid Lines)을 기준으로 수직 매칭을 3번 교차 검증하십시오.

3. 성적표 및 학기별 표:
   - 교과발달상황(성적표)의 '원점수/과목평균', '표준편차', '성취도(수강자수)', '석차등급' 등의 표 구조 역시 원본의 열 순서와 세로 격자를 완벽하게 일치시켜 마크다운 표로 변환하십시오.

4. 텍스트 무손실 복원:
   - 텍스트의 어떤 내용도 요약하거나 생략하지 말고, 원래 적혀 있는 교사 평가 및 특기사항 문장을 100% 무손실로 온전히 마크다운 글머리 기호와 함께 적어주십시오.
   - 오직 마크다운 텍스트만 응답해 주세요. 다른 설명은 일체 생략하십시오.`;

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
