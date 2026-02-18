// 공통 타입 정의
export interface Student {
    id: string;
    name: string;
    grade: number; // 1, 2, 3
    school: string;
    targetUniv?: string;
    targetMajor?: string;
    consultantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Memo {
    id: string;
    studentId: string;
    content: string;
    tags: string[];
    category: string;
    createdAt: string;
}

export interface StudentFile {
    id: string;
    studentId: string;
    fileName: string;
    gcsPath: string;
    fileType: 'pdf' | 'hwp' | 'image' | 'other';
    category: string;
    parsedText?: string;
    tags: string[];
    summary?: string;
    uploadedAt: string;
}

export interface SubjectGrade {
    name: string;
    score?: number;
    grade?: number; // 1-9 등급
    rank?: string;
    average?: number;
    standardScore?: number;
    percentile?: number;
}

export interface GradeRecord {
    id: string;
    studentId: string;
    examType: '내신' | '모의고사';
    year: number;
    semester?: number; // 1 or 2
    examPeriod?: '중간고사' | '기말고사'; // 내신일 경우
    month?: number; // 모의고사일 경우 (3, 6, 9, 11)
    subjects: SubjectGrade[];
    createdAt: string;
}

export interface Report {
    id: string;
    studentId: string;
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
    pdfUrl?: string;
    gcsPath?: string;
    status: 'draft' | 'approved';
    content?: string;
}

export interface CompetencyScore {
    학업역량: number;
    진로역량: number;
    자기주도성: number;
    발전가능성: number;
    공동체의식: number;
}

export interface AIAnalysis {
    studentId: string;
    competencyScores: CompetencyScore;
    evidences: {
        competency: string;
        score: number;
        evidence: string;
    }[];
    lastUpdated: string;
}

export interface Consultant {
    id: string;
    name: string;
    email: string;
    telegramChatId?: string;
    authToken?: string;
}

// 합격 데이터 벤치마크
export interface AdmissionBenchmark {
    id: string;
    university: string;        // 대학명
    major: string;             // 학과명
    year: number;              // 년도
    gpaAvg: number;            // 합격자 내신 평균 등급
    koreanAvg?: number;        // 국어 백분위 평균
    mathAvg?: number;          // 수학 백분위 평균
    englishGrade?: number;     // 영어 등급 평균
    scienceAvg?: number;       // 탐구 백분위 평균
    admissionType: '수시' | '정시';  // 전형 구분
    createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
