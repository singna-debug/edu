export interface CrawlResult {
    subjectName: string;
    publisher: string;
    tableOfContents: string;
    rawContent?: string;
    success: boolean;
    error?: string;
}

export interface SiteCrawler {
    supports(url: string): boolean;
    crawl(url: string): Promise<CrawlResult>;
}

export const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};
