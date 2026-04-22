async function testEndpoints(itemId) {
    const endpoints = [
        {
            name: 'AJAX Description Full',
            url: `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescriptionFull.aspx?ItemId=${itemId}&CommunityType=MyReview`,
            encoding: 'euc-kr'
        },
        {
            name: 'Print Version',
            url: `https://www.aladin.co.kr/shop/wproduct_print.aspx?ItemId=${itemId}`,
            encoding: 'euc-kr'
        },
        {
            name: 'TOC Fragment',
            url: `https://www.aladin.co.kr/shop/common/wBookContent.aspx?ItemId=${itemId}`,
            encoding: 'euc-kr'
        }
    ];

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Referer': `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`
    };

    console.log(`--- Aladin Research for Item: ${itemId} ---`);

    for (const ep of endpoints) {
        console.log(`\nTesting ${ep.name}: ${ep.url}`);
        try {
            const res = await fetch(ep.url, { headers });
            const buffer = await res.arrayBuffer();
            const text = new TextDecoder(ep.encoding).decode(buffer);
            
            console.log(`- Status: ${res.status}`);
            console.log(`- Length: ${text.length}`);
            
            const keywords = ['목차', '차례', '가속도', '수열', '데이터'];
            const found = keywords.filter(k => text.includes(k));
            
            if (found.length > 0) {
                console.log(`- SUCCESS! Found keywords: ${found.join(', ')}`);
                // Save sample to verify
                console.log(`- Snippet: ${text.substring(text.indexOf(found[0]), text.indexOf(found[0]) + 500).replace(/\s+/g, ' ')}`);
            } else {
                console.log('- FAILED: Keywords not found.');
                if (text.length < 2000) {
                    console.log(`- Response: ${text.trim()}`);
                }
            }
        } catch (e) {
            console.log(`- Error: ${e.message}`);
        }
    }
}

testEndpoints('294938238');
