// Admission Benchmark API Route
import { NextRequest, NextResponse } from 'next/server';
import type { AdmissionBenchmark } from '@/lib/types';

// 데모 합격 데이터
const demoBenchmarks: AdmissionBenchmark[] = [
    // 서울대 물리학과
    { id: 'ab-001', university: '서울대학교', major: '물리학과', year: 2024, gpaAvg: 1.3, koreanAvg: 94, mathAvg: 97, englishGrade: 1, scienceAvg: 96, admissionType: '수시', createdAt: '2024-03-01' },
    { id: 'ab-002', university: '서울대학교', major: '물리학과', year: 2025, gpaAvg: 1.2, koreanAvg: 95, mathAvg: 98, englishGrade: 1, scienceAvg: 97, admissionType: '수시', createdAt: '2025-03-01' },
    { id: 'ab-003', university: '서울대학교', major: '물리학과', year: 2026, gpaAvg: 1.4, koreanAvg: 93, mathAvg: 96, englishGrade: 1, scienceAvg: 95, admissionType: '수시', createdAt: '2026-01-15' },
    // 서울대 물리학과 정시
    { id: 'ab-004', university: '서울대학교', major: '물리학과', year: 2024, gpaAvg: 1.8, koreanAvg: 96, mathAvg: 98, englishGrade: 1, scienceAvg: 97, admissionType: '정시', createdAt: '2024-03-01' },
    { id: 'ab-005', university: '서울대학교', major: '물리학과', year: 2025, gpaAvg: 1.7, koreanAvg: 97, mathAvg: 99, englishGrade: 1, scienceAvg: 98, admissionType: '정시', createdAt: '2025-03-01' },
    { id: 'ab-006', university: '서울대학교', major: '물리학과', year: 2026, gpaAvg: 1.6, koreanAvg: 95, mathAvg: 97, englishGrade: 1, scienceAvg: 96, admissionType: '정시', createdAt: '2026-01-15' },
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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const university = searchParams.get('university');
    const major = searchParams.get('major');

    let filtered = [...demoBenchmarks];
    if (university) filtered = filtered.filter(b => b.university === university);
    if (major) filtered = filtered.filter(b => b.major === major);

    return NextResponse.json({ success: true, data: filtered });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { university, major, year, gpaAvg, koreanAvg, mathAvg, englishGrade, scienceAvg, admissionType } = body;

        if (!university || !major || !year || gpaAvg === undefined) {
            return NextResponse.json(
                { success: false, error: '대학명, 학과명, 년도, 내신 평균은 필수입니다.' },
                { status: 400 }
            );
        }

        const newBenchmark: AdmissionBenchmark = {
            id: `ab-${Date.now()}`,
            university,
            major,
            year,
            gpaAvg,
            koreanAvg,
            mathAvg,
            englishGrade,
            scienceAvg,
            admissionType: admissionType || '수시',
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: newBenchmark }, { status: 201 });
    } catch {
        return NextResponse.json({ success: false, error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
