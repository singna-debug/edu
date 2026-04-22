import { SiteCrawler, CrawlResult, COMMON_HEADERS } from './types';
import { AladinCrawler } from './aladin';

export class GenericCrawler implements SiteCrawler {
    supports(_url: string): boolean {
        return true; // Fallback
    }

    async crawl(url: string): Promise<CrawlResult> {
        try {
            const response = await fetch(url, { headers: COMMON_HEADERS });
            if (!response.ok) {
                return { subjectName: '', publisher: '', tableOfContents: '', success: false, error: `HTTP ${response.status}` };
            }
            const html = await response.text();
            return {
                subjectName: '',
                publisher: '',
                tableOfContents: '',
                rawContent: html,
                success: true
            };
        } catch (error: any) {
            return { subjectName: '', publisher: '', tableOfContents: '', success: false, error: error.message };
        }
    }
}

export class CrawlerRegistry {
    private static instance: CrawlerRegistry;
    private crawlers: SiteCrawler[] = [];
    private fallback = new GenericCrawler();

    private constructor() {
        this.crawlers.push(new AladinCrawler());
        // Add more crawlers here (e.g., EbsCrawler)
    }

    public static getInstance(): CrawlerRegistry {
        if (!CrawlerRegistry.instance) {
            CrawlerRegistry.instance = new CrawlerRegistry();
        }
        return CrawlerRegistry.instance;
    }

    public async crawl(url: string): Promise<CrawlResult> {
        const crawler = this.crawlers.find(c => c.supports(url)) || this.fallback;
        return crawler.crawl(url);
    }
}
