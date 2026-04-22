async function verifyAladinMobileInfo(itemId) {
    const mobileDetailUrl = `https://www.aladin.co.kr/m/mproduct_info.aspx?ItemID=${itemId}`;
    console.log('Testing Aladin Internal Mobile Details:', mobileDetailUrl);
    
    const headers = { 
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        'Referer': `https://www.aladin.co.kr/m/mproduct.aspx?ItemId=${itemId}`
    };

    const res = await fetch(mobileDetailUrl, { headers });
    if (!res.ok) {
        console.log('Fetch failed with status:', res.status);
        return;
    }

    const buffer = await res.arrayBuffer();
    // 모바일 상세 정보는 보통 UTF-8임
    const text = new TextDecoder('utf-8').decode(buffer);
    
    console.log('Content Length:', text.length);
    console.log('Includes "목차"?', text.includes('목차'));
    console.log('Includes "가속도"?', text.includes('가속도'));
    console.log('Includes "수열"?', text.includes('수열'));
    
    if (text.includes('가속도')) {
        console.log('SUCCESS! Found TOC on Aladin Mobile Info Page.');
    } else {
        console.log('Sample Content (first 1000 chars):');
        console.log(text.substring(0, 1000).replace(/\s+/g, ' '));
    }
}

verifyAladinMobileInfo('294938238');
