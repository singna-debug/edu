async function test() {
    const id = '294938238';
    const mainUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}`;
    const ajaxUrl = `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescriptionFull.aspx?ItemId=${id}&CommunityType=MyReview`;
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };

    console.log('--- Step 1: Visiting Main Page to get Cookies ---');
    const mainRes = await fetch(mainUrl, { headers });
    // IMPORTANT: Use getSetCookie() to handle multiple cookies
    const setCookies = mainRes.headers.getSetCookie();
    const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');
    console.log('Cookies Secured:', cookieHeader.substring(0, 50) + '...');

    console.log('--- Step 2: Fetching AJAX TOC with secured session ---');
    const ajaxRes = await fetch(ajaxUrl, {
        headers: {
            ...headers,
            'Cookie': cookieHeader,
            'Referer': mainUrl,
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    const buffer = await ajaxRes.arrayBuffer();
    // AJAX fragments are often EUC-KR
    const text = new TextDecoder('euc-kr').decode(buffer);
    
    console.log('AJAX Length:', text.length);
    console.log('Includes "목차"?', text.includes('목차'));
    console.log('Includes "수열"?', text.includes('수열'));
    
    if (text.length > 5000 && text.includes('수열')) {
        console.log('SUCCESS: THE MODETOUR SEQUENTIAL METHOD WORKS!');
    } else {
        console.log('FAILED: Still getting skeleton or empty response.');
        if (text.length < 5000) console.log('Sample:', text);
    }
}

test();
