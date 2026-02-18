'use client';

import { useState, useRef, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { AdmissionBenchmark } from '@/lib/types';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement, LineElement,
    Filler, Title, Tooltip, Legend
);

// ============ DEMO DATA ============

const demoStudents = [
    { id: 'stu-001', name: '김민준', grade: 2, school: '서울과학고등학교', targetUniv: '서울대학교', targetMajor: '물리학과' },
    { id: 'stu-002', name: '이서연', grade: 3, school: '대원외국어고등학교', targetUniv: '연세대학교', targetMajor: '국제학과' },
    { id: 'stu-003', name: '박지호', grade: 1, school: '한영중학교 (예비고1)', targetUniv: '미정', targetMajor: '공학 계열' },
    { id: 'stu-004', name: '최수아', grade: 3, school: '민족사관고등학교', targetUniv: 'KAIST', targetMajor: '전산학부' },
];

// 학생별 성적
const studentGrades: Record<string, { gpaAvg: number; korean: number; math: number; english: number; science: number }> = {
    'stu-001': { gpaAvg: 1.6, korean: 93, math: 97, english: 89, science: 97 },
    'stu-002': { gpaAvg: 2.1, korean: 88, math: 82, english: 95, science: 80 },
    'stu-003': { gpaAvg: 3.2, korean: 78, math: 75, english: 80, science: 72 },
    'stu-004': { gpaAvg: 1.3, korean: 91, math: 98, english: 90, science: 98 },
};

// 합격 데이터 초기값
const initialBenchmarks: AdmissionBenchmark[] = [
    // 서울대 물리학과
    { id: 'ab-001', university: '서울대학교', major: '물리학과', year: 2024, gpaAvg: 1.3, koreanAvg: 94, mathAvg: 97, englishGrade: 1, scienceAvg: 96, admissionType: '수시', createdAt: '2024-03-01' },
    { id: 'ab-002', university: '서울대학교', major: '물리학과', year: 2025, gpaAvg: 1.2, koreanAvg: 95, mathAvg: 98, englishGrade: 1, scienceAvg: 97, admissionType: '수시', createdAt: '2025-03-01' },
    { id: 'ab-003', university: '서울대학교', major: '물리학과', year: 2026, gpaAvg: 1.4, koreanAvg: 93, mathAvg: 96, englishGrade: 1, scienceAvg: 95, admissionType: '수시', createdAt: '2026-01-15' },
    // 연세대 국제학과
    { id: 'ab-007', university: '연세대학교', major: '국제학과', year: 2024, gpaAvg: 1.8, koreanAvg: 92, mathAvg: 90, englishGrade: 1, scienceAvg: 85, admissionType: '수시', createdAt: '2024-03-01' },
    { id: 'ab-008', university: '연세대학교', major: '국제학과', year: 2025, gpaAvg: 1.7, koreanAvg: 93, mathAvg: 91, englishGrade: 1, scienceAvg: 87, admissionType: '수시', createdAt: '2025-03-01' },
    { id: 'ab-009', university: '연세대학교', major: '국제학과', year: 2026, gpaAvg: 1.9, koreanAvg: 91, mathAvg: 89, englishGrade: 1, scienceAvg: 84, admissionType: '수시', createdAt: '2026-01-15' },
    // KAIST 전산학부
    { id: 'ab-010', university: 'KAIST', major: '전산학부', year: 2024, gpaAvg: 1.1, koreanAvg: 90, mathAvg: 99, englishGrade: 1, scienceAvg: 98, admissionType: '수시', createdAt: '2024-03-01' },
    { id: 'ab-011', university: 'KAIST', major: '전산학부', year: 2025, gpaAvg: 1.0, koreanAvg: 91, mathAvg: 99, englishGrade: 1, scienceAvg: 99, admissionType: '수시', createdAt: '2025-03-01' },
    { id: 'ab-012', university: 'KAIST', major: '전산학부', year: 2026, gpaAvg: 1.2, koreanAvg: 89, mathAvg: 98, englishGrade: 1, scienceAvg: 97, admissionType: '수시', createdAt: '2026-01-15' },
    // 고려대 컴퓨터학과
    { id: 'ab-013', university: '고려대학교', major: '컴퓨터학과', year: 2024, gpaAvg: 1.5, koreanAvg: 91, mathAvg: 95, englishGrade: 1, scienceAvg: 93, admissionType: '수시', createdAt: '2024-03-01' },
    { id: 'ab-014', university: '고려대학교', major: '컴퓨터학과', year: 2025, gpaAvg: 1.4, koreanAvg: 92, mathAvg: 96, englishGrade: 1, scienceAvg: 94, admissionType: '수시', createdAt: '2025-03-01' },
    { id: 'ab-015', university: '고려대학교', major: '컴퓨터학과', year: 2026, gpaAvg: 1.6, koreanAvg: 90, mathAvg: 94, englishGrade: 1, scienceAvg: 92, admissionType: '수시', createdAt: '2026-01-15' },
    // 성균관대 의예과
    { id: 'ab-016', university: '성균관대학교', major: '의예과', year: 2024, gpaAvg: 1.0, koreanAvg: 96, mathAvg: 99, englishGrade: 1, scienceAvg: 99, admissionType: '수시', createdAt: '2024-03-01' },
    { id: 'ab-017', university: '성균관대학교', major: '의예과', year: 2025, gpaAvg: 1.0, koreanAvg: 97, mathAvg: 99, englishGrade: 1, scienceAvg: 99, admissionType: '수시', createdAt: '2025-03-01' },
    { id: 'ab-018', university: '성균관대학교', major: '의예과', year: 2026, gpaAvg: 1.1, koreanAvg: 95, mathAvg: 98, englishGrade: 1, scienceAvg: 98, admissionType: '수시', createdAt: '2026-01-15' },
];

const chartTextColor = '#94a3b8';
const chartGridColor = 'rgba(30, 41, 59, 0.5)';

// ============ COMPONENT ============

export default function AdmissionComparisonPage() {
    const [selectedStudent, setSelectedStudent] = useState('stu-001');
    const [selectedUniv, setSelectedUniv] = useState('서울대학교');
    const [selectedMajor, setSelectedMajor] = useState('물리학과');
    const [searchQuery, setSearchQuery] = useState('');
    const [benchmarks, setBenchmarks] = useState<AdmissionBenchmark[]>(initialBenchmarks);
    const [toast, setToast] = useState<string | null>(null);
    const [showDataPanel, setShowDataPanel] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Manual input form
    const [manualForm, setManualForm] = useState({
        university: '', major: '', year: 2026, gpaAvg: '',
        koreanAvg: '', mathAvg: '', englishGrade: '', scienceAvg: '',
        admissionType: '수시' as '수시' | '정시',
    });

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // Derived data
    const universities = useMemo(() => [...new Set(benchmarks.map(b => b.university))], [benchmarks]);
    const majors = useMemo(() => {
        const uniMajors = benchmarks.filter(b => b.university === selectedUniv).map(b => b.major);
        return [...new Set(uniMajors)];
    }, [benchmarks, selectedUniv]);

    // Filtered benchmarks for selected univ + major
    const filtered = useMemo(() =>
        benchmarks.filter(b => b.university === selectedUniv && b.major === selectedMajor)
            .sort((a, b) => a.year - b.year),
        [benchmarks, selectedUniv, selectedMajor]
    );

    // Search filter for dropdowns
    const filteredUnivs = searchQuery
        ? universities.filter(u => u.includes(searchQuery))
        : universities;

    const studentData = studentGrades[selectedStudent];
    const student = demoStudents.find(s => s.id === selectedStudent)!;

    // ============ GAP ANALYSIS ============

    const latestBenchmark = filtered.length > 0 ? filtered[filtered.length - 1] : null;
    const gpaGap = latestBenchmark && studentData
        ? (studentData.gpaAvg - latestBenchmark.gpaAvg)
        : null;
    const mathGap = latestBenchmark?.mathAvg && studentData
        ? (studentData.math - latestBenchmark.mathAvg)
        : null;
    const koreanGap = latestBenchmark?.koreanAvg && studentData
        ? (studentData.korean - latestBenchmark.koreanAvg)
        : null;
    const scienceGap = latestBenchmark?.scienceAvg && studentData
        ? (studentData.science - latestBenchmark.scienceAvg)
        : null;

    // Admission zone classification
    const getAdmissionZone = () => {
        if (!gpaGap) return null;
        if (gpaGap <= 0) return { label: '합격 안정권', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' };
        if (gpaGap <= 0.5) return { label: '추가합격권', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '⚠️' };
        return { label: '소신지원권', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '🔴' };
    };

    const zone = getAdmissionZone();

    // ============ CHART DATA ============

    // GPA Bar Chart - 3개년 합격자 vs 학생
    const gpaChartData = {
        labels: filtered.map(b => `${b.year}년 합격 평균`).concat([`${student.name} 현재`]),
        datasets: [{
            label: '내신 평균 등급',
            data: [...filtered.map(b => b.gpaAvg), studentData.gpaAvg],
            backgroundColor: [
                ...filtered.map(() => 'rgba(99, 102, 241, 0.25)'),
                zone?.color === '#10b981' ? 'rgba(16, 185, 129, 0.8)' :
                    zone?.color === '#f59e0b' ? 'rgba(245, 158, 11, 0.8)' :
                        'rgba(239, 68, 68, 0.8)',
            ],
            borderColor: [
                ...filtered.map(() => 'rgba(99, 102, 241, 0.6)'),
                zone?.color || '#6366f1',
            ],
            borderWidth: 2,
            borderRadius: 8,
        }],
    };

    const gpaChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: '📊 내신 등급 비교 (낮을수록 우수)',
                color: '#f1f5f9',
                font: { size: 14, family: 'Inter', weight: 'bold' as const },
                padding: { bottom: 16 },
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.parsed.y}등급`,
                },
            },
        },
        scales: {
            x: {
                ticks: { color: chartTextColor, font: { size: 11 } },
                grid: { color: chartGridColor },
            },
            y: {
                reverse: true,
                min: 0,
                max: 5,
                ticks: { color: chartTextColor, stepSize: 0.5, callback: (v) => `${v}등급` },
                grid: { color: chartGridColor },
            },
        },
    };

    // Subject Score Chart
    const subjectChartData = {
        labels: ['국어', '수학', '영어', '탐구'],
        datasets: [
            {
                label: `합격 평균 (${latestBenchmark?.year || '-'})`,
                data: [
                    latestBenchmark?.koreanAvg || 0,
                    latestBenchmark?.mathAvg || 0,
                    latestBenchmark?.englishGrade ? (100 - (latestBenchmark.englishGrade - 1) * 10) : 0,
                    latestBenchmark?.scienceAvg || 0,
                ],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 0.7)',
                borderWidth: 2,
                borderRadius: 6,
            },
            {
                label: `${student.name} 현재`,
                data: [
                    studentData.korean,
                    studentData.math,
                    studentData.english,
                    studentData.science,
                ],
                backgroundColor: 'rgba(52, 211, 153, 0.7)',
                borderColor: '#34d399',
                borderWidth: 2,
                borderRadius: 6,
            },
        ],
    };

    const subjectChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: chartTextColor, font: { family: 'Inter' } },
            },
            title: {
                display: true,
                text: '📈 수능/모의고사 영역별 비교 (백분위)',
                color: '#f1f5f9',
                font: { size: 14, family: 'Inter', weight: 'bold' as const },
                padding: { bottom: 16 },
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}점`,
                },
            },
        },
        scales: {
            x: {
                ticks: { color: chartTextColor, font: { size: 12 } },
                grid: { color: chartGridColor },
            },
            y: {
                min: 60,
                max: 100,
                ticks: { color: chartTextColor, stepSize: 5 },
                grid: { color: chartGridColor },
            },
        },
    };

    // GPA Trend Chart
    const gpaTrendData = {
        labels: filtered.map(b => `${b.year}년`),
        datasets: [
            {
                label: '합격자 내신 평균',
                data: filtered.map(b => b.gpaAvg),
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                borderColor: 'rgba(99, 102, 241, 0.7)',
                borderWidth: 2,
                borderRadius: 6,
            },
        ],
    };

    const gpaTrendOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: '📉 3개년 합격 내신 추이',
                color: '#f1f5f9',
                font: { size: 14, family: 'Inter', weight: 'bold' as const },
                padding: { bottom: 16 },
            },
        },
        scales: {
            x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
            y: {
                reverse: true, min: 0, max: 3,
                ticks: { color: chartTextColor, stepSize: 0.5, callback: (v) => `${v}등급` },
                grid: { color: chartGridColor },
            },
        },
    };

    // ============ HANDLERS ============

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            // Parse CSV client-side for demo
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                showToast('⚠️ 파일에 데이터가 부족합니다.');
                setUploading(false);
                return;
            }
            const parsed: AdmissionBenchmark[] = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length < 4) continue;
                parsed.push({
                    id: `ab-upload-${Date.now()}-${i}`,
                    university: cols[0],
                    major: cols[1],
                    year: parseInt(cols[2]) || 2026,
                    gpaAvg: parseFloat(cols[3]) || 0,
                    koreanAvg: cols[4] ? parseFloat(cols[4]) : undefined,
                    mathAvg: cols[5] ? parseFloat(cols[5]) : undefined,
                    englishGrade: cols[6] ? parseInt(cols[6]) : undefined,
                    scienceAvg: cols[7] ? parseFloat(cols[7]) : undefined,
                    admissionType: (cols[8] === '정시' ? '정시' : '수시') as '수시' | '정시',
                    createdAt: new Date().toISOString(),
                });
            }
            if (parsed.length > 0) {
                setBenchmarks(prev => [...prev, ...parsed]);
                showToast(`✅ ${parsed.length}건의 합격 데이터가 추가되었습니다.`);
            } else {
                showToast('⚠️ 파싱 가능한 데이터가 없습니다.');
            }
        } catch {
            showToast('❌ 파일 처리 중 오류가 발생했습니다.');
        }
        setUploading(false);
    };

    const handleManualSubmit = () => {
        if (!manualForm.university || !manualForm.major || !manualForm.gpaAvg) {
            showToast('⚠️ 대학명, 학과명, 내신 평균은 필수입니다.');
            return;
        }
        const newBenchmark: AdmissionBenchmark = {
            id: `ab-${Date.now()}`,
            university: manualForm.university,
            major: manualForm.major,
            year: manualForm.year,
            gpaAvg: parseFloat(manualForm.gpaAvg),
            koreanAvg: manualForm.koreanAvg ? parseFloat(manualForm.koreanAvg) : undefined,
            mathAvg: manualForm.mathAvg ? parseFloat(manualForm.mathAvg) : undefined,
            englishGrade: manualForm.englishGrade ? parseInt(manualForm.englishGrade) : undefined,
            scienceAvg: manualForm.scienceAvg ? parseFloat(manualForm.scienceAvg) : undefined,
            admissionType: manualForm.admissionType,
            createdAt: new Date().toISOString(),
        };
        setBenchmarks(prev => [...prev, newBenchmark]);
        setManualForm({
            university: '', major: '', year: 2026, gpaAvg: '',
            koreanAvg: '', mathAvg: '', englishGrade: '', scienceAvg: '',
            admissionType: '수시',
        });
        showToast('✅ 합격 데이터가 추가되었습니다.');
    };

    const handleDeleteBenchmark = (id: string) => {
        setBenchmarks(prev => prev.filter(b => b.id !== id));
        showToast('🗑️ 합격 데이터가 삭제되었습니다.');
    };

    // ============ RENDER ============

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontWeight: 700 }}>🎯 합격 예측 비교</h2>
                <p className="text-sm text-muted" style={{ marginTop: '2px' }}>
                    목표 학과의 합격 데이터와 학생 성적을 비교 분석합니다
                </p>
            </div>

            {/* Filters */}
            <div className="card-glass" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">👨‍🎓 학생 선택</label>
                        <select
                            className="form-select"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            {demoStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.school} {s.grade}학년)</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">🏫 대학 선택</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                placeholder="대학 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchQuery('')}
                                style={{ marginBottom: '4px' }}
                            />
                            <select
                                className="form-select"
                                value={selectedUniv}
                                onChange={(e) => {
                                    setSelectedUniv(e.target.value);
                                    const univMajors = benchmarks.filter(b => b.university === e.target.value).map(b => b.major);
                                    const uniqueMajors = [...new Set(univMajors)];
                                    if (uniqueMajors.length > 0 && !uniqueMajors.includes(selectedMajor)) {
                                        setSelectedMajor(uniqueMajors[0]);
                                    }
                                }}
                            >
                                {filteredUnivs.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">📚 학과 선택</label>
                        <select
                            className="form-select"
                            value={selectedMajor}
                            onChange={(e) => setSelectedMajor(e.target.value)}
                        >
                            {majors.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Gap Analysis + Zone Cards */}
            {latestBenchmark && studentData && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                    {/* Zone Badge */}
                    {zone && (
                        <div className="stat-card" style={{
                            borderLeft: `4px solid ${zone.color}`,
                            background: zone.bg,
                            gridColumn: '1 / -1',
                            padding: 'var(--space-lg)',
                        }}>
                            <div style={{ fontSize: '2rem' }}>{zone.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: zone.color, marginBottom: '4px' }}>
                                    {zone.label}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {student.name} 학생은 {selectedUniv} {selectedMajor} 기준으로{' '}
                                    <strong style={{ color: zone.color }}>
                                        {gpaGap !== null && gpaGap > 0
                                            ? `내신 ${gpaGap.toFixed(1)}등급 보완 필요`
                                            : `내신 ${Math.abs(gpaGap || 0).toFixed(1)}등급 여유`}
                                    </strong>
                                    {mathGap !== null && (
                                        <span>
                                            , 수학{' '}
                                            <strong style={{ color: mathGap >= 0 ? '#10b981' : '#ef4444' }}>
                                                {mathGap >= 0 ? `+${mathGap}점` : `${mathGap}점`}
                                            </strong>
                                        </span>
                                    )}
                                    {koreanGap !== null && (
                                        <span>
                                            , 국어{' '}
                                            <strong style={{ color: koreanGap >= 0 ? '#10b981' : '#ef4444' }}>
                                                {koreanGap >= 0 ? `+${koreanGap}점` : `${koreanGap}점`}
                                            </strong>
                                        </span>
                                    )}
                                    {scienceGap !== null && (
                                        <span>
                                            , 탐구{' '}
                                            <strong style={{ color: scienceGap >= 0 ? '#10b981' : '#ef4444' }}>
                                                {scienceGap >= 0 ? `+${scienceGap}점` : `${scienceGap}점`}
                                            </strong>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="stat-card">
                        <div className="stat-icon blue">📊</div>
                        <div>
                            <div className="stat-value">{studentData.gpaAvg}</div>
                            <div className="stat-label">학생 내신 평균</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">🎯</div>
                        <div>
                            <div className="stat-value">{latestBenchmark.gpaAvg}</div>
                            <div className="stat-label">합격 내신 평균</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow">📈</div>
                        <div>
                            <div className="stat-value">{gpaGap !== null ? (gpaGap > 0 ? `+${gpaGap.toFixed(1)}` : gpaGap.toFixed(1)) : '-'}</div>
                            <div className="stat-label">내신 격차</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red">📋</div>
                        <div>
                            <div className="stat-value">{filtered.length}</div>
                            <div className="stat-label">비교 데이터 수</div>
                        </div>
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>📭</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        선택한 대학/학과의 합격 데이터가 없습니다.<br />
                        아래 데이터 관리 패널에서 데이터를 추가해주세요.
                    </p>
                </div>
            )}

            {/* Charts */}
            {filtered.length > 0 && (
                <div className="grid-2" style={{ gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                    {/* GPA Comparison */}
                    <div className="card">
                        <div style={{ height: 380 }}>
                            <Bar data={gpaChartData} options={gpaChartOptions} />
                        </div>
                        {/* Zone Legend */}
                        <div style={{
                            display: 'flex', gap: 'var(--space-md)', justifyContent: 'center',
                            marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)',
                            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                        }}>
                            {[
                                { label: '합격 안정권', color: '#10b981' },
                                { label: '추가합격권', color: '#f59e0b' },
                                { label: '소신지원권', color: '#ef4444' },
                            ].map(z => (
                                <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: z.color }} />
                                    {z.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subject Score Comparison */}
                    <div className="card">
                        <div style={{ height: 380 }}>
                            <Bar data={subjectChartData} options={subjectChartOptions} />
                        </div>
                        {/* Annotation: Zone areas */}
                        <div style={{
                            marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)',
                            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                            fontSize: '0.78rem', color: 'var(--text-muted)',
                        }}>
                            💡 반투명 막대 = 합격자 평균 · 진한 막대 = 학생 성적
                        </div>
                    </div>
                </div>
            )}

            {/* GPA Trend */}
            {filtered.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ height: 280 }}>
                        <Bar data={gpaTrendData} options={gpaTrendOptions} />
                    </div>
                    {/* Student reference line */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                        marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)',
                        background: zone?.bg || 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${zone?.color || 'var(--primary-500)'}`,
                    }}>
                        <span style={{ fontSize: '0.85rem', color: zone?.color || 'var(--text-secondary)' }}>
                            📌 {student.name} 현재 내신: <strong>{studentData.gpaAvg}등급</strong>
                            {zone && <> — <strong>{zone.label}</strong></>}
                        </span>
                    </div>
                </div>
            )}

            {/* Data Management Panel */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">🗄️ 합격 데이터 관리</h3>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowDataPanel(!showDataPanel)}
                    >
                        {showDataPanel ? '✕ 닫기' : '➕ 데이터 추가'}
                    </button>
                </div>

                {showDataPanel && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        {/* Upload Area */}
                        <div
                            className="dropzone"
                            style={{ marginBottom: 'var(--space-lg)' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="dropzone-icon">📤</div>
                            <p className="dropzone-text">
                                CSV 파일을 <strong>클릭</strong>하여 업로드
                            </p>
                            <p className="dropzone-hint">
                                형식: 대학명,학과명,년도,내신평균,국어평균,수학평균,영어등급,탐구평균,전형
                            </p>
                            {uploading && (
                                <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
                                    <span className="spinner" /> 업로드 중...
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUpload(f);
                                    e.target.value = '';
                                }}
                            />
                        </div>

                        {/* Manual Input Form */}
                        <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>✏️ 수동 입력</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">대학명 *</label>
                                <input className="form-input" placeholder="예: 서울대학교" value={manualForm.university}
                                    onChange={(e) => setManualForm({ ...manualForm, university: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">학과명 *</label>
                                <input className="form-input" placeholder="예: 물리학과" value={manualForm.major}
                                    onChange={(e) => setManualForm({ ...manualForm, major: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">년도</label>
                                <input type="number" className="form-input" value={manualForm.year}
                                    onChange={(e) => setManualForm({ ...manualForm, year: Number(e.target.value) })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">내신 평균 *</label>
                                <input className="form-input" placeholder="예: 1.5" value={manualForm.gpaAvg}
                                    onChange={(e) => setManualForm({ ...manualForm, gpaAvg: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">국어 백분위</label>
                                <input className="form-input" placeholder="예: 94" value={manualForm.koreanAvg}
                                    onChange={(e) => setManualForm({ ...manualForm, koreanAvg: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">수학 백분위</label>
                                <input className="form-input" placeholder="예: 97" value={manualForm.mathAvg}
                                    onChange={(e) => setManualForm({ ...manualForm, mathAvg: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">영어 등급</label>
                                <input className="form-input" placeholder="예: 1" value={manualForm.englishGrade}
                                    onChange={(e) => setManualForm({ ...manualForm, englishGrade: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">탐구 백분위</label>
                                <input className="form-input" placeholder="예: 96" value={manualForm.scienceAvg}
                                    onChange={(e) => setManualForm({ ...manualForm, scienceAvg: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">전형</label>
                                <select className="form-select" value={manualForm.admissionType}
                                    onChange={(e) => setManualForm({ ...manualForm, admissionType: e.target.value as '수시' | '정시' })}>
                                    <option value="수시">수시</option>
                                    <option value="정시">정시</option>
                                </select>
                            </div>
                            <button className="btn btn-primary" onClick={handleManualSubmit}>
                                💾 데이터 저장
                            </button>
                        </div>
                    </div>
                )}

                {/* Existing Data Table */}
                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <h4 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>
                        📋 저장된 합격 데이터 ({selectedUniv} {selectedMajor})
                    </h4>
                    {filtered.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>년도</th>
                                        <th>전형</th>
                                        <th>내신 평균</th>
                                        <th>국어</th>
                                        <th>수학</th>
                                        <th>영어</th>
                                        <th>탐구</th>
                                        <th>작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((b) => (
                                        <tr key={b.id}>
                                            <td style={{ fontWeight: 600 }}>{b.year}년</td>
                                            <td><span className={`tag ${b.admissionType === '수시' ? 'tag-blue' : 'tag-green'}`}>{b.admissionType}</span></td>
                                            <td>{b.gpaAvg}등급</td>
                                            <td>{b.koreanAvg ?? '-'}</td>
                                            <td>{b.mathAvg ?? '-'}</td>
                                            <td>{b.englishGrade ? `${b.englishGrade}등급` : '-'}</td>
                                            <td>{b.scienceAvg ?? '-'}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBenchmark(b.id)}
                                                    style={{ color: 'var(--danger-400)' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            선택한 대학/학과의 합격 데이터가 없습니다.
                        </p>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="toast toast-success">{toast}</div>
            )}
        </div>
    );
}
