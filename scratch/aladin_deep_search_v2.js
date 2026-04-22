const fs = require('fs');

async function deepSearchAladin(itemId) {
    const scenarios = [
        {
            name: 'AJAX Full (MyReview)',
            url: `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescriptionFull.aspx?ItemId=${itemId}&CommunityType=MyReview`
        },
        {
            name: 'Table of Contents Direct',
            url: `https://www.aladin.co.kr/shop/common/wBookContent.aspx?ItemId=${itemId}`
        },
        {
            name: 'Mobile AJAX TOC',
            url: `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescription.aspx?ItemId=${itemId}&TC=5`
        }
    ];

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Referer': `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`,
        'X-Requested-With': 'XMLHttpRequest'
    };

    console.log(`--- Deep Searching Aladin for ID: ${itemId} ---`);

    for (const sc of scenarios) {
        console.log(`\nTesting ${sc.name}...`);
        try {
            // First visit main page to get a session
            const mainRes = await fetch(`https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`, { headers });
            const cookies = mainRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
            
            const res = await fetch(sc.url, { 
                headers: { ...headers, 'Cookie': cookies } 
            });
            const buffer = await res.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);
            
            console.log(`- Length: ${text.length}`);
            const keywords = ['목차', '차례', '가속도', '미분', '적분'];
            const found = keywords.filter(k => text.includes(k));
            
            if (found.length > 0) {
                console.log(`- SUCCESS! Found: ${found.join(', ')}`);
                fs.writeFileSync(`aladin_found_${sc.name.replace(/\s+/g, '_')}.html`, text);
                return;
            } else {
                console.log('- Not found.');
            }
        } catch (e) {
            console.log(`- Error: ${e.message}`);
        }
    }
}

deepSearchAladin('294938238');
