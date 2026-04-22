async function verifyAladinFetch(url) {
    console.log('Fetching main page:', url);
    const mainResponse = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    });
    const mainHtml = await mainResponse.text();
    console.log('Main page length:', mainHtml.length);

    const itemIdMatch = url.match(/ItemId=(\d+)/);
    if (!itemIdMatch) {
        console.log('ItemId NOT found');
        return;
    }
    const itemId = itemIdMatch[1];
    console.log('Extracted ItemId:', itemId);

    // Try TC=5 (Full TOC)
    const infoUrl = `https://www.aladin.co.kr/shop/wproduct_info.aspx?ItemId=${itemId}&TC=5`;
    console.log('Fetching info page:', infoUrl);
    
    // Aladin often requires specific headers for sub-pages
    const infoResponse = await fetch(infoUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': url,
            'Accept': '*/*',
        }
    });
    
    const infoHtml = await infoResponse.text();
    console.log('Info page length:', infoHtml.length);
    console.log('Contains TOC keywords?', /목차|차례|가속도|역학/.test(infoHtml));
    
    if (infoHtml.length < 1000) {
        console.log('Info page too short, likely error:', infoHtml);
    } else {
        console.log('Sample from Info page:', infoHtml.substring(0, 500).replace(/\s+/g, ' '));
    }
}

verifyAladinFetch('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=294938238');
