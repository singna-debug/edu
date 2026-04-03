'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
import { studentService } from '@/lib/services/studentService';
import type { Student, Memo, StudentFile, GradeRecord, BookRecord } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement);

export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [grades, setGrades] = useState<GradeRecord[]>([]);
    const [books, setBooks] = useState<BookRecord[]>([]);
    const [activeSection, setActiveSection] = useState<'overview' | 'grades' | 'activities' | 'files'>('overview');

    useEffect(() => {
        const fetchPortalData = async () => {
            try {
                const s = await studentService.getStudentByPortalToken(token);
                if (s) {
                    setStudent(s);
                    const [m, f, g, b] = await Promise.all([
                        studentService.getMemos(s.id),
                        studentService.getFiles(s.id),
                        studentService.getGrades(s.id),
                        studentService.getBooks(s.id),
                    ]);
                    setMemos(m);
                    setFiles(f);
                    setGrades(g);
                    setBooks(b);
                }
            } catch (error) {
                console.error("Error fetching parent portal data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPortalData();
    }, [token]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f1f5f9' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6366f1', animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '1rem', color: '#94a3b8' }}>데이터를 불러오는 중입니다...</p>
                    <style jsx>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
                </div>
            </div>
        );
    }

    if (!student) {
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
        labels: ['학업역량', '진로역량', '자기주도성', '발전가능성', '공동체의식'],
        datasets: [{ 
            label: '역량', 
            data: [0, 0, 0, 0, 0], // AI 분석 데이터 필드가 아직 확정되지 않음
            backgroundColor: 'rgba(99,102,241,0.2)', 
            borderColor: '#6366f1', 
            borderWidth: 2, 
            pointBackgroundColor: '#6366f1' 
        }],
    };
    const radarOpts = { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 10, ticks: { color: '#64748b', backdropColor: 'transparent', stepSize: 2 }, grid: { color: 'rgba(30,41,59,0.5)' }, pointLabels: { color: '#94a3b8', font: { size: 11 } }, angleLines: { color: 'rgba(30,41,59,0.5)' } } }, plugins: { legend: { display: false } } };

    const lineData = {
        labels: grades.map(g => `${g.studentGrade}학년 ${g.examType === '내신' ? `${g.semester}학기` : `${g.month}월`}`),
        datasets: Array.from(new Set(grades.flatMap(g => g.subjects.map(s => s.name)))).map((name, i) => {
            const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
            return { label: name, data: grades.map(g => g.subjects.find(s => s.name === name)?.score || null), borderColor: colors[i % colors.length], tension: 0.4, fill: false };
        }),
    };
    const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(30,41,59,0.5)' } }, y: { min: 50, max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(30,41,59,0.5)' } } } };

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
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{student.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{student.school} · {student.grade}학년{student.classNumber ? ` ${student.classNumber}반` : ''}</div>
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
                                <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.85rem' }}>{student.targetUniv || '대학교 미정'}</span>
                                <span style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.85rem' }}>{student.targetMajor || '학과 미정'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>메모</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{memos.length}건</div></div>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>파일</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{files.length}건</div></div>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>성적 기록</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{grades.length}건</div></div>
                            <div style={cardStyle}><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>도서</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{books.length}권</div></div>
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
                        {grades.map((g, i) => (
                            <div key={i} style={cardStyle}>
                                <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>
                                    {g.studentGrade}학년 {g.examType === '내신' ? `${g.semester}학기 ${g.examPeriod || ''}` : `${g.month}월`}
                                </div>
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
                        {memos.map((m, i) => (
                            <div key={i} style={{ ...cardStyle, borderLeft: '3px solid #6366f1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.72rem' }}>{m.category}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>{m.content}</p>
                            </div>
                        ))}
                        {books.length > 0 && (
                            <div style={cardStyle}>
                                <div style={headingStyle}>📚 독서 기록</div>
                                {books.map((b, i) => (
                                    <div key={i} style={{ padding: '8px 0', borderBottom: i < books.length - 1 ? '1px solid rgba(148,163,184,0.1)' : 'none' }}>
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
                        {files.map((f, i) => (
                            <div key={i} style={cardStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{f.fileName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{f.category} · {new Date(f.uploadedAt).toLocaleDateString()}</div>
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
