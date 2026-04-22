async function verifyAladinPrint(itemId) {
    const printUrl = `https://www.aladin.co.kr/shop/wproduct_print.aspx?ItemId=${itemId}`;
    console.log('Testing Aladin Internal Print Path:', printUrl);
    
    const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' 
    };

    const res = await fetch(printUrl, { headers });
    if (!res.ok) {
        console.log('Fetch failed with status:', res.status);
        return;
    }

    const buffer = await res.arrayBuffer();
    // 알라딘 인쇄용 페이지는 보통 EUC-KR임
    const text = new TextDecoder('euc-kr').decode(buffer);
    
    console.log('Content Length:', text.length);
    console.log('Includes "목차"?', text.includes('목차'));
    console.log('Includes "차례"?', text.includes('차례'));
    console.log('Includes "가속도"?', text.includes('가속도'));
    console.log('Includes "수열"?', text.includes('수열'));
    
    console.log('Sample Content (first 1000 chars):');
    console.log(text.substring(0, 1000).replace(/\s+/g, ' '));
}

verifyAladinPrint('294938238');
