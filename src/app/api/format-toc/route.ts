import { NextRequest, NextResponse } from 'next/server';
import { formatTocWithAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const { rawText } = await req.json();

        if (!rawText) {
            return NextResponse.json({ success: false, error: '변환할 텍스트가 없습니다.' }, { status: 400 });
        }

        const result = await formatTocWithAI(rawText);
        
        return NextResponse.json({ 
            success: true, 
            data: {
                formattedToc: result.formattedToc
            } 
        });
    } catch (error: any) {
        console.error('[API Format TOC] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || '목차 변환 중 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}
