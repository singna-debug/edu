'use client';

import { useState } from 'react';
import { use } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement);

// Demo data mapped by portal token
const portalData: Record<string, {
    name: string; school: string; grade: number; classNumber?: number; targetUniv?: string; targetMajor?: string;
    memos: { content: string; category: string; date: string }[];
    files: { name: string; category: string; date: string }[];
    grades: { label: string; subjects: { name: string; score: number; grade: number }[] }[];
    competency: Record<string, number>;
    books: { title: string; author: string; subject: string }[];
}> = {
    'demo-token-001': {
        name: '김민준', school: '서울과학고등학교', grade: 2, classNumber: 3, targetUniv: '서울대학교', targetMajor: '물리학과',
        memos: [
            { content: '물리 심화 탐구 보고서 초안 제출. 엔트로피 관련 실험 설계 우수.', category: '진로활동', date: '2026-02-17' },
            { content: '수학 경시대회 예선 통과. AMC 12 준비 중.', category: '자율활동', date: '2026-02-14' },
            { content: '물리 동아리에서 양자역학 세미나 발표. 발표력 우수.', category: '동아리', date: '2026-02-10' },
        ],
        files: [
            { name: '물리탐구보고서_엔트로피.pdf', category: '진로활동', date: '2026-02-15' },
            { name: '2학년_1학기_성적표.pdf', category: '성적표', date: '2025-07-10' },
        ],
        grades: [
            { label: '2-1 중간', subjects: [{ name: '국어', score: 90, grade: 2 }, { name: '수학', score: 95, grade: 1 }, { name: '물리Ⅰ', score: 96, grade: 1 }] },
            { label: '2-1 기말', subjects: [{ name: '국어', score: 92, grade: 2 }, { name: '수학', score: 97, grade: 1 }, { name: '물리Ⅰ', score: 98, grade: 1 }] },
            { label: '2-2 중간', subjects: [{ name: '국어', score: 88, grade: 3 }, { name: '수학', score: 96, grade: 1 }, { name: '물리Ⅱ', score: 97, grade: 1 }] },
            { label: '2-2 기말', subjects: [{ name: '국어', score: 90, grade: 2 }, { name: '수학', score: 98, grade: 1 }, { name: '물리Ⅱ', score: 99, grade: 1 }] },
        ],
        competency: { '학업역량': 9, '진로역량': 8, '자기주도성': 8, '발전가능성': 9, '공동체의식': 7 },
        books: [
            { title: '파인만의 물리학 강의', author: '리처드 파인만', subject: '물리학' },
            { title: '코스모스', author: '칼 세이건', subject: '과학 일반' },
        ],
    },
    'demo-token-002': {
        name: '이서연', school: '대원외국어고등학교', grade: 3, classNumber: 1, targetUniv: '연세대학교', targetMajor: '국제학과',
        memos: [{ content: '영어 에세이 우수 평가. 모의 UN 참가.', category: '자율활동', date: '2026-02-10' }],
        files: [{ name: '영어에세이_글로벌이슈.pdf', category: '교과활동', date: '2026-02-10' }],
        grades: [{ label: '3-1 중간', subjects: [{ name: '영어', score: 95, grade: 1 }, { name: '국어', score: 88, grade: 2 }] }],
        competency: { '학업역량': 8, '진로역량': 9, '자기주도성': 7, '발전가능성': 8, '공동체의식': 9 },
        books: [{ title: 'Factfulness', author: 'Hans Rosling', subject: '사회' }],
    },
};

export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const data = portalData[token];
    const [activeSection, setActiveSection] = useState<'overview' | 'grades' | 'activities' | 'files'>('overview');

    if (!data) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>접근 권한이 없습니다</h1>
                    <p style={{ color: '#94a3b8' }}>유효하지 않은 링크입니다. 담당 컨설턴트에게 문의하세요.</p>
                </div>
            </div>
        );
    }

    const radarData = {
        labels: Object.keys(data.competency),
        datasets: [{ label: '역량', data: Object.values(data.competency), backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366f1', borderWidth: 2, pointBackgroundColor: '#6366f1' }],
    };
    const radarOpts = { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 10, ticks: { color: '#64748b', backdropColor: 'transparent', stepSize: 2 }, grid: { color: 'rgba(30,41,59,0.5)' }, pointLabels: { color: '#94a3b8', font: { size: 11 } }, angleLines: { color: 'rgba(30,41,59,0.5)' } } }, plugins: { legend: { display: false } } };

    const lineData = {
        labels: data.grades.map(g => g.label),
        datasets: Array.from(new Set(data.grades.flatMap(g => g.subjects.map(s => s.name)))).map((name, i) => {
            const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
            return { label: name, data: data.grades.map(g => g.subjects.find(s => s.name === name)?.score || null), borderColor: colors[i % colors.length], tension: 0.4, fill: false };
        }),
    };
    const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30,41,59,0.5)' } }, y: { min: 80, max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(30,41,59,0.5)' } } } };

    const sectionBtns = [
        { key: 'overview' as const, label: '📋 개요' },
        { key: 'grades' as const, label: '📊 성적' },
        { key: 'activities' as const, label: '📝 활동' },
        { key: 'files' as const, label: '📁 파일' },
    ];

    const cardStyle = { background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '16px' };
    const headingStyle = { fontSize: '1rem', fontWeight: 700 as const, marginBottom: '12px', color: '#f1f5f9' };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#f1f5f9', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Header */}
            <div style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.1)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                        {data.name.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{data.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{data.school} · {data.grade}학년{data.classNumber ? ` ${data.classNumber}반` : ''}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>🟢 실시간</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
                {/* Section Navigation */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
                    {sectionBtns.map(b => (
                        <button key={b.key} onClick={() => setActiveSection(b.key)}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
                                background: activeSection === b.key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,41,59,0.5)',
                                color: activeSection === b.key ? 'white' : '#94a3b8' }}>
                            {b.label}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {activeSection === 'overview' && (
                    <>
                        <div style={cardStyle}>
                            <div style={headingStyle}>🎯 목표</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.85rem' }}>{data.targetUniv}</span>
                                <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.85rem' }}>{data.targetMajor}</span>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>메모</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.memos.length}건</div></div>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>파일</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.files.length}건</div></div>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>성적 기록</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.grades.length}건</div></div>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>도서</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{data.books.length}권</div></div>
                        </div>
                        <div style={cardStyle}>
                            <div style={headingStyle}>📊 역량 분석</div>
                            <div style={{ height: 250 }}><Radar data={radarData} options={radarOpts} /></div>
                        </div>
                    </>
                )}

                {/* Grades */}
                {activeSection === 'grades' && (
                    <>
                        <div style={cardStyle}>
                            <div style={headingStyle}>📈 성적 추이</div>
                            <div style={{ height: 280 }}><Line data={lineData} options={lineOpts} /></div>
                        </div>
                        {data.grades.map((g, i) => (
                            <div key={i} style={cardStyle}>
                                <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>{g.label}</div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {g.subjects.map((s, j) => (
                                        <div key={j} style={{ background: 'rgba(15,23,42,0.5)', padding: '8px 12px', borderRadius: '8px', minWidth: 80 }}>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.name}</div>
                                            <div style={{ fontWeight: 700 }}>{s.score}점 <span style={{ fontSize: '0.78rem', color: '#818cf8' }}>{s.grade}등급</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Activities */}
                {activeSection === 'activities' && (
                    <>
                        {data.memos.map((m, i) => (
                            <div key={i} style={{ ...cardStyle, borderLeft: '3px solid #6366f1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.72rem' }}>{m.category}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.date}</span>
                                </div>
                                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>{m.content}</p>
                            </div>
                        ))}
                        {data.books.length > 0 && (
                            <div style={cardStyle}>
                                <div style={headingStyle}>📚 독서 기록</div>
                                {data.books.map((b, i) => (
                                    <div key={i} style={{ padding: '8px 0', borderBottom: i < data.books.length - 1 ? '1px solid rgba(148,163,184,0.1)' : 'none' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{b.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{b.author} · {b.subject}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Files */}
                {activeSection === 'files' && (
                    <>
                        {data.files.map((f, i) => (
                            <div key={i} style={cardStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{f.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{f.category} · {f.date}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: '0.75rem' }}>
                    <p>EduFlow AI · 학부모 포털</p>
                    <p style={{ marginTop: '4px' }}>본 페이지는 담당 컨설턴트가 업데이트한 내용이 실시간으로 반영됩니다.</p>
                </div>
            </div>
        </div>
    );
}
