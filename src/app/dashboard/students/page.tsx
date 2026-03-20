'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { studentService } from '@/lib/services/studentService';
import type { Student } from '@/lib/types';

const demoStudents: Student[] = [
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
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [authMode, setAuthMode] = useState<'demo' | 'user'>('user');
    const [userRole, setUserRole] = useState<'consultant' | 'manager'>('consultant');
    const [parentId, setParentId] = useState<string | null>(null);
    const [newStudent, setNewStudent] = useState({
        name: '', grade: 1, school: '', classNumber: '' as number | '', studentNumber: '' as number | '', teacherMemo: '', studentMemo: '',
    });
    const [toast, setToast] = useState<string | null>(null);

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchStudents = useCallback(async (mode: string) => {
        if (mode === 'demo') {
            setStudents(demoStudents);
            setIsLoaded(true);
            setLoading(false);
            return;
        }

        const userId = localStorage.getItem('userId');
        const role = localStorage.getItem('role') as 'consultant' | 'manager' || 'consultant';
        const pId = localStorage.getItem('parentId');
        setUserRole(role);
        setParentId(pId);

        const targetConsultantId = pId || userId;

        if (targetConsultantId) {
            try {
                const data = await studentService.getStudents(targetConsultantId);
                setStudents(data);
            } catch (error) {
                console.error("Error fetching students:", error);
                showToast("학생 목록을 불러오는데 실패했습니다.");
            }
        } else {
            setStudents([]);
        }
        setIsLoaded(true);
        setLoading(false);
    }, []);

    useEffect(() => {
        const mode = (localStorage.getItem('authMode') as 'demo' | 'user') || 'user';
        setAuthMode(mode);
        
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            fetchStudents(mode);
        });

        return () => unsubscribe();
    }, [fetchStudents]);

    const filtered = students.filter(
        (s) =>
            s.name.includes(searchQuery) ||
            s.school.includes(searchQuery) ||
            (s.targetUniv && s.targetUniv.includes(searchQuery))
    );

    const handleAddStudent = async () => {
        if (!newStudent.name.trim() || !newStudent.school.trim()) {
            showToast('이름과 학교는 필수 입력입니다.');
            return;
        }

        const userId = localStorage.getItem('userId');
        const targetConsultantId = parentId || userId || 'demo';

        try {
            const studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
                name: newStudent.name,
                grade: newStudent.grade,
                school: newStudent.school,
                classNumber: newStudent.classNumber ? Number(newStudent.classNumber) : undefined,
                studentNumber: newStudent.studentNumber ? Number(newStudent.studentNumber) : undefined,
                teacherMemo: newStudent.teacherMemo || '',
                studentMemo: newStudent.studentMemo || '',
                targetUniv: '미정',
                targetMajor: '미정',
                parentPortalToken: `token-${Date.now()}`,
                consultantId: targetConsultantId,
            };

            if (authMode === 'demo') {
                const demoStudent: Student = {
                    ...studentData,
                    id: `stu-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                setStudents([demoStudent, ...students]);
            } else {
                const newId = await studentService.addStudent(studentData);
                const fullStudent: Student = {
                    ...studentData,
                    id: newId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                setStudents([fullStudent, ...students]);
            }

            setShowModal(false);
            setNewStudent({ name: '', grade: 1, school: '', classNumber: '', studentNumber: '', teacherMemo: '', studentMemo: '' });
            showToast(`${newStudent.name} 학생이 등록되었습니다.`);
        } catch (error) {
            console.error("Error adding student:", error);
            showToast("학생 등록 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteStudentClick = (e: React.MouseEvent, studentId: string, studentName: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (userRole === 'manager') {
            showToast('❌ 학생 삭제 권한이 없습니다.');
            return;
        }
        setDeleteTarget({ id: studentId, name: studentName });
        setShowDeleteModal(true);
    };

    const confirmDeleteStudent = async () => {
        if (!deleteTarget) return;
        const { id: studentId, name: studentName } = deleteTarget;
        setShowDeleteModal(false);

        try {
            if (authMode !== 'demo') {
                await studentService.deleteStudent(studentId);
            }
            setStudents(prev => prev.filter(s => s.id !== studentId));
            showToast(`${studentName} 학생이 삭제되었습니다.`);
        } catch (error) {
            console.error("Error deleting student:", error);
            showToast("학생 삭제 중 오류가 발생했습니다.");
        } finally {
            setDeleteTarget(null);
        }
    };

    if (!isLoaded) return null;

    return (
        <div>
            {/* Top Bar */}
            <div className="flex-wrap-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', gap: 'var(--space-md)' }}>
                <div>
                    <h2 style={{ fontWeight: 700 }}>학생 관리</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {!loading && `총 ${filtered.length}명의 학생`}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto' }}>
                    <Plus size={18} /> 학생 등록
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--space-lg)', position: 'relative', maxWidth: 400 }}>
                <Search 
                    size={18} 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input
                    type="text"
                    className="form-input"
                    placeholder="학생 이름, 학교, 목표 대학 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                />
            </div>

            {/* Student Cards Grid */}
            <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-3xl)' }}>
                        <Loader2 className="spinner" size={40} style={{ margin: '0 auto', color: 'var(--primary-400)', opacity: 0.5 }} />
                        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-muted)' }}>학생 목록을 불러오고 있습니다...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map((student, idx) => (
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
                                        {student.name.slice(1) || student.name}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{student.name}</h3>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {student.school} · {student.grade}학년
                                        </p>
                                    </div>
                                    {userRole !== 'manager' && (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => handleDeleteStudentClick(e, student.id, student.name)}
                                            title="삭제"
                                            style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div style={{ minHeight: '45px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>상담 메모 / 특이사항</div>
                                    <div style={{ 
                                        fontSize: '0.88rem', 
                                        lineHeight: 1.5, 
                                        color: student.teacherMemo ? 'var(--text-secondary)' : 'var(--text-muted)',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        wordBreak: 'break-all',
                                        overflowWrap: 'break-word'
                                    }}>
                                        {student.teacherMemo || '기록된 메모가 없습니다.'}
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
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1' }} className="card">
                        <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                            <Search size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.2, margin: '0 auto' }} />
                            <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>등록된 학생이 없습니다</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>새로운 학생을 등록하여 관리를 시작해보세요.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Student Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1000 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '500px', 
                        padding: 'var(--space-xl)', 
                        border: '1px solid var(--primary-600)',
                        boxShadow: '0 0 50px rgba(99, 102, 241, 0.3)'
                    }}>
                        <div className="modal-header" style={{ marginBottom: 'var(--space-lg)', padding: 0, border: 'none' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
                                <div className="avatar avatar-sm" style={{ background: 'var(--primary-500)', color: 'white' }}>
                                    <Plus size={18} />
                                </div>
                                새 학생 등록
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <div className="form-group">
                                <label className="form-label">학생 이름 *</label>
                                <input
                                    className="form-input"
                                    placeholder="학생 이름을 입력하세요"
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    autoFocus
                                    style={{ fontSize: '1.05rem', fontWeight: 600 }}
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
                                    <input className="form-input" placeholder="학교명을 입력하세요" value={newStudent.school} onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">반</label>
                                    <input type="number" className="form-input" placeholder="반" value={newStudent.classNumber} onChange={(e) => setNewStudent({ ...newStudent, classNumber: e.target.value ? Number(e.target.value) : '' })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">번호</label>
                                    <input type="number" className="form-input" placeholder="번호" value={newStudent.studentNumber} onChange={(e) => setNewStudent({ ...newStudent, studentNumber: e.target.value ? Number(e.target.value) : '' })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">학생 메모 (이름 하단 노출)</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="학생의 성향, 특이사항 등을 자유롭게 기록하세요."
                                    value={newStudent.studentMemo}
                                    onChange={(e) => setNewStudent({ ...newStudent, studentMemo: e.target.value })}
                                    style={{ minHeight: '100px', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-xl)', gap: 'var(--space-md)' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>취소</button>
                            <button className="btn btn-primary" style={{ flex: 2, height: '48px' }} onClick={handleAddStudent}>학생 등록하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} style={{ zIndex: 1100 }}>
                    <div className="modal card-glass" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '400px', 
                        padding: 'var(--space-xl)', 
                        border: '1px solid var(--danger-600)',
                        boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)'
                    }}>
                         <div className="modal-header" style={{ marginBottom: 'var(--space-md)', padding: 0, border: 'none' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-400)', fontWeight: 700 }}>
                                <Trash2 size={24} />
                                학생 정보 삭제
                            </h3>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>
                                <strong>"{deleteTarget?.name}"</strong> 학생의 모든 정보를 기록에서 영구히 삭제하시겠습니까?
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '4px', borderLeft: '4px solid var(--danger-500)' }}>
                                ※ 삭제된 학생의 메모, 파일, 성적 등 모든 데이터가 소실되며 복구할 수 없습니다.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-xl)', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>아니오</button>
                            <button className="btn btn-primary" style={{ flex: 1.5, background: 'var(--danger-600)', borderColor: 'var(--danger-500)' }} onClick={confirmDeleteStudent}>네, 삭제하겠습니다</button>
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
