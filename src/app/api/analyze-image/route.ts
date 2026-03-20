import { NextRequest, NextResponse } from 'next/server';
import { analyzeGradeImage, analyzeTimetableImage } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const { image, type, mimeType } = await req.json();

        if (!image || !type || !mimeType) {
            return NextResponse.json({ success: false, error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        // 이미지 데이터는 이미 Base64 형태라고 가정 (프론트에서 처리)
        let result;
        if (type === 'grade') {
            result = await analyzeGradeImage(image, mimeType);
        } else if (type === 'timetable') {
            result = await analyzeTimetableImage(image, mimeType);
        } else {
            return NextResponse.json({ success: false, error: '잘못된 분석 유형입니다.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Image Analysis API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
