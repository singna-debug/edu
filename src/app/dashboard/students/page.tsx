'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Student } from '@/lib/types';

const initialStudents: Student[] = [
    { id: 'stu-001', name: '김민준', grade: 2, school: '서울과학고등학교', targetUniv: '서울대학교', targetMajor: '물리학과', consultantId: 'demo', createdAt: '2025-03-15', updatedAt: '2026-02-17' },
    { id: 'stu-002', name: '이서연', grade: 3, school: '대원외국어고등학교', targetUniv: '연세대학교', targetMajor: '국제학과', consultantId: 'demo', createdAt: '2025-06-01', updatedAt: '2026-02-16' },
    { id: 'stu-003', name: '박지호', grade: 1, school: '한영중학교 (예비고1)', targetUniv: '미정', targetMajor: '공학 계열', consultantId: 'demo', createdAt: '2026-01-10', updatedAt: '2026-02-15' },
    { id: 'stu-004', name: '최수아', grade: 3, school: '민족사관고등학교', targetUniv: 'KAIST', targetMajor: '전산학부', consultantId: 'demo', createdAt: '2024-09-20', updatedAt: '2026-02-14' },
];

const avatarColors = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #14b8a6, #2dd4bf)',
];

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStudent, setNewStudent] = useState({
        name: '', grade: 1, school: '', targetUniv: '', targetMajor: '',
    });
    const [toast, setToast] = useState<string | null>(null);

    const filtered = students.filter(
        (s) =>
            s.name.includes(searchQuery) ||
            s.school.includes(searchQuery) ||
            (s.targetUniv && s.targetUniv.includes(searchQuery))
    );

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddStudent = () => {
        if (!newStudent.name.trim() || !newStudent.school.trim()) {
            showToast('⚠️ 이름과 학교는 필수 입력입니다.');
            return;
        }

        const student: Student = {
            id: `stu-${Date.now()}`,
            name: newStudent.name,
            grade: newStudent.grade,
            school: newStudent.school,
            targetUniv: newStudent.targetUniv || '미정',
            targetMajor: newStudent.targetMajor || '미정',
            consultantId: 'demo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setStudents([student, ...students]);
        setShowModal(false);
        setNewStudent({ name: '', grade: 1, school: '', targetUniv: '', targetMajor: '' });
        showToast(`✅ ${student.name} 학생이 등록되었습니다.`);
    };

    const handleDeleteStudent = (e: React.MouseEvent, studentId: string, studentName: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`정말 ${studentName} 학생을 삭제하시겠습니까?`)) {
            setStudents(students.filter(s => s.id !== studentId));
            showToast(`🗑️ ${studentName} 학생이 삭제되었습니다.`);
        }
    };

    return (
        <div>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h2 style={{ fontWeight: 700 }}>학생 관리</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        총 {filtered.length}명의 학생
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ 학생 등록
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 학생 이름, 학교, 목표 대학 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ maxWidth: 400 }}
                />
            </div>

            {/* Student Cards Grid */}
            <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                {filtered.map((student, idx) => (
                    <Link
                        key={student.id}
                        href={`/dashboard/students/${student.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="card" style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                <div
                                    className="avatar avatar-lg"
                                    style={{ background: avatarColors[idx % avatarColors.length], color: 'white', fontWeight: 700, fontSize: '1.2rem' }}
                                >
                                    {student.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{student.name}</h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        {student.school} · {student.grade}학년
                                    </p>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleDeleteStudent(e, student.id, student.name)}
                                    title="삭제"
                                    style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                                >
                                    🗑️
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 120 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>목표 대학</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-400)' }}>
                                        {student.targetUniv || '미정'}
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 120 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>목표 학과</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                        {student.targetMajor || '미정'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    마지막 업데이트: {new Date(student.updatedAt).toLocaleDateString('ko-KR')}
                                </span>
                                <span className="btn btn-ghost btn-sm">상세 보기 →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔍</div>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>검색 결과가 없습니다</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>다른 검색어를 시도해보세요.</p>
                </div>
            )}

            {/* Add Student Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontWeight: 700 }}>새 학생 등록</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">이름 *</label>
                                <input
                                    className="form-input"
                                    placeholder="학생 이름"
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">학년 *</label>
                                    <select className="form-select" value={newStudent.grade} onChange={(e) => setNewStudent({ ...newStudent, grade: Number(e.target.value) })}>
                                        <option value={1}>1학년</option>
                                        <option value={2}>2학년</option>
                                        <option value={3}>3학년</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">학교 *</label>
                                    <input className="form-input" placeholder="학교명" value={newStudent.school} onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">목표 대학</label>
                                    <input className="form-input" placeholder="목표 대학" value={newStudent.targetUniv} onChange={(e) => setNewStudent({ ...newStudent, targetUniv: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">목표 학과</label>
                                    <input className="form-input" placeholder="목표 학과" value={newStudent.targetMajor} onChange={(e) => setNewStudent({ ...newStudent, targetMajor: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                            <button className="btn btn-primary" onClick={handleAddStudent}>등록</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="toast toast-success">
                    {toast}
                </div>
            )}
        </div>
    );
}
