// Students API Route
import { NextRequest, NextResponse } from 'next/server';

// 데모 데이터 (프로덕션에서는 Firestore 사용)
const students = [
    { id: 'stu-001', name: '김민준', grade: 2, school: '서울과학고등학교', targetUniv: '서울대학교', targetMajor: '물리학과', consultantId: 'demo', createdAt: '2025-03-15', updatedAt: '2026-02-17' },
    { id: 'stu-002', name: '이서연', grade: 3, school: '대원외국어고등학교', targetUniv: '연세대학교', targetMajor: '국제학과', consultantId: 'demo', createdAt: '2025-06-01', updatedAt: '2026-02-16' },
    { id: 'stu-003', name: '박지호', grade: 1, school: '한영중학교 (예비고1)', targetUniv: '미정', targetMajor: '공학 계열', consultantId: 'demo', createdAt: '2026-01-10', updatedAt: '2026-02-15' },
    { id: 'stu-004', name: '최수아', grade: 3, school: '민족사관고등학교', targetUniv: 'KAIST', targetMajor: '전산학부', consultantId: 'demo', createdAt: '2024-09-20', updatedAt: '2026-02-14' },
];

export async function GET() {
    return NextResponse.json({ success: true, data: students });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, grade, school, targetUniv, targetMajor } = body;

        if (!name || !grade || !school) {
            return NextResponse.json(
                { success: false, error: '이름, 학년, 학교는 필수입니다.' },
                { status: 400 }
            );
        }

        const newStudent = {
            id: `stu-${Date.now()}`,
            name,
            grade,
            school,
            targetUniv: targetUniv || '',
            targetMajor: targetMajor || '',
            consultantId: 'demo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: newStudent }, { status: 201 });
    } catch {
        return NextResponse.json({ success: false, error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
