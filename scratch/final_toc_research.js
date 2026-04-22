async function finalResearch() {
    const aladinUrl = 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=294938238';
    console.log('--- Step 1: Fetch Aladin ---');
    const res = await fetch(aladinUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    // Aladin HTML에서 ISBN 찾기 (여러 패턴 시도)
    const isbnMatch = html.match(/isbn13["': ]+(\d{13})/i) || 
                     html.match(/ISBN-13[\s:]+<\/b>(\d{13})/i) ||
                     html.match(/"isbn13":"(\d{13})"/i) ||
                     html.match(/itemid=(\d{13})/i) ||
                     html.match(/>(\d{13})</); // 마지막 수단
    
    if (!isbnMatch) {
       console.log('FAILED: ISBN not found even with diverse patterns');
       // Print fragment of Aladin HTML around bottom to see where it might be
       console.log('Aladin HTML Tail:', html.substring(html.length - 2000));
       return;
    }
    const isbn = isbnMatch[1] || isbnMatch[0];
    console.log('SUCCESS: ISBN found:', isbn);

    // 2. YES24에서 ISBN으로 찾아보기
    console.log('--- Step 2: Fetch Yes24 by ISBN ---');
    const yes24SearchUrl = `https://www.yes24.com/Product/Search?domain=ALL&query=${isbn}`;
    const sRes = await fetch(yes24SearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const sText = await sRes.text();
    
    const goodsIdMatch = sText.match(/href="\/Product\/Goods\/(\d+)"/);
    if (goodsIdMatch) {
        console.log('YES24 Goods Found. Fetching TOC...');
        const gRes = await fetch(`https://www.yes24.com/Product/Goods/${goodsIdMatch[1]}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const gHTML = await gRes.text();
        console.log('YES24 Content includes "가속도"?', gHTML.includes('가속도'));
        console.log('YES24 Content includes "목차"?', gHTML.includes('목차'));
    } else {
        console.log('YES24 Search failed to find book.');
    }
}

finalResearch();
