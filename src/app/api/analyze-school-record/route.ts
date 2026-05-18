import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import fs from 'fs';
import path from 'path';
import { parseSchoolRecordPDF } from '@/lib/gemini';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const studentId = formData.get('studentId') as string;

        if (!file || !studentId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ success: false, error: 'PDF 파일만 업로드할 수 있습니다.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        console.log(`[SchoolRecord] Performing parallelized visual Gemini OCR on PDF: ${file.name}`);
        
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

        // 2. Save PDF to local public folder (0 cost, unlimited file sizes!)
        console.log(`[SchoolRecord] Saving PDF to public directory...`);
        const publicDir = path.join(process.cwd(), 'public');
        const uploadDir = path.join(publicDir, 'uploads', 'school_records', studentId);
        
        // Ensure parent directories exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        // Remove special characters from filename to prevent path injection / encoding issues
        const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
        const savedFileName = `${timestamp}_${safeFileName}`;
        const filePath = path.join(uploadDir, savedFileName);
        
        // Save binary file locally
        fs.writeFileSync(filePath, buffer);
        
        // Public served URL path
        const fileUrl = `/uploads/school_records/${studentId}/${savedFileName}`;
        console.log(`[SchoolRecord] PDF stored locally at: ${filePath} -> Served at: ${fileUrl}`);

        return NextResponse.json({
            success: true,
            data: {
                fileName: file.name,
                fileUrl,
                parsedText,
            }
        });

    } catch (error: any) {
        console.error('Analyze School Record Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
