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

        console.log(`[SchoolRecord] Performing high-performance concurrency-controlled Gemini OCR on PDF: ${fileName}`);
        
        let parsedText = '';
        try {
            console.log(`[SchoolRecord] Loading PDF for page splitting...`);
            const pdfDoc = await PDFDocument.load(buffer);
            const pageCount = pdfDoc.getPageCount();
            console.log(`[SchoolRecord] PDF loaded. Total pages: ${pageCount}`);

            console.log(`[SchoolRecord] Initiating controlled parallel OCR with Concurrency Pool of 3...`);
            
            const concurrency = 3;
            let currentIdx = 0;
            const results = new Array<string>(pageCount);

            const workers = Array.from({ length: concurrency }, async () => {
                while (currentIdx < pageCount) {
                    const taskIdx = currentIdx++;
                    console.log(`[SchoolRecord] [Worker] Processing page ${taskIdx + 1}/${pageCount}...`);
                    
                    try {
                        const newDoc = await PDFDocument.create();
                        const [copiedPage] = await newDoc.copyPages(pdfDoc, [taskIdx]);
                        newDoc.addPage(copiedPage);
                        const singlePageBuffer = await newDoc.save();
                        const singlePageBase64 = Buffer.from(singlePageBuffer).toString('base64');
                        
                        const pageText = await parseSchoolRecordPDF(singlePageBase64, 'application/pdf');
                        results[taskIdx] = pageText;
                        console.log(`[SchoolRecord] [Worker] Page ${taskIdx + 1}/${pageCount} completed!`);
                    } catch (pageError) {
                        console.error(`[SchoolRecord] [Worker] Error on page ${taskIdx + 1}:`, pageError);
                        throw pageError;
                    }
                }
            });

            // Wait for all workers to finish their tasks
            await Promise.all(workers);

            parsedText = results.join('\n\n');
            console.log(`[SchoolRecord] Concurrency-controlled Gemini OCR completed! Extracted Length: ${parsedText.length}`);
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
