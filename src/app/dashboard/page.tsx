'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Student, Memo } from '@/lib/types';

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

const gradeColors = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
];

export default function DashboardPage() {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
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
        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            {/* Welcome Section */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
                    안녕하세요, 컨설턴트님 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {currentTime}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon blue">👨‍🎓</div>
                    <div>
                        <div className="stat-value">{demoStudents.length}</div>
                        <div className="stat-label">관리 학생</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">📝</div>
                    <div>
                        <div className="stat-value">24</div>
                        <div className="stat-label">이번 달 메모</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">📁</div>
                    <div>
                        <div className="stat-value">12</div>
                        <div className="stat-label">업로드 파일</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">📋</div>
                    <div>
                        <div className="stat-value">3</div>
                        <div className="stat-label">보고서 대기</div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                {/* Students */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">학생 목록</h3>
                            <p className="card-subtitle">최근 업데이트 순</p>
                        </div>
                        <Link href="/dashboard/students" className="btn btn-sm btn-secondary">
                            전체 보기 →
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {demoStudents.map((student, idx) => (
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
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">최근 활동</h3>
                            <p className="card-subtitle">최근 메모 및 기록</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {recentMemos.map((memo) => (
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
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
                    <Link href="/dashboard/students" className="btn btn-primary">
                        ➕ 학생 등록
                    </Link>
                    <Link href="/dashboard/students/stu-001" className="btn btn-secondary">📝 메모 작성</Link>
                    <Link href="/dashboard/students/stu-001" className="btn btn-secondary">📁 파일 업로드</Link>
                    <Link href="/dashboard/analytics" className="btn btn-secondary">📊 성적 분석</Link>
                    <Link href="/dashboard/reports" className="btn btn-secondary">📋 보고서 생성</Link>
                </div>
            </div>

            <style jsx>{`
        :global(.student-row:hover) {
          background: var(--bg-card-hover) !important;
        }
      `}</style>
        </div>
    );
}
