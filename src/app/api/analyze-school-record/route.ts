import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { parseSchoolRecordPDF } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const pageBase64 = body.pageBase64 as string;
        const pageNum = body.pageNum as number;
        const pageCount = body.pageCount as number;

        if (!pageBase64) {
            return NextResponse.json({ success: false, error: 'Missing pageBase64' }, { status: 400 });
        }

        console.log(`[SchoolRecord] Performing ultra-fast single page OCR: ${pageNum}/${pageCount}`);
        
        try {
            const pageText = await parseSchoolRecordPDF(pageBase64, 'application/pdf');
            return NextResponse.json({
                success: true,
                text: pageText
            });
        } catch (geminiError: any) {
            console.error(`[SchoolRecord] Gemini OCR failed for page ${pageNum}:`, geminiError);
            return NextResponse.json({ 
                success: false, 
                error: `Gemini OCR failed on page ${pageNum}: ${geminiError.message}` 
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Analyze School Record Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
