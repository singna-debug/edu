async function aladinAdvancedResearch(itemId) {
    console.log('--- Aladin Internal Deep Research for ID:', itemId, '---');
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    };

    // 1. Get Session Cookies from Main Page
    const mainUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`;
    const mainRes = await fetch(mainUrl, { headers });
    const setCookie = mainRes.headers.get('set-cookie') || '';
    const cookies = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
    
    const targetHeaders = {
        ...headers,
        'Cookie': cookies,
        'Referer': mainUrl,
        'X-Requested-With': 'XMLHttpRequest'
    };

    // 2. Test Internal Endpoints
    const endpoints = [
        `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescriptionFull.aspx?ItemId=${itemId}&CommunityType=MyReview`,
        `https://www.aladin.co.kr/shop/common/wBookContent.aspx?ItemId=${itemId}`,
        `https://www.aladin.co.kr/shop/wproduct_info.aspx?ItemID=${itemId}&TC=5`
    ];

    for (const url of endpoints) {
        console.log(`\nTesting Endpoint: ${url}`);
        try {
            const res = await fetch(url, { headers: targetHeaders });
            if (!res.ok) {
                console.log(`- Status: FAILED (${res.status})`);
                continue;
            }
            
            const buffer = await res.arrayBuffer();
            // Try both EUC-KR and UTF-8
            const encodings = ['euc-kr', 'utf-8'];
            for (const enc of encodings) {
                const text = new TextDecoder(enc).decode(buffer);
                const hasKeywords = text.includes('목차') || text.includes('가속도') || text.includes('수열');
                if (hasKeywords) {
                    console.log(`- Success with Encoding: ${enc}`);
                    console.log(`- Found TOC Keywords! Length: ${text.length}`);
                    return; // Stop on first success
                }
            }
            console.log('- No keywords found in this endpoint.');
        } catch (e) {
            console.log(`- Error: ${e.message}`);
        }
    }
}

aladinAdvancedResearch('294938238');
