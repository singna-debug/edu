import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebResource } from '@/lib/gemini';

import { CrawlerRegistry } from '@/lib/crawlers/registry';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ success: false, error: 'URL을 입력해주세요.' }, { status: 400 });
        }

        // 1. Precise Crawling using modular registry (API-First logic)
        const crawler = CrawlerRegistry.getInstance();
        const crawlResult = await crawler.crawl(url);

        if (!crawlResult.success) {
            return NextResponse.json({ success: false, error: crawlResult.error || '데이터를 가져오지 못했습니다.' }, { status: 500 });
        }

        // 2. Use Gemini to analyze the structured/raw content
        // If the crawler already extracted structured data, we could skip Gemini, 
        // but for now, we merge and let Gemini refine the result.
        const result = await analyzeWebResource(crawlResult.rawContent || '');

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('URL Analysis API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
