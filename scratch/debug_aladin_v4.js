async function debug() {
    const aladinUrl = 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=294938238';
    console.log('--- Step 1: Fetch Aladin ---');
    const res = await fetch(aladinUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    const isbnMatch = html.match(/isbn13["': ]+(\d{13})/i) || 
                     html.match(/ISBN-13[\s:]+<\/b>(\d{13})/i) ||
                     html.match(/"isbn13":"(\d{13})"/i);
    
    if (!isbnMatch) {
        console.log('FAILED: ISBN not found in Aladin HTML');
        return;
    }
    const isbn = isbnMatch[1];
    console.log('SUCCESS: Found ISBN-13:', isbn);

    console.log('--- Step 2: Search Yes24 by ISBN ---');
    const yes24SearchUrl = `https://www.yes24.com/Product/Search?domain=ALL&query=${isbn}`;
    const sRes = await fetch(yes24SearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const sText = await sRes.text();
    
    const goodsIdMatch = sText.match(/href="\/Product\/Goods\/(\d+)"/);
    if (!goodsIdMatch) {
        console.log('FAILED: Yes24 Search did not return a goods link');
        // Let's print a sample to see if it's a redirect or "no results"
        console.log('Sample Search Result:', sText.substring(0, 500));
        return;
    }
    const goodsId = goodsIdMatch[1];
    console.log('SUCCESS: Found Yes24 GoodsId:', goodsId);

    console.log('--- Step 3: Fetch Yes24 Product Page ---');
    const goodsUrl = `https://www.yes24.com/Product/Goods/${goodsId}`;
    const gRes = await fetch(goodsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const gText = await gRes.text();
    
    console.log('Yes24 Page Length:', gText.length);
    console.log('Contains "가속도"?', gText.includes('가속도'));
    console.log('Contains "목차"?', gText.includes('목차'));
    console.log('Contains "수열"?', gText.includes('수열'));
    
    if (!gText.includes('가속도')) {
        console.log('WARNING: Yes24 page fetched but TOC keywords not found');
        // Check for common Yes24 TOC container
        console.log('Contains "infos_box"?', gText.includes('infos_box'));
    }
}

debug();
