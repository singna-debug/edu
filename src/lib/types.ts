// 공통 타입 정의
export interface Student {
    id: string;
    name: string;
    grade: number; // 1, 2, 3 (기본 표시용, entryYear가 있으면 자동 계산됨)
    entryYear?: number;          // 1학년이었던 연도 (자동 학년 계산용)
    school: string;
    classNumber?: number | null;        // 반
    studentNumber?: number | null;      // 번호
    teacherMemo?: string;        // 담임교사 메모 (자유 형식)
    studentMemo?: string;        // 학생 메모 (이름 하단 노출)
    timetableImageUrl?: string;  // 시간표 이미지 URL/data URL
    timetableData?: Record<string, string[]>; // 요일별 과목 배열 (월~금)
    targetUniv?: string;
    targetMajor?: string;
    parentPortalToken?: string;  // 학부모 포털 공유 토큰
    driveFolderId?: string;       // 구글 드라이브 학생 폴더 ID
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
    driveFileId?: string;        // 구글 드라이브 파일 ID
    fileType: 'pdf' | 'hwp' | 'image' | 'other';
    category: string;
    folderId?: string;          // 사용자 정의 하위 폴더 ID (null이면 카테고리 직하위)
    semester?: string;          // 학기 (예: '2-1')
    parsedText?: string;
    tags: string[];
    summary?: string;
    uploadedAt: string;
}

export interface SubjectGrade {
    name: string;
    score?: number | null;
    grade?: number | null; // 1-9 등급
    rank?: string | null;
    average?: number | null;
    stdDev?: number | null;
    studentCount?: number | null;
    standardScore?: number | null;
    percentile?: number | null;
}

export interface GradeRecord {
    id: string;
    studentId: string;
    examType: '내신' | '모의고사';
    year: number;
    studentGrade?: number; // 1, 2, 3학년
    semester?: number | null; // 1 or 2
    examPeriod?: '중간고사' | '기말고사' | null; // 내신일 경우
    month?: number | null; // 모의고사일 경우 (3, 6, 9, 11)
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

// 교과 리소스 (출판사, 학습 링크, 참고 파일)
export interface SubjectResource {
    id: string;
    studentId: string;
    subjectName: string;       // 과목명
    publisher?: string;        // 출판사
    tableOfContents?: string;  // 목차
    links: { label: string; url: string }[];  // 학습 링크
    files: { name: string; url: string }[];   // 참고 파일
}

// 도서 기록
export interface BookRecord {
    id: string;
    studentId: string;
    title: string;             // 책 제목
    author?: string;           // 저자
    imageUrl?: string;         // 책 표지 이미지 URL
    subject?: string;          // 관련 과목
    studentGrade: number;      // 학년 (1, 2, 3)
    memo?: string;             // 독서 메모
    createdAt: string;
}

// 생활기록부 (생기부) 기록
export interface SchoolRecord {
    id: string;
    studentId: string;
    fileName: string;
    fileUrl?: string;
    parsedText: string;
    uploadedAt: string;
}

// 9대 파일 카테고리
export const FILE_CATEGORIES = [
    '교과활동', '자율활동', '진로활동', '동아리',
    '행특', '수업량유연화', '수상경력', '봉사활동', '도서',
] as const;

export type FileCategory = typeof FILE_CATEGORIES[number];

// 파일 폴더 구조 (카테고리별 사용자 정의 폴더)
export interface FileFolder {
    id: string;
    studentId: string;
    name: string;
    category: FileCategory;
    semester: string;
    parentId: string | null; // null이면 루트(카테고리 직하위)
    driveFolderId?: string;   // 구글 드라이브 폴더 ID
    createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
