const fs = require('fs');

async function debugAladin() {
    const id = '294938238';
    const mainUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}`;
    // This is the common endpoint for TOC
    const ajaxUrl = `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescriptionFull.aspx?ItemId=${id}&CommunityType=MyReview`;
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    };

    console.log('Fetching main page to get cookies...');
    const mainRes = await fetch(mainUrl, { headers });
    const setCookies = mainRes.headers.getSetCookie();
    const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');
    console.log('Cookies:', cookieHeader);

    console.log('Fetching AJAX description...');
    const ajaxRes = await fetch(ajaxUrl, {
        headers: {
            ...headers,
            'Cookie': cookieHeader,
            'Referer': mainUrl,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    const buffer = await ajaxRes.arrayBuffer();
    // Aladin AJAX fragments are almost always EUC-KR
    const text = new TextDecoder('euc-kr').decode(buffer);
    
    fs.writeFileSync('aladin_ajax_debug.html', text);
    console.log('Response saved to aladin_ajax_debug.html');
    console.log('Length:', text.length);
    console.log('Contains "목차"?', text.includes('목차'));
    console.log('Contains "가속도"?', text.includes('가속도'));
    
    if (text.length < 2000) {
        console.log('Short response. Likely error page.');
    } else if (text.includes('가속도')) {
        console.log('SUCCESS: TOC FOUND!');
    } else {
        console.log('Large response but no keywords. Checking for "Loading" skeleton...');
        if (text.includes('Loading') || text.includes('spinner')) {
            console.log('Matched "Loading" or "spinner". This is a skeleton page.');
        }
    }
}

debugAladin();
