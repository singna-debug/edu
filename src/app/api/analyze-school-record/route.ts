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
        
        // 1. Check if this is a single page Gemini OCR request
        if (body.pageBase64) {
            const pageBase64 = body.pageBase64 as string;
            const pageNum = body.pageNum as number;
            const pageCount = body.pageCount as number;
            
            console.log(`[SchoolRecord] Performing OCR for page ${pageNum}/${pageCount}`);
            try {
                const pageText = await parseSchoolRecordPDF(pageBase64, 'application/pdf');
                return NextResponse.json({ success: true, text: pageText });
            } catch (geminiError: any) {
                console.error(`[SchoolRecord] Gemini OCR failed for page ${pageNum}:`, geminiError);
                return NextResponse.json({ 
                    success: false, 
                    error: `Gemini OCR failed on page ${pageNum}: ${geminiError.message}` 
                }, { status: 500 });
            }
        }

        // 2. This is a full PDF fast-parse request
        const fileUrl = body.fileUrl as string;
        const studentId = body.studentId as string;
        const fileName = body.fileName as string;

        if (!fileUrl) {
            return NextResponse.json({ success: false, error: 'Missing fileUrl' }, { status: 400 });
        }

        console.log(`[SchoolRecord] Fetching PDF from storage for fast parsing: ${fileUrl}`);
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download PDF from storage: ${fileResponse.statusText}`);
        }
        
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('[SchoolRecord] Initiating local fast-text extraction using legacy pdf-parse...');
        
        const pdf = require('pdf-parse');
        const parsedData = await pdf(buffer);
        const extractedText = parsedData.text.trim();

        // If the PDF has high quality selectable text (contains actual words)
        if (extractedText.length > 200) {
            console.log(`[SchoolRecord] Fast-parse successful! Extracted length: ${extractedText.length}`);
            return NextResponse.json({
                success: true,
                isFastParsed: true,
                parsedText: extractedText
            });
        }

        // Otherwise, this is a scanned/image PDF, fallback to client-side page-by-page visual OCR
        console.log('[SchoolRecord] Fast-parse found insufficient text. PDF appears to be a scanned image.');
        return NextResponse.json({
            success: true,
            isFastParsed: false
        });

    } catch (error: any) {
        console.error('Analyze School Record Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
