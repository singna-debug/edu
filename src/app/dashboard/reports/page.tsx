'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Bot, Download, Eye, CheckCircle, Clock } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { studentService } from '@/lib/services/studentService';

export default function ReportsPage() {
    const [authMode, setAuthMode] = useState<'demo' | 'user'>('user');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

    const [students, setStudents] = useState<{id: string, name: string}[]>([]);

    useEffect(() => {
        const mode = localStorage.getItem('authMode') as 'demo' | 'user';
        if (mode) setAuthMode(mode);

        const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
            if (mode === 'demo') {
                setStudents([
                    { id: 'stu-001', name: '김민준' },
                    { id: 'stu-002', name: '이서연' },
                    { id: 'stu-003', name: '박지호' },
                    { id: 'stu-004', name: '최수아' },
                ]);
            } else if (user) {
                const data = await studentService.getStudents(user.uid);
                setStudents(data.map(s => ({ id: s.id, name: s.name })));
            }
        });
        return () => unsubscribe();
    }, []);

    const isDemo = authMode === 'demo';

    const demoReports = [
        { id: 'r1', studentName: '김민준', period: '2026.02.01 ~ 02.14', status: 'draft', generatedAt: '2026-02-15' },
        { id: 'r2', studentName: '이서연', period: '2026.01.15 ~ 01.28', status: 'approved', generatedAt: '2026-01-29' },
        { id: 'r3', studentName: '최수아', period: '2026.01.01 ~ 01.14', status: 'approved', generatedAt: '2026-01-15' },
    ];

    const reports = useMemo(() => isDemo ? demoReports : [], [isDemo, demoReports]);

    const handleGenerate = () => {
        if (!selectedStudent) return;
        setGeneratingReport(true);
        setTimeout(() => setGeneratingReport(false), 3000);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h2 style={{ fontWeight: 700 }}>보고서 관리</h2>
                    <p className="text-sm text-muted" style={{ marginTop: '2px' }}>2주 단위 학부모 보고서 자동 생성 및 관리</p>
                </div>
            </div>

            {/* Generate Report */}
            <div className="card-glass" style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 className="card-title" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="var(--primary-400)" />
                    새 보고서 생성
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">학생 선택</label>
                        <select className="form-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                            <option value="">학생을 선택하세요</option>
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={generatingReport || !selectedStudent}>
                        {generatingReport ? (
                            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> 생성 중...</>
                        ) : (
                            <><Bot size={18} style={{ marginRight: '8px' }} /> AI 보고서 생성</>
                        )}
                    </button>
                </div>
                {generatingReport && (
                    <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--warning-400)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} />
                            최근 2주간의 메모, 파일, 성적 데이터를 수집하고 AI가 학부모 보고서를 작성 중입니다...
                        </p>
                    </div>
                )}
            </div>

            {/* Reports Table */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>학생</th>
                            <th>기간</th>
                            <th>생성일</th>
                            <th>상태</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id}>
                                <td style={{ fontWeight: 600 }}>{report.studentName}</td>
                                <td style={{ fontSize: '0.85rem' }}>{report.period}</td>
                                <td style={{ fontSize: '0.85rem' }}>{new Date(report.generatedAt).toLocaleDateString('ko-KR')}</td>
                                <td>
                                    <span className={`tag ${report.status === 'approved' ? 'tag-green' : 'tag-yellow'}`}>
                                        {report.status === 'approved' ? '확정' : '초안'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn btn-ghost btn-sm"><Eye size={14} style={{ marginRight: '4px' }} /> 미리보기</button>
                                        {report.status === 'draft' && <button className="btn btn-primary btn-sm"><CheckCircle size={14} style={{ marginRight: '4px' }} /> 확정</button>}
                                        <button className="btn btn-ghost btn-sm"><Download size={14} style={{ marginRight: '4px' }} /> PDF</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>생성된 보고서가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
