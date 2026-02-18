'use client';

import { useState, useRef, useCallback } from 'react';
import { use } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Filler,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
import type { Student, Memo, StudentFile, GradeRecord, SubjectGrade, CompetencyScore } from '@/lib/types';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement
);

// ============ DEMO DATA ============

const demoStudents: Record<string, Student> = {
    'stu-001': { id: 'stu-001', name: '김민준', grade: 2, school: '서울과학고등학교', targetUniv: '서울대학교', targetMajor: '물리학과', consultantId: 'demo', createdAt: '2025-03-15', updatedAt: '2026-02-17' },
    'stu-002': { id: 'stu-002', name: '이서연', grade: 3, school: '대원외국어고등학교', targetUniv: '연세대학교', targetMajor: '국제학과', consultantId: 'demo', createdAt: '2025-06-01', updatedAt: '2026-02-16' },
    'stu-003': { id: 'stu-003', name: '박지호', grade: 1, school: '한영중학교 (예비고1)', targetUniv: '미정', targetMajor: '공학 계열', consultantId: 'demo', createdAt: '2026-01-10', updatedAt: '2026-02-15' },
    'stu-004': { id: 'stu-004', name: '최수아', grade: 3, school: '민족사관고등학교', targetUniv: 'KAIST', targetMajor: '전산학부', consultantId: 'demo', createdAt: '2024-09-20', updatedAt: '2026-02-14' },
};

const initialMemos: Memo[] = [
    { id: 'm1', studentId: 'stu-001', content: '물리 심화 탐구 보고서 초안 제출. 엔트로피 관련 실험 설계 우수. 열역학 제2법칙을 독창적으로 접근.', tags: ['물리', '탐구', '열역학'], category: '진로활동', createdAt: '2026-02-17T14:30:00' },
    { id: 'm2', studentId: 'stu-001', content: '수학 경시대회 예선 통과. AMC 12 준비 중. 조합론 영역 보강 필요.', tags: ['수학', '경시대회'], category: '자율활동', createdAt: '2026-02-14T10:00:00' },
    { id: 'm3', studentId: 'stu-001', content: '물리 동아리에서 양자역학 세미나 발표. 파동-입자 이중성 주제. 발표력 우수.', tags: ['물리', '동아리', '발표'], category: '동아리', createdAt: '2026-02-10T15:30:00' },
    { id: 'm4', studentId: 'stu-001', content: '멘토링 봉사 활동 — 중학생 대상 물리 실험 기초 교육. 리더십 및 설명 능력 향상.', tags: ['봉사', '멘토링'], category: '봉사활동', createdAt: '2026-02-05T13:00:00' },
];

const initialFiles: StudentFile[] = [
    { id: 'f1', studentId: 'stu-001', fileName: '물리탐구보고서_엔트로피.pdf', gcsPath: 'stu-001/진로활동/2026/물리탐구보고서.pdf', fileType: 'pdf', category: '진로활동', tags: ['물리', '엔트로피'], summary: '열역학 제2법칙을 실생활에 적용한 실험 보고서', uploadedAt: '2026-02-15T09:00:00' },
    { id: 'f2', studentId: 'stu-001', fileName: '2학년_1학기_성적표.pdf', gcsPath: 'stu-001/성적표/2025/2-1성적표.pdf', fileType: 'pdf', category: '성적표', tags: ['성적'], summary: '2학년 1학기 내신 성적표', uploadedAt: '2025-07-10T14:00:00' },
    { id: 'f3', studentId: 'stu-001', fileName: '양자역학_세미나_발표자료.pdf', gcsPath: 'stu-001/동아리/2026/양자역학세미나.pdf', fileType: 'pdf', category: '동아리', tags: ['물리', '양자역학', '발표'], summary: '동아리 양자역학 세미나 발표 PPT', uploadedAt: '2026-02-10T16:00:00' },
];

const initialGrades: GradeRecord[] = [
    {
        id: 'g1', studentId: 'stu-001', examType: '내신', year: 2025, semester: 1, examPeriod: '중간고사',
        subjects: [
            { name: '국어', score: 90, grade: 2 },
            { name: '수학', score: 95, grade: 1 },
            { name: '영어', score: 85, grade: 3 },
            { name: '물리학Ⅰ', score: 96, grade: 1 },
            { name: '화학Ⅰ', score: 88, grade: 2 },
        ],
        createdAt: '2025-05-10',
    },
    {
        id: 'g1b', studentId: 'stu-001', examType: '내신', year: 2025, semester: 1, examPeriod: '기말고사',
        subjects: [
            { name: '국어', score: 92, grade: 2 },
            { name: '수학', score: 97, grade: 1 },
            { name: '영어', score: 88, grade: 3 },
            { name: '물리학Ⅰ', score: 98, grade: 1 },
            { name: '화학Ⅰ', score: 90, grade: 2 },
        ],
        createdAt: '2025-07-15',
    },
    {
        id: 'g2', studentId: 'stu-001', examType: '내신', year: 2025, semester: 2, examPeriod: '중간고사',
        subjects: [
            { name: '국어', score: 88, grade: 3 },
            { name: '수학', score: 96, grade: 1 },
            { name: '영어', score: 89, grade: 2 },
            { name: '물리학Ⅱ', score: 97, grade: 1 },
            { name: '화학Ⅱ', score: 91, grade: 2 },
        ],
        createdAt: '2025-10-15',
    },
    {
        id: 'g2b', studentId: 'stu-001', examType: '내신', year: 2025, semester: 2, examPeriod: '기말고사',
        subjects: [
            { name: '국어', score: 90, grade: 2 },
            { name: '수학', score: 98, grade: 1 },
            { name: '영어', score: 91, grade: 2 },
            { name: '물리학Ⅱ', score: 99, grade: 1 },
            { name: '화학Ⅱ', score: 93, grade: 1 },
        ],
        createdAt: '2025-12-20',
    },
    {
        id: 'g3', studentId: 'stu-001', examType: '모의고사', year: 2025, month: 6,
        subjects: [
            { name: '국어', standardScore: 128, percentile: 92 },
            { name: '수학', standardScore: 140, percentile: 98 },
            { name: '영어', grade: 2 },
            { name: '물리학Ⅰ', standardScore: 68, percentile: 97 },
        ],
        createdAt: '2025-06-15',
    },
    {
        id: 'g4', studentId: 'stu-001', examType: '모의고사', year: 2025, month: 9,
        subjects: [
            { name: '국어', standardScore: 131, percentile: 94 },
            { name: '수학', standardScore: 142, percentile: 99 },
            { name: '영어', grade: 1 },
            { name: '물리학Ⅰ', standardScore: 70, percentile: 99 },
        ],
        createdAt: '2025-09-15',
    },
];

const demoCompetency: CompetencyScore = {
    학업역량: 9,
    진로역량: 8,
    자기주도성: 8,
    발전가능성: 9,
    공동체의식: 7,
};

const demoEvidences = [
    { competency: '학업역량', score: 9, evidence: '수학·물리 과목에서 지속적 1등급을 유지하며, 경시대회 예선 통과 등 탁월한 학업 성취도를 보임.' },
    { competency: '진로역량', score: 8, evidence: '물리학 심화 탐구(엔트로피), 양자역학 세미나 등 전공 적합성이 매우 높은 활동 수행.' },
    { competency: '자기주도성', score: 8, evidence: '독자적으로 열역학 실험을 설계하고, AMC 경시대회를 스스로 준비하는 등 자기주도적 학습 태도 확인.' },
    { competency: '발전가능성', score: 9, evidence: '내신 성적이 1학년 대비 지속 상승 추세이며, 탐구 주제의 깊이가 심화되는 발전적 패턴 관찰.' },
    { competency: '공동체의식', score: 7, evidence: '멘토링 봉사 활동을 통해 리더십을 보여주나, 다양한 공동체 참여 경험의 확대 필요.' },
];

// ============ TABS ============

type Tab = 'overview' | 'memos' | 'files' | 'grades' | 'analysis' | 'search';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const student = demoStudents[id] || demoStudents['stu-001'];
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Toast state
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // Edit student state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: student.name,
        grade: student.grade,
        school: student.school,
        targetUniv: student.targetUniv || '',
        targetMajor: student.targetMajor || '',
    });

    // Memo state
    const [memos, setMemos] = useState<Memo[]>(initialMemos);
    const [newMemo, setNewMemo] = useState('');
    const [memoCategory, setMemoCategory] = useState('진로활동');
    const [memoTags, setMemoTags] = useState('');

    // File upload state
    const [files, setFiles] = useState<StudentFile[]>(initialFiles);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; parsing: boolean; result?: { category: string; tags: string[]; summary: string } } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Grade state
    const [grades, setGrades] = useState<GradeRecord[]>(initialGrades);
    const [showGradeForm, setShowGradeForm] = useState(false);
    const [gradeForm, setGradeForm] = useState({
        examType: '내신' as '내신' | '모의고사',
        year: 2026,
        semester: 1,
        examPeriod: '중간고사' as '중간고사' | '기말고사',
        month: 3,
        subjects: [{ name: '', score: undefined as number | undefined, grade: undefined as number | undefined }] as SubjectGrade[],
    });

    // Chart axis controls
    const [chartMinY, setChartMinY] = useState(80);
    const [chartMaxY, setChartMaxY] = useState(100);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<{ answer: string; sources: { text: string; category: string }[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'overview', label: '개요', icon: '📋' },
        { key: 'memos', label: '메모', icon: '📝' },
        { key: 'files', label: '파일', icon: '📁' },
        { key: 'grades', label: '성적', icon: '📊' },
        { key: 'analysis', label: 'AI 분석', icon: '🤖' },
        { key: 'search', label: 'AI 검색', icon: '🔍' },
    ];

    // ============ HANDLERS ============

    const handleAddMemo = () => {
        if (!newMemo.trim()) {
            showToast('⚠️ 메모 내용을 입력하세요.');
            return;
        }
        const memo: Memo = {
            id: `m-${Date.now()}`,
            studentId: student.id,
            content: newMemo,
            tags: memoTags.split(',').map(t => t.trim()).filter(Boolean),
            category: memoCategory,
            createdAt: new Date().toISOString(),
        };
        setMemos([memo, ...memos]);
        setNewMemo('');
        setMemoTags('');
        showToast('✅ 메모가 저장되었습니다.');
    };

    const handleDeleteMemo = (memoId: string) => {
        setMemos(memos.filter(m => m.id !== memoId));
        showToast('🗑️ 메모가 삭제되었습니다.');
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) simulateUpload(file.name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const simulateUpload = (name: string) => {
        setUploadedFile({ name, parsing: true });

        // Determine category based on file name
        const categories = ['진로활동', '동아리', '봉사활동', '성적표', '수행평가'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomTags = [['물리', '실험'], ['수학', '문제해결'], ['영어', '에세이'], ['코딩', 'AI'], ['봉사', '멘토링']][Math.floor(Math.random() * 5)];

        setTimeout(() => {
            const result = { category: randomCategory, tags: randomTags, summary: `AI가 분석한 "${name}" 문서 요약: 주요 활동 내용과 성과를 포함하고 있습니다.` };
            setUploadedFile({ name, parsing: false, result });

            // Add to files list
            const newFile: StudentFile = {
                id: `f-${Date.now()}`,
                studentId: student.id,
                fileName: name,
                gcsPath: `${student.id}/${randomCategory}/${new Date().getFullYear()}/${name}`,
                fileType: (name.split('.').pop() || 'pdf') as 'pdf' | 'hwp' | 'image' | 'other',
                category: randomCategory,
                tags: randomTags,
                summary: result.summary,
                uploadedAt: new Date().toISOString(),
            };
            setFiles(prev => [newFile, ...prev]);
            showToast(`✅ ${name} 업로드 및 AI 분석 완료!`);
        }, 2500);
    };

    const handleDeleteFile = (fileId: string, fileName: string) => {
        setFiles(files.filter(f => f.id !== fileId));
        showToast(`🗑️ ${fileName} 파일이 삭제되었습니다.`);
    };

    const handleSaveGrade = () => {
        const validSubjects = gradeForm.subjects.filter(s => s.name.trim());
        if (validSubjects.length === 0) {
            showToast('⚠️ 최소 하나의 과목을 입력하세요.');
            return;
        }

        const newGrade: GradeRecord = {
            id: `g-${Date.now()}`,
            studentId: student.id,
            examType: gradeForm.examType,
            year: gradeForm.year,
            semester: gradeForm.examType === '내신' ? gradeForm.semester : undefined,
            examPeriod: gradeForm.examType === '내신' ? gradeForm.examPeriod : undefined,
            month: gradeForm.examType === '모의고사' ? gradeForm.month : undefined,
            subjects: validSubjects,
            createdAt: new Date().toISOString(),
        };

        setGrades([newGrade, ...grades]);
        setShowGradeForm(false);
        setGradeForm({
            examType: '내신',
            year: 2026,
            semester: 1,
            examPeriod: '중간고사',
            month: 3,
            subjects: [{ name: '', score: undefined, grade: undefined }],
        });
        showToast('✅ 성적이 저장되었습니다.');
    };

    const handleDeleteGrade = (gradeId: string) => {
        setGrades(grades.filter(g => g.id !== gradeId));
        showToast('🗑️ 성적 기록이 삭제되었습니다.');
    };

    const addGradeSubject = () => {
        setGradeForm({
            ...gradeForm,
            subjects: [...gradeForm.subjects, { name: '', score: undefined, grade: undefined }],
        });
    };

    const removeGradeSubject = (idx: number) => {
        if (gradeForm.subjects.length <= 1) return;
        setGradeForm({
            ...gradeForm,
            subjects: gradeForm.subjects.filter((_, i) => i !== idx),
        });
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const q = searchQuery.trim().toLowerCase();

        setTimeout(() => {
            // 성적/평균/내신/점수 관련 질문 감지
            const isGradeQuery = ['성적', '점수', '평균', '등급', '내신', '모의', '중간', '기말', '몇점', '몇 점', '알려줘', '알려줄래'].some(k => q.includes(k));
            // 활동/메모 관련 질문 감지
            const isActivityQuery = ['활동', '동아리', '봉사', '대회', '경시', '멘토', '발표', '탐구', '리더십', '진로'].some(k => q.includes(k));

            if (isGradeQuery) {
                // 질문에서 과목명 추출
                const allSubjectNames = Array.from(new Set(grades.flatMap(g => g.subjects.map(s => s.name))));
                const mentionedSubjects = allSubjectNames.filter(name => q.includes(name.toLowerCase().replace(/[ⅰⅱ]/gi, '')));
                // 일반적인 과목명 매칭
                const shortNameMap: Record<string, string[]> = { '국어': ['국어'], '수학': ['수학'], '영어': ['영어'], '물리': ['물리학Ⅰ', '물리학Ⅱ'], '화학': ['화학Ⅰ', '화학Ⅱ'] };
                for (const [short, full] of Object.entries(shortNameMap)) {
                    if (q.includes(short) && !mentionedSubjects.some(m => full.includes(m))) {
                        mentionedSubjects.push(...full.filter(f => allSubjectNames.includes(f)));
                    }
                }
                const targetSubjects = mentionedSubjects.length > 0 ? [...new Set(mentionedSubjects)] : allSubjectNames;

                // 내신 성적만 필터
                const naesinGrades = grades.filter(g => g.examType === '내신');
                const sources: { text: string; category: string }[] = [];

                let answerLines: string[] = [`"${searchQuery}"에 대한 검색 결과입니다.\n`];
                answerLines.push(`📊 ${student.name} 학생의 내신 성적 분석:\n`);

                for (const subName of targetSubjects) {
                    const records = naesinGrades
                        .filter(g => g.subjects.some(s => s.name === subName))
                        .sort((a, b) => {
                            const keyA = a.year * 100 + (a.semester || 0) * 10 + (a.examPeriod === '기말고사' ? 1 : 0);
                            const keyB = b.year * 100 + (b.semester || 0) * 10 + (b.examPeriod === '기말고사' ? 1 : 0);
                            return keyA - keyB;
                        });

                    if (records.length === 0) continue;

                    const scores = records.map(r => {
                        const sub = r.subjects.find(s => s.name === subName);
                        return { score: sub?.score, grade: sub?.grade, label: `${r.year} ${r.semester}학기 ${r.examPeriod || ''}`.trim() };
                    });

                    const validScores = scores.filter(s => s.score !== undefined);
                    const avg = validScores.length > 0 ? (validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length).toFixed(1) : '-';

                    answerLines.push(`\n**${subName}**`);
                    scores.forEach(s => {
                        answerLines.push(`  • ${s.label}: ${s.score !== undefined ? `${s.score}점` : '-'}${s.grade !== undefined ? ` (${s.grade}등급)` : ''}`);
                    });
                    answerLines.push(`  → 평균: ${avg}점`);
                    sources.push({ text: `${subName} 내신 성적 ${records.length}건`, category: '성적표' });
                }

                if (sources.length === 0) {
                    answerLines.push('\n해당 과목의 성적 기록을 찾지 못했습니다.');
                }

                setSearchResult({ answer: answerLines.join('\n'), sources });
            } else if (isActivityQuery) {
                // 메모/파일에서 키워드 검색
                const matchedMemos = memos.filter(m =>
                    m.content.toLowerCase().includes(q) ||
                    m.tags.some(t => q.includes(t.toLowerCase())) ||
                    m.category.toLowerCase().includes(q) ||
                    q.split(/\s+/).some(w => w.length >= 2 && (m.content.includes(w) || m.tags.some(t => t.includes(w))))
                );
                const matchedFiles = files.filter(f =>
                    f.fileName.toLowerCase().includes(q) ||
                    f.tags.some(t => q.includes(t.toLowerCase())) ||
                    (f.summary && q.split(/\s+/).some(w => w.length >= 2 && f.summary!.includes(w)))
                );

                let answerLines: string[] = [`"${searchQuery}"에 대한 검색 결과입니다.\n`];
                answerLines.push(`${student.name} 학생의 활동 기록에서 관련 내용을 찾았습니다:\n`);
                const sources: { text: string; category: string }[] = [];

                if (matchedMemos.length > 0) {
                    matchedMemos.forEach((m, i) => {
                        answerLines.push(`${i + 1}. ${m.content} [출처 ${sources.length + 1}]`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                }
                if (matchedFiles.length > 0) {
                    matchedFiles.forEach(f => {
                        answerLines.push(`\n📄 관련 파일: ${f.fileName}`);
                        if (f.summary) answerLines.push(`   요약: ${f.summary}`);
                        sources.push({ text: f.fileName, category: f.category });
                    });
                }
                if (matchedMemos.length === 0 && matchedFiles.length === 0) {
                    // 전체 메모 중 가장 관련성 높은 것 보여주기
                    answerLines.push('정확히 일치하는 기록은 없지만, 아래 활동 기록을 참고해주세요:\n');
                    memos.slice(0, 3).forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                }

                setSearchResult({ answer: answerLines.join('\n'), sources });
            } else {
                // 범용 검색: 모든 데이터 종합
                const sources: { text: string; category: string }[] = [];
                let answerLines: string[] = [`"${searchQuery}"에 대한 종합 검색 결과입니다.\n`];
                answerLines.push(`📋 ${student.name} 학생 종합 현황:\n`);
                answerLines.push(`• 학교: ${student.school} (${student.grade}학년)`);
                answerLines.push(`• 목표: ${student.targetUniv} ${student.targetMajor}`);
                answerLines.push(`• 메모: ${memos.length}건 / 파일: ${files.length}건 / 성적 기록: ${grades.length}건\n`);

                // 키워드와 일치하는 메모 찾기
                const keywords = q.split(/[\s,，.。]+/).filter(w => w.length >= 2);
                const matchedMemos = memos.filter(m =>
                    keywords.some(k => m.content.includes(k) || m.tags.some(t => t.includes(k)))
                );

                if (matchedMemos.length > 0) {
                    answerLines.push('📝 관련 메모:');
                    matchedMemos.forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                } else {
                    answerLines.push('📝 최근 메모:');
                    memos.slice(0, 2).forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category });
                    });
                }

                setSearchResult({ answer: answerLines.join('\n'), sources });
            }

            setIsSearching(false);
        }, 1200);
    };

    const handleSaveEdit = () => {
        showToast(`✅ ${editForm.name} 학생 정보가 수정되었습니다.`);
        setShowEditModal(false);
    };

    // ============ CHART DATA ============

    const lineChartData = {
        labels: ['1-1', '1-2', '2-1', '2-2'],
        datasets: [
            { label: '수학', data: [93, 95, 97, 98], borderColor: '#818cf8', backgroundColor: 'rgba(129, 140, 248, 0.1)', tension: 0.4, fill: true },
            { label: '물리', data: [90, 94, 98, 99], borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', tension: 0.4, fill: true },
            { label: '국어', data: [88, 90, 92, 90], borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', tension: 0.4, fill: true },
            { label: '영어', data: [85, 87, 88, 91], borderColor: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.1)', tension: 0.4, fill: true },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
            title: { display: true, text: '내신 성적 추이', color: '#f1f5f9', font: { size: 14, family: 'Inter' } },
        },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30, 41, 59, 0.5)' } },
            y: { min: chartMinY, max: chartMaxY, ticks: { color: '#64748b' }, grid: { color: 'rgba(30, 41, 59, 0.5)' } },
        },
    };

    const radarData = {
        labels: ['학업역량', '진로역량', '자기주도성', '발전가능성', '공동체의식'],
        datasets: [{
            label: '역량 점수',
            data: [demoCompetency.학업역량, demoCompetency.진로역량, demoCompetency.자기주도성, demoCompetency.발전가능성, demoCompetency.공동체의식],
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
        }],
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0, max: 10,
                ticks: { color: '#64748b', backdropColor: 'transparent', stepSize: 2 },
                grid: { color: 'rgba(30, 41, 59, 0.5)' },
                pointLabels: { color: '#94a3b8', font: { size: 12, family: 'Inter' } },
                angleLines: { color: 'rgba(30, 41, 59, 0.5)' },
            },
        },
        plugins: { legend: { display: false } },
    };

    // ============ RENDER ============

    return (
        <div>
            {/* Student Profile Header */}
            <div className="card-glass" style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-xl)', flexWrap: 'wrap' }}>
                <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', color: 'white', fontWeight: 700, fontSize: '1.5rem', width: 72, height: 72 }}>
                    {student.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{student.name}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
                        {student.school} · {student.grade}학년
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        <span className="tag tag-blue">🎯 {student.targetUniv}</span>
                        <span className="tag tag-green">📚 {student.targetMajor}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => showToast('📋 보고서 생성 기능은 보고서 페이지에서 이용 가능합니다.')}>📋 보고서 생성</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>✏️ 수정</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ overflowX: 'auto' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && (
                <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>요약 정보</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div><div className="text-sm text-muted">메모</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{memos.length}건</div></div>
                            <div><div className="text-sm text-muted">파일</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{files.length}건</div></div>
                            <div><div className="text-sm text-muted">성적 기록</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{grades.length}건</div></div>
                            <div><div className="text-sm text-muted">보고서</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>1건</div></div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>역량 분석 요약</h3>
                        <div style={{ height: 220 }}>
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                    </div>

                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>최근 메모</h3>
                        {memos.slice(0, 3).map((memo) => (
                            <div key={memo.id} style={{ padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)', borderLeft: '3px solid var(--primary-500)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span className="tag tag-green" style={{ fontSize: '0.7rem' }}>{memo.category}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(memo.createdAt).toLocaleDateString('ko-KR')}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{memo.content}</p>
                            </div>
                        ))}
                        {memos.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>아직 작성된 메모가 없습니다.</p>}
                    </div>
                </div>
            )}

            {/* ===== MEMOS TAB ===== */}
            {activeTab === 'memos' && (
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>새 메모 작성</h3>
                        <textarea
                            className="form-textarea"
                            placeholder="상담 메모, 활동 기록 등을 입력하세요..."
                            value={newMemo}
                            onChange={(e) => setNewMemo(e.target.value)}
                            style={{ minHeight: 100 }}
                        />
                        <div className="grid-2" style={{ marginTop: 'var(--space-sm)', gap: 'var(--space-sm)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select className="form-select" value={memoCategory} onChange={(e) => setMemoCategory(e.target.value)}>
                                    <option>수행평가</option>
                                    <option>자율활동</option>
                                    <option>진로활동</option>
                                    <option>봉사활동</option>
                                    <option>동아리</option>
                                    <option>기타</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input className="form-input" placeholder="태그 (쉼표 구분)" value={memoTags} onChange={(e) => setMemoTags(e.target.value)} />
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={handleAddMemo}>
                            ✏️ 메모 저장
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {memos.map((memo) => (
                            <div key={memo.id} className="card" style={{ borderLeft: '3px solid var(--primary-500)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                    <span className="tag tag-green">{memo.category}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {new Date(memo.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteMemo(memo.id)} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>🗑️</button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {memo.content}
                                </p>
                                <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-sm)' }}>
                                    {memo.tags.map((tag) => (
                                        <span key={tag} className="tag tag-gray" style={{ fontSize: '0.7rem' }}>#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {memos.length === 0 && (
                            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📝</div>
                                <p style={{ color: 'var(--text-muted)' }}>아직 작성된 메모가 없습니다. 위에서 메모를 작성해보세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== FILES TAB ===== */}
            {activeTab === 'files' && (
                <div>
                    <div
                        className={`dropzone ${isDragging ? 'active' : ''}`}
                        style={{ marginBottom: 'var(--space-lg)' }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="dropzone-icon">📤</div>
                        <p className="dropzone-text">
                            파일을 드래그하거나 <strong>클릭</strong>하여 업로드
                        </p>
                        <p className="dropzone-hint">PDF, HWP 지원 · AI가 자동으로 내용을 분석합니다</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.hwp,.doc,.docx,.txt"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) simulateUpload(f.name);
                                e.target.value = '';
                            }}
                        />
                    </div>

                    {uploadedFile && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)', borderLeft: uploadedFile.parsing ? '3px solid var(--warning-400)' : '3px solid var(--accent-400)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                {uploadedFile.parsing ? (
                                    <>
                                        <span className="spinner" />
                                        <span style={{ fontSize: '0.9rem' }}>AI가 {uploadedFile.name}을(를) 분석 중...</span>
                                    </>
                                ) : (
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>✅ {uploadedFile.name} 분석 완료</div>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xs)' }}>
                                            <span className="tag tag-blue">{uploadedFile.result?.category}</span>
                                            {uploadedFile.result?.tags.map((t) => (
                                                <span key={t} className="tag tag-gray">#{t}</span>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{uploadedFile.result?.summary}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>파일명</th>
                                    <th>카테고리</th>
                                    <th>태그</th>
                                    <th>업로드일</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file) => (
                                    <tr key={file.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <span>📄</span>
                                                <span style={{ fontWeight: 500 }}>{file.fileName}</span>
                                            </div>
                                        </td>
                                        <td><span className="tag tag-blue">{file.category}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {file.tags.map((t) => <span key={t} className="tag tag-gray" style={{ fontSize: '0.68rem' }}>#{t}</span>)}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>{new Date(file.uploadedAt).toLocaleDateString('ko-KR')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => showToast('⬇️ 파일 다운로드 (GCS 연동 후 활성화)')}>⬇️</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteFile(file.id, file.fileName)} style={{ color: 'var(--danger-400)' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {files.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', marginTop: 'var(--space-md)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>업로드된 파일이 없습니다. 위의 영역에 파일을 드래그하거나 클릭하여 업로드하세요.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ===== GRADES TAB ===== */}
            {activeTab === 'grades' && (
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <h3 className="card-title">📈 성적 추이 차트</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>최소</label>
                                    <input type="number" className="form-input" value={chartMinY} onChange={(e) => setChartMinY(Number(e.target.value))} style={{ width: 60, padding: '4px 8px', fontSize: '0.8rem' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>최대</label>
                                    <input type="number" className="form-input" value={chartMaxY} onChange={(e) => setChartMaxY(Number(e.target.value))} style={{ width: 60, padding: '4px 8px', fontSize: '0.8rem' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ height: 350 }}>
                            <Line data={lineChartData} options={lineChartOptions} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h3 style={{ fontWeight: 700 }}>성적 기록</h3>
                        <button className="btn btn-primary" onClick={() => setShowGradeForm(!showGradeForm)}>
                            {showGradeForm ? '✕ 닫기' : '➕ 성적 입력'}
                        </button>
                    </div>

                    {showGradeForm && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                            <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>성적 입력</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: gradeForm.examType === '내신' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">시험 유형</label>
                                    <select className="form-select" value={gradeForm.examType} onChange={(e) => setGradeForm({ ...gradeForm, examType: e.target.value as '내신' | '모의고사' })}>
                                        <option value="내신">내신</option>
                                        <option value="모의고사">모의고사</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">년도</label>
                                    <input type="number" className="form-input" value={gradeForm.year} onChange={(e) => setGradeForm({ ...gradeForm, year: Number(e.target.value) })} />
                                </div>
                                {gradeForm.examType === '내신' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">학기</label>
                                            <select className="form-select" value={gradeForm.semester} onChange={(e) => setGradeForm({ ...gradeForm, semester: Number(e.target.value) })}>
                                                <option value={1}>1학기</option>
                                                <option value={2}>2학기</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">시험 구분</label>
                                            <select className="form-select" value={gradeForm.examPeriod} onChange={(e) => setGradeForm({ ...gradeForm, examPeriod: e.target.value as '중간고사' | '기말고사' })}>
                                                <option value="중간고사">중간고사</option>
                                                <option value="기말고사">기말고사</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">시행월</label>
                                        <select className="form-select" value={gradeForm.month} onChange={(e) => setGradeForm({ ...gradeForm, month: Number(e.target.value) })}>
                                            <option value={3}>3월</option>
                                            <option value={6}>6월</option>
                                            <option value={9}>9월</option>
                                            <option value={11}>11월</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                    <label className="form-label">과목별 성적</label>
                                    <button className="btn btn-ghost btn-sm" onClick={addGradeSubject}>+ 과목 추가</button>
                                </div>
                                {gradeForm.subjects.map((sub, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)', alignItems: 'center' }}>
                                        <input className="form-input" placeholder="과목명" value={sub.name} style={{ flex: 2 }} onChange={(e) => {
                                            const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], name: e.target.value }; setGradeForm({ ...gradeForm, subjects: s });
                                        }} />
                                        <input type="number" className="form-input" placeholder="점수" value={sub.score ?? ''} style={{ flex: 1 }} onChange={(e) => {
                                            const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], score: e.target.value ? Number(e.target.value) : undefined }; setGradeForm({ ...gradeForm, subjects: s });
                                        }} />
                                        <input type="number" className="form-input" placeholder="등급 (1-9)" value={sub.grade ?? ''} style={{ flex: 1 }} onChange={(e) => {
                                            const s = [...gradeForm.subjects]; s[idx] = { ...s[idx], grade: e.target.value ? Number(e.target.value) : undefined }; setGradeForm({ ...gradeForm, subjects: s });
                                        }} />
                                        <button className="btn btn-ghost btn-sm" onClick={() => removeGradeSubject(idx)} style={{ color: 'var(--danger-400)', flexShrink: 0 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveGrade}>💾 성적 저장</button>
                        </div>
                    )}

                    {grades.map((record) => (
                        <div key={record.id} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                    <span className={`tag ${record.examType === '내신' ? 'tag-blue' : 'tag-yellow'}`}>{record.examType}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {record.year}년 {record.examType === '내신' ? `${record.semester}학기 ${record.examPeriod || ''}` : `${record.month}월`}
                                    </span>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteGrade(record.id)} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>🗑️</button>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                {record.subjects.map((sub, idx) => (
                                    <div key={idx} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '8px 14px', minWidth: 100 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.name}</div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                            {sub.score ? `${sub.score}점` : sub.standardScore ? `${sub.standardScore}` : ''}
                                            {sub.grade !== undefined && <span style={{ fontSize: '0.8rem', color: 'var(--primary-400)', marginLeft: 4 }}>{sub.grade}등급</span>}
                                        </div>
                                        {sub.percentile && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>상위 {100 - sub.percentile}%</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {grades.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>성적 기록이 없습니다. 위의 &quot;성적 입력&quot; 버튼을 눌러 입력하세요.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ===== ANALYSIS TAB ===== */}
            {activeTab === 'analysis' && (
                <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>🎯 AI 역량 방사형 차트</h3>
                        <div style={{ height: 320 }}>
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {Object.entries(demoCompetency).map(([key, val]) => (
                                <div key={key} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-400)' }}>{val}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{key}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>📝 AI 분석 근거</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {demoEvidences.map((ev, idx) => (
                                <div key={idx} style={{ padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-500)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-400)' }}>{ev.competency}</span>
                                        <span className="badge badge-blue">{ev.score}/10</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.evidence}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SEARCH TAB ===== */}
            {activeTab === 'search' && (
                <div>
                    <div className="card-glass" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>🔍 AI 자연어 검색 (RAG)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                            자연어로 질문하면 학생의 모든 활동 기록에서 관련 내용을 검색하고 답변합니다.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <input
                                className="form-input"
                                placeholder="예: 물리 관련 활동을 찾아줘, 리더십을 보여준 사례는?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '검색'}
                            </button>
                        </div>
                    </div>

                    {searchResult && (
                        <div className="card">
                            <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💡 검색 결과</h4>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 'var(--space-lg)' }}>
                                {searchResult.answer}
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                                <h5 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>출처</h5>
                                {searchResult.sources.map((src, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: '6px' }}>
                                        <span className="badge badge-blue">{idx + 1}</span>
                                        <span style={{ fontSize: '0.82rem' }}>{src.text}</span>
                                        <span className="tag tag-gray" style={{ fontSize: '0.68rem' }}>{src.category}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => setSearchResult(null)}>🔄 새 검색</button>
                        </div>
                    )}

                    {!searchResult && (
                        <div className="card">
                            <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💡 추천 질문</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {[
                                    '물리와 관련된 활동을 모두 찾아줘',
                                    '리더십을 보여준 사례는?',
                                    '작년에 참가한 대회 목록은?',
                                    '진로 탐색과 관련된 활동은 뭐가 있어?',
                                ].map((q) => (
                                    <button
                                        key={q}
                                        className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                        onClick={() => { setSearchQuery(q); }}
                                    >
                                        🔹 {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== EDIT MODAL ===== */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontWeight: 700 }}>학생 정보 수정</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">이름</label>
                                <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">학년</label>
                                    <select className="form-select" value={editForm.grade} onChange={(e) => setEditForm({ ...editForm, grade: Number(e.target.value) })}>
                                        <option value={1}>1학년</option>
                                        <option value={2}>2학년</option>
                                        <option value={3}>3학년</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">학교</label>
                                    <input className="form-input" value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">목표 대학</label>
                                    <input className="form-input" value={editForm.targetUniv} onChange={(e) => setEditForm({ ...editForm, targetUniv: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">목표 학과</label>
                                    <input className="form-input" value={editForm.targetMajor} onChange={(e) => setEditForm({ ...editForm, targetMajor: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>취소</button>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="toast toast-success">{toast}</div>
            )}
        </div>
    );
}
