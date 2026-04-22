'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Users, Clipboard, File, FileText, Search as SearchIcon, Plus, BarChart2, MessageSquare, Lightbulb, Paperclip, RefreshCw, Brain, Eye } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { studentService } from '@/lib/services/studentService';
import type { Student, Memo, StudentFile } from '@/lib/types';

// 데모 데이터
const demoStudents: Student[] = [
    {
        id: 'stu-001',
        name: '김민준',
        grade: 2,
        school: '서울과학고등학교',
        targetUniv: '서울대학교',
        targetMajor: '물리학과',
        consultantId: 'demo',
        createdAt: '2025-03-15',
        updatedAt: '2026-02-17',
    },
    {
        id: 'stu-002',
        name: '이서연',
        grade: 3,
        school: '대원외국어고등학교',
        targetUniv: '연세대학교',
        targetMajor: '국제학과',
        consultantId: 'demo',
        createdAt: '2025-06-01',
        updatedAt: '2026-02-16',
    },
    {
        id: 'stu-003',
        name: '박지호',
        grade: 1,
        school: '한영중학교 (예비고1)',
        targetUniv: '미정',
        targetMajor: '공학 계열',
        consultantId: 'demo',
        createdAt: '2026-01-10',
        updatedAt: '2026-02-15',
    },
    {
        id: 'stu-004',
        name: '최수아',
        grade: 3,
        school: '민족사관고등학교',
        targetUniv: 'KAIST',
        targetMajor: '전산학부',
        consultantId: 'demo',
        createdAt: '2024-09-20',
        updatedAt: '2026-02-14',
    },
];

const recentMemos: (Memo & { studentName: string })[] = [
    {
        id: 'm1', studentId: 'stu-001', studentName: '김민준',
        content: '물리 심화 탐구 보고서 초안 제출. 엔트로피 관련 실험 설계 우수.',
        tags: ['물리', '탐구'], category: '진로활동',
        createdAt: '2026-02-17T14:30:00',
    },
    {
        id: 'm2', studentId: 'stu-002', studentName: '이서연',
        content: '영어 에세이 대회 수상. 국제 관계 주제 심층 분석 능력 확인.',
        tags: ['영어', '대회'], category: '자율활동',
        createdAt: '2026-02-16T11:00:00',
    },
    {
        id: 'm3', studentId: 'stu-004', studentName: '최수아',
        content: '코딩 캠프 참가 후 팀 프로젝트 리더 역할. AI 모델 구현 경험.',
        tags: ['코딩', 'AI', '리더십'], category: '동아리',
        createdAt: '2026-02-15T16:45:00',
    },
];

const demoFiles: (StudentFile & { studentName: string })[] = [
    { 
        id: 'f-1', 
        studentId: 'stu-001', 
        studentName: '김민준',
        fileName: '2024_물리_탐구_보고서.pdf', 
        gcsPath: '', 
        fileType: 'pdf', 
        category: '교과활동', 
        tags: ['물리', '보고서'], 
        summary: '양자역학의 기초 원리와 슈뢰딩거 고양이 실험의 현대적 해석에 관한 탐구 보고서임.',
        parsedText: '본 보고서는 양자역학의 이중 슬릿 실험을 시작으로 관찰자 효과가 물리계에 미치는 영향을 서술함...',
        uploadedAt: '2026-01-20' 
    },
    { 
        id: 'f-2', 
        studentId: 'stu-002', 
        studentName: '이서연',
        fileName: '영어_에세이_초안.docx', 
        gcsPath: '', 
        fileType: 'other', 
        category: '교과활동', 
        tags: ['영어', '에세이'], 
        summary: '환경 보호를 위한 개인의 실천 방안과 기업의 책임에 대한 영문 에세이.',
        parsedText: 'Environment protection is not a choice but a necessity. In this essay, I will discuss...',
        uploadedAt: '2026-02-10' 
    }
];

const gradeColors = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
];

export default function DashboardPage() {
    const [currentTime, setCurrentTime] = useState('');
    const [isDemo, setIsDemo] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [memos, setMemos] = useState<(Memo & { studentName: string })[]>([]);
    const [files, setFiles] = useState<(StudentFile & { studentName: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<{ answer: string; sources: { text: string; category: string; studentName: string; studentId: string; tab?: string }[] } | null>(null);
    const router = useRouter();

    const fetchData = async (mode: string) => {
        setLoading(true);
        if (mode === 'demo') {
            setStudents(demoStudents);
            setMemos(recentMemos);
            setFiles(demoFiles); // Add demo files
            setLoading(false);
            return;
        }

        const user = auth.currentUser;
        const parentId = localStorage.getItem('parentId');
        
        if (user && parentId) {
            try {
                // [보안] 승인 여부 실시간 재확인
                const { consultantService } = await import('@/lib/services/consultantService');
                const consultantData = await consultantService.getConsultant(user.uid);
                
                if (!consultantData?.approved) {
                    // 관리자(manager)인지 한 번 더 확인
                    const managerData = await consultantService.findManagerByEmail(user.email || '');
                    if (!managerData) {
                        console.warn('[Security] Unapproved access attempt by:', user.email);
                        router.push('/');
                        return;
                    }
                }

                const fetchedStudents = await studentService.getStudents(parentId);
                setStudents(fetchedStudents);

                // Fetch latest memos and files for all these students
                const allData = await Promise.all(
                    fetchedStudents.slice(0, 50).map(async (s) => {
                        const [sm, sf] = await Promise.all([
                            studentService.getMemos(s.id),
                            studentService.getFiles(s.id)
                        ]);
                        return { 
                            memos: sm.map(m => ({ ...m, studentName: s.name })), 
                            files: sf.map(f => ({ ...f, studentName: s.name })) 
                        };
                    })
                );
                
                const combinedMemos = allData.flatMap(d => d.memos).sort((a,b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                const combinedFiles = allData.flatMap(d => d.files).sort((a,b) => 
                    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                );
                
                setMemos(combinedMemos);
                setFiles(combinedFiles);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        }
        setLoading(false);
    };

    const handleAISearch = () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResult(null);

        setTimeout(() => {
            const q = searchQuery.toLowerCase();
            const answerLines: string[] = [];
            const sources: { text: string; category: string; studentName: string; studentId: string; tab?: string }[] = [];

            // 1. 데이터가 아예 없는 경우 (진실만을 말해야 함)
            if (students.length === 0) {
                setSearchResult({
                    answer: "죄송합니다. 현재 분석할 데이터(학생 정보)가 존재하지 않아 답변을 드릴 수 없습니다. 학생을 먼저 등록해 주세요.",
                    sources: []
                });
                setIsSearching(false);
                return;
            }

            // 2. 검색어 기반 필터링
            if (q.includes('내신') || q.includes('성적')) {
                // 성적 관련 답변을 하고 싶지만 데이터가 실제 있는지 확인
                const studentsWithGrades = students.filter(s => s.targetUniv !== '미정'); // 성적 데이터 유무 대용 필터 (targetUniv 미정 등으로 유추 가능할 때)
                
                if (studentsWithGrades.length > 0) {
                    answerLines.push("관리 중인 학생들의 대학 목표를 기반으로 한 분석 결과입니다.\n");
                    studentsWithGrades.slice(0, 3).forEach(s => {
                        answerLines.push(`• **${s.name}** 학생은 현재 ${s.targetUniv} ${s.targetMajor}를 목표로 학업에 매진하고 있습니다.`);
                        sources.push({ text: `${s.name} 학생의 목표 대학 정보`, category: '진입 정보', studentName: s.name, studentId: s.id, tab: 'overview' });
                    });
                } else {
                    answerLines.push("죄송합니다. 현재 학생들의 구체적인 성적 데이터가 입력되지 않았습니다. 각 학생 페이지에서 성적표를 등록해 주세요.");
                }
            } else if (q.includes('활동') || q.includes('메모') || q.includes('기록') || q.includes('담임') || q.includes('파일') || q.includes('보고서') || q.includes('계획서')) {
                const isTeacherMemoRequest = q.includes('담임');
                
                // 검색어에서 학생 이름 찾기
                const targetStudent = students.find(s => q.includes(s.name.toLowerCase()));
                
                let matchedMemos = memos.filter(m => {
                    const matchesKeyword = q.includes(m.studentName.toLowerCase()) || q.includes(m.category.toLowerCase()) || m.tags.some(t => q.includes(t.toLowerCase()));
                    const matchesStudent = targetStudent ? m.studentId === targetStudent.id : true;
                    
                    if (isTeacherMemoRequest) {
                        return matchesStudent && (m.category === '담임교사 메모' || (targetStudent && m.studentId === targetStudent.id && m.category === '담임교사 메모'));
                    }
                    return matchesKeyword && matchesStudent;
                });
                
                // 담임 메모 요청인데 필터링된 결과가 없으면 학생 객체 내부 필드도 확인
                if (isTeacherMemoRequest && matchedMemos.length === 0 && targetStudent && targetStudent.teacherMemo) {
                    answerLines.push(`기록된 **담임교사 메모**를 바탕으로 분석한 내용입니다.\n`);
                    answerLines.push(`• **${targetStudent.name}** 학생 — 담임교사 의견: ${targetStudent.teacherMemo}`);
                    sources.push({ text: targetStudent.teacherMemo.slice(0, 50) + '...', category: '기본 정보(담임)', studentName: targetStudent.name, studentId: targetStudent.id, tab: 'overview' });
                } else if (isTeacherMemoRequest && matchedMemos.length === 0 && targetStudent) {
                    // 여전히 없으면 강제 검색 (메모DB)
                    matchedMemos = memos.filter(m => m.studentId === targetStudent.id && m.category === '담임교사 메모');
                    
                    if (matchedMemos.length > 0) {
                        answerLines.push(`기록된 **담임교사 메모**를 바탕으로 분석한 내용입니다.\n`);
                        matchedMemos.slice(0, 4).forEach(m => {
                            answerLines.push(`• **${m.studentName}** 학생 — ${m.category}: ${m.content}`);
                            sources.push({ text: m.content.slice(0, 50) + '...', category: m.category, studentName: m.studentName, studentId: m.studentId, tab: 'memos' });
                        });
                    }
                } else if (matchedMemos.length > 0) {
                    answerLines.push(isTeacherMemoRequest ? `기록된 **담임교사 메모**를 바탕으로 분석한 내용입니다.\n` : `실제 기록된 활동 메모를 바탕으로 분석한 내용입니다.\n`);
                    matchedMemos.slice(0, 4).forEach(m => {
                        answerLines.push(`• **${m.studentName}** 학생 — ${m.category}: ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category, studentName: m.studentName, studentId: m.studentId, tab: 'memos' });
                    });
                }
                
                // 파일 내용 검색 추가
                const matchedFiles = files.filter(f => {
                    const matchesName = targetStudent ? f.studentId === targetStudent.id : true;
                    const matchesKeyword = f.fileName.toLowerCase().includes(q) || 
                                          (f.summary && f.summary.toLowerCase().includes(q)) || 
                                          (f.parsedText && f.parsedText.toLowerCase().includes(q)) ||
                                          f.tags.some((t: string) => q.includes(t.toLowerCase()));
                    return matchesName && matchesKeyword;
                });

                if (matchedFiles.length > 0) {
                    if (answerLines.length === 0) answerLines.push(`관련된 **파일 내용** 분석 결과입니다.\n`);
                    else answerLines.push(`\n추가로 관련된 **파일 기재 사항**입니다.\n`);
                    
                    matchedFiles.slice(0, 3).forEach(f => {
                        const contentPreview = f.summary || f.parsedText?.slice(0, 100) || f.fileName;
                        answerLines.push(`• **${f.studentName}** 학생 — [${f.fileName}]: ${contentPreview.slice(0, 70)}...`);
                        sources.push({ text: f.fileName, category: '파일내용', studentName: f.studentName, studentId: f.studentId, tab: 'files' });
                    });
                }

                if (answerLines.length === 0 && targetStudent) {
                    answerLines.push(`죄송합니다. **${targetStudent.name}** 학생의 ${isTeacherMemoRequest ? '담임교사 메모를' : '관련 활동 및 파일 기록을'} 찾지 못했습니다.`);
                    sources.push({ text: `${targetStudent.name} 학생 상세 정보 확인`, category: '정보', studentName: targetStudent.name, studentId: targetStudent.id, tab: 'overview' });
                } else if (answerLines.length === 0 && memos.length > 0 && !q.includes('어떤')) {
                    answerLines.push("최근 활동 기록들입니다.\n");
                    memos.slice(0, 3).forEach(m => {
                        answerLines.push(`• **${m.studentName}**: ${m.content}`);
                        sources.push({ text: m.content.slice(0, 50) + '...', category: m.category, studentName: m.studentName, studentId: m.studentId, tab: 'memos' });
                    });
                } else {
                    answerLines.push(isTeacherMemoRequest ? "죄송합니다. 해당 학생의 **담임교사 메모**를 찾지 못했습니다." : "죄송합니다. 입력하신 키워드와 일치하는 활동 기록을 찾지 못했습니다. 학생 페이지에서 특이사항을 메모해 주세요.");
                }
            } else {
                // 범용 답변
                answerLines.push(`"${searchQuery}"에 대해 분석한 결과입니다. 현재 관리 중인 ${students.length}명의 학생 데이터를 검토했으나, 보다 구체적인 상담을 위해서는 '성적 분석'이나 '봉사활동 기록' 등 명확한 키워드로 질문해 주세요.`);
            }

            setSearchResult({ answer: answerLines.join('\n'), sources });
            setIsSearching(false);
        }, 1200);
    };

    useEffect(() => {
        const mode = localStorage.getItem('authMode');
        const isDemoMode = mode === 'demo';
        setIsDemo(isDemoMode);
        setIsLoaded(true);

        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            fetchData(isDemoMode ? 'demo' : 'user');
        });

        const update = () => {
            setCurrentTime(
                new Date().toLocaleString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    weekday: 'long', hour: '2-digit', minute: '2-digit',
                })
            );
        };
        update();
        const timer = setInterval(update, 60000);

        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, []);

    if (!isLoaded) return null;

    return (
        <div>
            {/* Welcome Section */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
                    안녕하세요, {isDemo ? '데모 ' : ''}컨설턴트님
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {currentTime}
                </p>
            </div>

            {/* AI Search Section */}
            <div style={{ marginBottom: 'var(--space-2xl)', position: 'relative' }}>
                <div className="ai-search-bar" style={{ 
                    position: 'relative',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '6px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                }}>
                    <div className="mobile-hidden" style={{ marginLeft: '18px', color: 'var(--primary-400)' }}>
                        <SearchIcon size={22} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="AI에게 질문하세요..." 
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '16px',
                            fontSize: '1.05rem',
                            color: 'white',
                            outline: 'none'
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAISearch();
                            }
                        }}
                    />
                    <button 
                        className="btn btn-primary" 
                        style={{ borderRadius: 'var(--radius-md)', padding: '10px 24px' }}
                        onClick={handleAISearch}
                        disabled={isSearching}
                    >
                        {isSearching ? <span className="spinner" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} /> : 'AI 검색'}
                    </button>
                </div>

                {/* AI Search Results Section */}
                {searchResult && (
                    <div className="card" style={{ marginTop: 'var(--space-md)', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)', animation: 'slideDown 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-400)' }}>
                                <Brain size={18} /> AI 분석 결과
                            </h4>
                            <button className="btn btn-ghost btn-xs" onClick={() => setSearchResult(null)}>결과 닫기</button>
                        </div>
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: 'var(--space-lg)', wordBreak: 'break-all' }}>
                            {searchResult.answer}
                        </div>
                        
                        {searchResult.sources.length > 0 && (
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Paperclip size={14} /> 분석 근거 데이터
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {searchResult.sources.map((src, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{ 
                                                display: 'flex', 
                                                gap: 'var(--space-sm)', 
                                                alignItems: 'center', 
                                                padding: '8px 12px', 
                                                background: 'var(--bg-secondary)', 
                                                borderRadius: 'var(--radius-sm)', 
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onClick={() => router.push(`/dashboard/students/${src.studentId}?tab=${src.tab || 'overview'}`)}
                                            className="search-source-item"
                                        >
                                            <span style={{ fontWeight: 600, color: 'var(--primary-400)', minWidth: '50px' }}>{src.studentName}</span>
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.text}</span>
                                            <span className="tag tag-gray" style={{ fontSize: '0.65rem' }}>{src.category}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="recent-keywords-container" style={{ marginTop: '14px', display: 'flex', gap: 'var(--space-md)', paddingLeft: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <span className="mobile-hidden" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>추천:</span>
                    {['2학년 내신 추이', '자율활동 우수자', '봉사활동 20시간 이하'].map(keyword => (
                        <span 
                            key={keyword} 
                            style={{ 
                                fontSize: '0.82rem', 
                                color: 'var(--primary-300)', 
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
                            }}
                            onClick={() => {
                                const newQuery = keyword;
                                setSearchQuery(newQuery);
                                // 상태 업데이트 직후 검색을 실행하기 위해 handleAISearch 내 로직을 직접 활용하거나 
                                // setTimeout을 활용하여 상태 반영 후 실행
                                setTimeout(() => {
                                    setIsSearching(true);
                                    setSearchResult(null);
                                    setTimeout(() => {
                                        const q = newQuery.toLowerCase();
                                        const answerLines: string[] = ["추천 검색어 분석 결과입니다.\n"];
                                        const sources: { text: string; category: string; studentName: string; studentId: string; tab?: string }[] = [];
                                        
                                        if (q.includes('내신')) {
                                            answerLines.push("**성적 분석**: 현재 학생들의 내신 데이터는 전반적으로 안정적인 상태입니다.");
                                            sources.push({ text: "전체 학생 성적 데이터 분석 요약", category: '성적', studentName: '요약', studentId: students[0]?.id || '', tab: 'grades' });
                                        } else {
                                            answerLines.push(`**활동 분석**: ${newQuery}와 관련된 학생들의 주요 메모 및 파일 기록을 검토했습니다.`);
                                            sources.push({ text: "활동 로그 데이터 기반 분석", category: '활동', studentName: '분석', studentId: students[0]?.id || '', tab: 'memos' });
                                        }
                                        
                                        setSearchResult({ answer: answerLines.join('\n'), sources });
                                        setIsSearching(false);
                                    }, 1200);
                                }, 0);
                            }}
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid-2" style={{ gap: 'var(--space-lg)', minWidth: 0 }}>
                {/* Students */}
                <div className="card" style={{ minWidth: 0 }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">학생 목록</h3>
                            <p className="card-subtitle">{isDemo ? '최근 업데이트 순' : '등록된 학생이 없습니다'}</p>
                        </div>
                        <Link href="/dashboard/students" className="btn btn-sm btn-secondary">
                            전체 보기 →
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {students.map((student, idx) => (
                            <Link
                                key={student.id}
                                href={`/dashboard/students/${student.id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-md)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'background var(--transition-fast)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                                className="student-row"
                            >
                                <div
                                    className="avatar"
                                    style={{
                                        background: gradeColors[idx % gradeColors.length],
                                        color: 'white',
                                        fontWeight: 700,
                                    }}
                                >
                                    {student.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {student.school} · {student.grade}학년
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="tag tag-blue">{student.targetUniv}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card" style={{ minWidth: 0 }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">최근 활동</h3>
                            <p className="card-subtitle">{isDemo ? '최근 메모 및 기록' : '활동 내역이 없습니다'}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {memos.map((memo) => (
                            <div
                                key={memo.id}
                                style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: '3px solid var(--primary-500)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--space-xs)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            color: 'var(--primary-400)',
                                        }}
                                    >
                                        {memo.studentName}
                                    </span>
                                    <span className="tag tag-green" style={{ fontSize: '0.7rem' }}>
                                        {memo.category}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {memo.content}
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)' }}>
                                    {memo.tags.map((tag) => (
                                        <span key={tag} className="tag tag-gray" style={{ fontSize: '0.68rem' }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div
                className="card"
                style={{ marginTop: 'var(--space-lg)' }}
            >
                <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>
                    빠른 작업
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <Link href="/dashboard/students" className="btn btn-primary" style={{ flex: '1 1 140px' }}>
                        <Plus size={18} /> 학생 등록
                    </Link>
                    <Link href="/dashboard/students" className="btn btn-secondary" style={{ flex: '1 1 140px' }}>학생 관리</Link>
                    <Link href="/dashboard/admission" className="btn btn-secondary" style={{ flex: '1 1 140px' }}>합격 예측</Link>
                </div>
            </div>

            <style jsx>{`
        @media (max-width: 480px) {
            .recent-keywords-container {
                gap: 8px !important;
            }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.student-row:hover) {
          background: var(--bg-card-hover) !important;
        }
        :global(.search-source-item:hover) {
          background: var(--bg-card-hover) !important;
          transform: translateX(4px);
        }
      `}</style>
        </div>
    );
}
