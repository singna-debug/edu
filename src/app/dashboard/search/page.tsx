'use client';

import { useState, useMemo } from 'react';
import type { Memo, StudentFile, GradeRecord } from '@/lib/types';

// ============ STUDENT-SPECIFIC DEMO DATA ============

interface StudentData {
    id: string;
    name: string;
    school: string;
    grade: number;
    targetUniv: string;
    targetMajor: string;
    memos: Memo[];
    files: StudentFile[];
    grades: GradeRecord[];
}

const studentsData: StudentData[] = [
    {
        id: 'stu-001', name: '김민준', school: '서울과학고등학교', grade: 2, targetUniv: '서울대학교', targetMajor: '물리학과',
        memos: [
            { id: 'm1', studentId: 'stu-001', content: '물리 심화 탐구 보고서 초안 제출. 엔트로피 관련 실험 설계 우수. 열역학 제2법칙을 독창적으로 접근.', tags: ['물리', '탐구', '열역학'], category: '진로활동', createdAt: '2026-02-17' },
            { id: 'm2', studentId: 'stu-001', content: '수학 경시대회(AMC 12) 예선 통과. 조합론 영역 보강 필요.', tags: ['수학', '경시대회', 'AMC'], category: '대회', createdAt: '2026-02-14' },
            { id: 'm3', studentId: 'stu-001', content: '물리 동아리에서 양자역학 세미나 발표. 파동-입자 이중성 주제. 발표력 우수.', tags: ['물리', '동아리', '발표'], category: '동아리', createdAt: '2026-02-10' },
            { id: 'm4', studentId: 'stu-001', content: '멘토링 봉사 활동 — 중학생 대상 물리 실험 기초 교육. 리더십 및 설명 능력 향상.', tags: ['봉사', '멘토링', '리더십'], category: '봉사활동', createdAt: '2026-02-05' },
        ],
        files: [
            { id: 'f1', studentId: 'stu-001', fileName: '물리탐구보고서_엔트로피.pdf', gcsPath: '', fileType: 'pdf', category: '진로활동', tags: ['물리', '엔트로피'], summary: '열역학 제2법칙을 실생활에 적용한 실험 보고서', uploadedAt: '2026-02-15' },
            { id: 'f2', studentId: 'stu-001', fileName: '양자역학_세미나_발표자료.pdf', gcsPath: '', fileType: 'pdf', category: '동아리', tags: ['물리', '양자역학', '발표'], summary: '동아리 양자역학 세미나 발표 PPT', uploadedAt: '2026-02-10' },
        ],
        grades: [
            { id: 'g1', studentId: 'stu-001', examType: '내신', year: 2025, semester: 1, examPeriod: '중간고사', subjects: [{ name: '국어', score: 90, grade: 2 }, { name: '수학', score: 95, grade: 1 }, { name: '영어', score: 85, grade: 3 }, { name: '물리학Ⅰ', score: 96, grade: 1 }], createdAt: '2025-05-10' },
            { id: 'g1b', studentId: 'stu-001', examType: '내신', year: 2025, semester: 1, examPeriod: '기말고사', subjects: [{ name: '국어', score: 92, grade: 2 }, { name: '수학', score: 97, grade: 1 }, { name: '영어', score: 88, grade: 3 }, { name: '물리학Ⅰ', score: 98, grade: 1 }], createdAt: '2025-07-15' },
            { id: 'g2', studentId: 'stu-001', examType: '내신', year: 2025, semester: 2, examPeriod: '중간고사', subjects: [{ name: '국어', score: 88, grade: 3 }, { name: '수학', score: 96, grade: 1 }, { name: '영어', score: 89, grade: 2 }, { name: '물리학Ⅱ', score: 97, grade: 1 }], createdAt: '2025-10-15' },
            { id: 'g2b', studentId: 'stu-001', examType: '내신', year: 2025, semester: 2, examPeriod: '기말고사', subjects: [{ name: '국어', score: 90, grade: 2 }, { name: '수학', score: 98, grade: 1 }, { name: '영어', score: 91, grade: 2 }, { name: '물리학Ⅱ', score: 99, grade: 1 }], createdAt: '2025-12-20' },
        ],
    },
    {
        id: 'stu-002', name: '이서연', school: '대원외국어고등학교', grade: 3, targetUniv: '연세대학교', targetMajor: '국제학과',
        memos: [
            { id: 'm5', studentId: 'stu-002', content: '영어 에세이 대회 은상 수상. 주제: 국제 인권 문제 분석.', tags: ['영어', '대회', '에세이'], category: '대회', createdAt: '2026-02-12' },
            { id: 'm6', studentId: 'stu-002', content: '모의유엔(MUN) 동아리 활동. 미국 대표 역할 수행, 결의안 작성 리더.', tags: ['모의유엔', '동아리', '리더십'], category: '동아리', createdAt: '2026-02-08' },
            { id: 'm7', studentId: 'stu-002', content: '다문화 가정 아동 대상 영어 교육 봉사. 주 1회 4개월간 진행.', tags: ['봉사', '영어', '다문화'], category: '봉사활동', createdAt: '2026-01-20' },
        ],
        files: [
            { id: 'f4', studentId: 'stu-002', fileName: '영어에세이_국제인권.pdf', gcsPath: '', fileType: 'pdf', category: '대회', tags: ['영어', '에세이', '인권'], summary: '국제 인권 문제를 다룬 영어 에세이 (대회 제출본)', uploadedAt: '2026-02-12' },
        ],
        grades: [
            { id: 'g5', studentId: 'stu-002', examType: '내신', year: 2025, semester: 1, examPeriod: '중간고사', subjects: [{ name: '국어', score: 88, grade: 2 }, { name: '영어', score: 96, grade: 1 }, { name: '사회문화', score: 94, grade: 1 }], createdAt: '2025-05-10' },
            { id: 'g5b', studentId: 'stu-002', examType: '내신', year: 2025, semester: 1, examPeriod: '기말고사', subjects: [{ name: '국어', score: 90, grade: 2 }, { name: '영어', score: 97, grade: 1 }, { name: '사회문화', score: 95, grade: 1 }], createdAt: '2025-07-15' },
        ],
    },
    {
        id: 'stu-003', name: '박지호', school: '한영중학교 (예비고1)', grade: 1, targetUniv: '미정', targetMajor: '공학 계열',
        memos: [
            { id: 'm8', studentId: 'stu-003', content: '코딩 교육 이수 (Python 기초). 간단한 게임 프로젝트 완성.', tags: ['코딩', 'Python'], category: '진로활동', createdAt: '2026-02-01' },
            { id: 'm9', studentId: 'stu-003', content: '과학 발명품 대회 참가. 자동 급수 화분 제작. 아두이노 활용.', tags: ['발명', '대회', '아두이노'], category: '대회', createdAt: '2026-01-15' },
        ],
        files: [],
        grades: [],
    },
    {
        id: 'stu-004', name: '최수아', school: '민족사관고등학교', grade: 3, targetUniv: 'KAIST', targetMajor: '전산학부',
        memos: [
            { id: 'm10', studentId: 'stu-004', content: '한국정보올림피아드(KOI) 은상 수상. 알고리즘 문제 풀이 우수.', tags: ['정보올림피아드', '대회', '알고리즘'], category: '대회', createdAt: '2026-02-11' },
            { id: 'm11', studentId: 'stu-004', content: '코딩 동아리에서 머신러닝 프로젝트 진행. 이미지 분류 모델 구현.', tags: ['코딩', '동아리', 'AI', '머신러닝'], category: '동아리', createdAt: '2026-02-05' },
            { id: 'm12', studentId: 'stu-004', content: '소외계층 대상 코딩 교육 봉사. Scratch를 활용한 기초 교육 진행.', tags: ['봉사', '코딩', '교육'], category: '봉사활동', createdAt: '2026-01-25' },
        ],
        files: [
            { id: 'f5', studentId: 'stu-004', fileName: 'KOI_풀이노트.pdf', gcsPath: '', fileType: 'pdf', category: '대회', tags: ['KOI', '알고리즘'], summary: '한국정보올림피아드 문제 풀이 및 접근 방법 정리', uploadedAt: '2026-02-11' },
        ],
        grades: [
            { id: 'g8', studentId: 'stu-004', examType: '내신', year: 2025, semester: 1, examPeriod: '중간고사', subjects: [{ name: '수학', score: 98, grade: 1 }, { name: '정보', score: 100, grade: 1 }, { name: '물리학Ⅰ', score: 95, grade: 1 }], createdAt: '2025-05-10' },
            { id: 'g8b', studentId: 'stu-004', examType: '내신', year: 2025, semester: 1, examPeriod: '기말고사', subjects: [{ name: '수학', score: 99, grade: 1 }, { name: '정보', score: 100, grade: 1 }, { name: '물리학Ⅰ', score: 97, grade: 1 }], createdAt: '2025-07-15' },
        ],
    },
];

const studentNameMap: Record<string, string> = {
    'stu-001': '김민준', 'stu-002': '이서연', 'stu-003': '박지호', 'stu-004': '최수아',
};

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [studentFilter, setStudentFilter] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<{ answer: string; sources: { text: string; category: string; studentName: string }[] } | null>(null);

    const filteredStudents = useMemo(() => {
        if (studentFilter) return studentsData.filter(s => s.id === studentFilter);
        return studentsData;
    }, [studentFilter]);

    const handleSearch = () => {
        if (!query.trim()) return;
        setIsSearching(true);
        const q = query.trim().toLowerCase();

        setTimeout(() => {
            const isGradeQuery = ['성적', '점수', '평균', '등급', '내신', '모의', '중간', '기말', '몇점'].some(k => q.includes(k));
            const isActivityQuery = ['활동', '동아리', '봉사', '대회', '경시', '멘토', '발표', '탐구', '리더십', '진로', '올림피아드'].some(k => q.includes(k));

            const answerLines: string[] = [];
            const sources: { text: string; category: string; studentName: string }[] = [];
            const filterLabel = studentFilter ? studentNameMap[studentFilter] : '전체';

            answerLines.push(`"${query}"에 대한 검색 결과입니다. (대상: ${filterLabel})\n`);

            if (isGradeQuery) {
                // ===== 성적 검색 =====
                const shortNameMap: Record<string, string[]> = { '국어': ['국어'], '수학': ['수학'], '영어': ['영어'], '물리': ['물리학Ⅰ', '물리학Ⅱ'], '화학': ['화학Ⅰ', '화학Ⅱ'], '정보': ['정보'], '사회': ['사회문화'] };
                const mentionedShorts = Object.keys(shortNameMap).filter(k => q.includes(k));

                for (const stu of filteredStudents) {
                    const naesin = stu.grades.filter(g => g.examType === '내신');
                    if (naesin.length === 0) continue;

                    const allSubs = Array.from(new Set(naesin.flatMap(g => g.subjects.map(s => s.name))));
                    let targetSubs = allSubs;
                    if (mentionedShorts.length > 0) {
                        const expanded = mentionedShorts.flatMap(k => shortNameMap[k]);
                        targetSubs = allSubs.filter(name => expanded.some(e => name.includes(e) || e.includes(name)));
                    }
                    if (targetSubs.length === 0) continue;

                    answerLines.push(`\n📊 **${stu.name}** (${stu.school})\n`);

                    for (const subName of targetSubs) {
                        const records = naesin
                            .filter(g => g.subjects.some(s => s.name === subName))
                            .sort((a, b) => (a.year * 100 + (a.semester || 0) * 10 + (a.examPeriod === '기말고사' ? 1 : 0)) - (b.year * 100 + (b.semester || 0) * 10 + (b.examPeriod === '기말고사' ? 1 : 0)));

                        if (records.length === 0) continue;

                        const scores = records.map(r => {
                            const sub = r.subjects.find(s => s.name === subName)!;
                            return { score: sub.score, grade: sub.grade, label: `${r.year} ${r.semester}학기 ${r.examPeriod || ''}`.trim() };
                        });

                        const validScores = scores.filter(s => s.score !== undefined);
                        const avg = validScores.length > 0 ? (validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length).toFixed(1) : '-';

                        answerLines.push(`**${subName}**`);
                        scores.forEach(s => {
                            answerLines.push(`  • ${s.label}: ${s.score !== undefined ? `${s.score}점` : '-'}${s.grade !== undefined ? ` (${s.grade}등급)` : ''}`);
                        });
                        answerLines.push(`  → 평균: ${avg}점`);
                        sources.push({ text: `${subName} 내신 성적 ${records.length}건`, category: '성적', studentName: stu.name });
                    }
                }

                if (sources.length === 0) answerLines.push('\n해당 조건의 성적 기록을 찾지 못했습니다.');

            } else if (isActivityQuery) {
                // ===== 활동/메모 검색 =====
                const keywords = q.split(/[\s,，]+/).filter(w => w.length >= 2);

                for (const stu of filteredStudents) {
                    const matchedMemos = stu.memos.filter(m =>
                        keywords.some(k => m.content.includes(k) || m.tags.some(t => t.toLowerCase().includes(k)) || m.category.includes(k))
                    );
                    const matchedFiles = stu.files.filter(f =>
                        keywords.some(k => f.fileName.toLowerCase().includes(k) || f.tags.some(t => t.toLowerCase().includes(k)) || (f.summary && f.summary.includes(k)))
                    );

                    if (matchedMemos.length === 0 && matchedFiles.length === 0) continue;

                    answerLines.push(`\n📋 **${stu.name}** (${stu.school})\n`);

                    matchedMemos.forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 60), category: m.category, studentName: stu.name });
                    });
                    matchedFiles.forEach(f => {
                        answerLines.push(`  📄 ${f.fileName} — ${f.summary || ''}`);
                        sources.push({ text: f.fileName, category: f.category, studentName: stu.name });
                    });
                }

                if (sources.length === 0) {
                    answerLines.push('\n정확히 일치하는 활동 기록을 찾지 못했습니다. 아래는 전체 활동 요약입니다:\n');
                    for (const stu of filteredStudents) {
                        if (stu.memos.length === 0) continue;
                        answerLines.push(`\n📋 **${stu.name}**`);
                        stu.memos.slice(0, 2).forEach((m, i) => {
                            answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                            sources.push({ text: m.content.slice(0, 60), category: m.category, studentName: stu.name });
                        });
                    }
                }

            } else {
                // ===== 범용 검색 =====
                const keywords = q.split(/[\s,，]+/).filter(w => w.length >= 2);

                for (const stu of filteredStudents) {
                    const matchedMemos = keywords.length > 0
                        ? stu.memos.filter(m => keywords.some(k => m.content.includes(k) || m.tags.some(t => t.includes(k))))
                        : stu.memos;

                    answerLines.push(`\n📋 **${stu.name}** (${stu.school} ${stu.grade}학년) — 목표: ${stu.targetUniv} ${stu.targetMajor}`);
                    answerLines.push(`  메모 ${stu.memos.length}건 / 파일 ${stu.files.length}건 / 성적 ${stu.grades.length}건\n`);

                    const memosToShow = matchedMemos.length > 0 ? matchedMemos : stu.memos.slice(0, 2);
                    memosToShow.forEach((m, i) => {
                        answerLines.push(`${i + 1}. [${m.category}] ${m.content}`);
                        sources.push({ text: m.content.slice(0, 60), category: m.category, studentName: stu.name });
                    });
                }
            }

            setResult({ answer: answerLines.join('\n'), sources });
            setIsSearching(false);
        }, 1200);
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontWeight: 700 }}>🔍 AI 자연어 검색</h2>
                <p className="text-sm text-muted" style={{ marginTop: '2px' }}>
                    RAG 기반으로 학생의 활동 기록에서 관련 내용을 검색합니다
                </p>
            </div>

            {/* Search Bar */}
            <div className="card-glass" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <select className="form-select" value={studentFilter} onChange={(e) => { setStudentFilter(e.target.value); setResult(null); }} style={{ width: 160 }}>
                        <option value="">전체 학생</option>
                        <option value="stu-001">김민준</option>
                        <option value="stu-002">이서연</option>
                        <option value="stu-003">박지호</option>
                        <option value="stu-004">최수아</option>
                    </select>
                    <input
                        className="form-input"
                        placeholder="자연어로 검색하세요... 예: 대회 참가 이력, 국어 내신 성적 평균"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '🔍 검색'}
                    </button>
                </div>

                {/* Quick Suggestions */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {['물리 관련 활동', '리더십 사례', '대회 참가 이력', '봉사활동 내역', '진로 탐색 활동', '국어,수학 내신 평균', '전체 성적 현황'].map((q) => (
                        <button key={q} className="btn btn-ghost btn-sm" onClick={() => setQuery(q)} style={{ fontSize: '0.78rem' }}>
                            🔹 {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💡 검색 결과</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 'var(--space-lg)' }}>
                        {result.answer}
                    </div>
                    {result.sources.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                            <h5 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>📎 출처</h5>
                            {result.sources.map((src, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: '8px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <span className="badge badge-blue" style={{ minWidth: 22, textAlign: 'center' }}>{idx + 1}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--primary-400)', minWidth: 60 }}>{src.studentName}</span>
                                    <span style={{ fontSize: '0.82rem', flex: 1 }}>{src.text}</span>
                                    <span className="tag tag-gray" style={{ fontSize: '0.68rem' }}>{src.category}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={() => setResult(null)}>🔄 새 검색</button>
                </div>
            )}

            {/* Empty State */}
            {!result && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔍</div>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>AI 검색 엔진</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                        자연어로 질문하면 학생의 메모, 파일, 활동 기록, 성적에서 관련 내용을 찾아 답변합니다.
                        학생을 선택하면 해당 학생의 데이터만 검색합니다.
                    </p>
                </div>
            )}
        </div>
    );
}
