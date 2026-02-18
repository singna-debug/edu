// Admission Benchmark Upload API Route
import { NextRequest, NextResponse } from 'next/server';
import type { AdmissionBenchmark } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: '파일이 필요합니다.' },
                { status: 400 }
            );
        }

        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());

        if (lines.length < 2) {
            return NextResponse.json(
                { success: false, error: '파일에 데이터가 부족합니다. 헤더와 최소 1행의 데이터가 필요합니다.' },
                { status: 400 }
            );
        }

        // 헤더 스킵, 데이터 파싱
        // 예상 형식: 대학명,학과명,년도,내신평균,국어평균,수학평균,영어등급,탐구평균,전형
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

        if (parsed.length === 0) {
            return NextResponse.json(
                { success: false, error: '파싱 가능한 데이터가 없습니다. CSV 형식을 확인하세요.' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: parsed,
            message: `${parsed.length}건의 합격 데이터가 파싱되었습니다.`,
        });
    } catch {
        return NextResponse.json(
            { success: false, error: '파일 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
