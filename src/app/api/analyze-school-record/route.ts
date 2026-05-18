import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { parseSchoolRecordPDF } from '@/lib/gemini';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const fileUrl = body.fileUrl as string;
        const studentId = body.studentId as string;
        const fileName = body.fileName as string;

        if (!fileUrl || !studentId || !fileName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[SchoolRecord] Fetching PDF from Firebase Storage URL: ${fileUrl}`);
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download PDF from storage: ${fileResponse.statusText}`);
        }
        
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[SchoolRecord] Performing parallelized visual Gemini OCR on PDF: ${fileName}`);
        
        let parsedText = '';
        try {
            console.log(`[SchoolRecord] Loading PDF for page splitting...`);
            const pdfDoc = await PDFDocument.load(buffer);
            const pageCount = pdfDoc.getPageCount();
            console.log(`[SchoolRecord] PDF loaded. Total pages: ${pageCount}`);

            console.log(`[SchoolRecord] Initiating direct 100% concurrent scanning for all ${pageCount} pages...`);
            const pagePromises = Array.from({ length: pageCount }, (_, idx) => {
                return (async (pageNum: number) => {
                    const newDoc = await PDFDocument.create();
                    const [copiedPage] = await newDoc.copyPages(pdfDoc, [pageNum]);
                    newDoc.addPage(copiedPage);
                    const singlePageBuffer = await newDoc.save();
                    const singlePageBase64 = Buffer.from(singlePageBuffer).toString('base64');
                    
                    const pageText = await parseSchoolRecordPDF(singlePageBase64, 'application/pdf');
                    return { pageNum: pageNum + 1, text: pageText };
                })(idx);
            });

            const results = await Promise.all(pagePromises);

            // Sort by page number to guarantee correct chronological page order
            results.sort((a, b) => a.pageNum - b.pageNum);
            parsedText = results.map(r => r.text).join('\n\n');
            console.log(`[SchoolRecord] Parallel Gemini OCR completed! Extracted Length: ${parsedText.length}`);
        } catch (geminiError: any) {
            console.error('[SchoolRecord] Parallel Gemini OCR failed:', geminiError);
            throw new Error(`생활기록부 AI 분석 중 오류가 발생했습니다: ${geminiError.message}`);
        }

        return NextResponse.json({
            success: true,
            data: {
                fileName,
                fileUrl, // Echo back the Firebase URL!
                parsedText,
            }
        });

    } catch (error: any) {
        console.error('Analyze School Record Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
