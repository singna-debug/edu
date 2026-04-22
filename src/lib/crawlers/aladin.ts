import { SiteCrawler, CrawlResult, COMMON_HEADERS } from './types';

export class AladinCrawler implements SiteCrawler {
    supports(url: string): boolean {
        return url.includes('aladin.co.kr');
    }

    async crawl(url: string): Promise<CrawlResult> {
        try {
            const itemIdMatch = url.match(/ItemId=(\d+)/i);
            const itemId = itemIdMatch ? itemIdMatch[1] : null;
            
            if (!itemId) {
                return { subjectName: '', publisher: '', tableOfContents: '', success: false, error: '알라딘 상품 ID를 찾을 수 없습니다.' };
            }

            // 1. 메인 페이지 (메타데이터용)
            // 2. 인쇄용 페이지 (목차 정밀 추출용 - 자바스크립트 차단 우회)
            const mainUrl = url;
            const printUrl = `https://www.aladin.co.kr/shop/wproduct_print.aspx?ItemId=${itemId}`;

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Referer': mainUrl
            };

            const [mainRes, printRes] = await Promise.all([
                fetch(mainUrl, { headers }),
                fetch(printUrl, { headers })
            ]);

            const mainHtml = await mainRes.text();
            
            // 인쇄용 페이지 특성상 EUC-KR인 경우가 많으므로 안전하게 디코딩
            const printBuffer = await printRes.arrayBuffer();
            const eucDecoder = new TextDecoder('euc-kr');
            const printHtml = eucDecoder.decode(printBuffer);

            // 데이터를 합쳐서 반환
            const combinedContent = `
--- ALADIN MAIN METADATA ---
${mainHtml}

--- ALADIN PRINT VERSION (TOC SOURCE) ---
${printHtml}
            `.trim();

            return {
                subjectName: '', 
                publisher: '', 
                tableOfContents: '', 
                rawContent: combinedContent,
                success: true
            };
        } catch (error: any) {
            console.error('[AladinCrawler] Error:', error);
            return { subjectName: '', publisher: '', tableOfContents: '', success: false, error: error.message };
        }
    }
}
