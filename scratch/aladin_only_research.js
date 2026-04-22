async function aladinOnlyResearch(itemId) {
    console.log('--- Aladin-Only Research for ID:', itemId, '---');
    const sources = [
        `https://www.aladin.co.kr/shop/wproduct_print.aspx?ItemId=${itemId}`,
        `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescriptionFull.aspx?ItemId=${itemId}&CommunityType=MyReview`,
        `https://www.aladin.co.kr/m/mproduct_info.aspx?ItemID=${itemId}`
    ];
    
    for (const url of sources) {
        console.log(`Testing: ${url}`);
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
            const buffer = await res.arrayBuffer();
            const eucText = new TextDecoder('euc-kr').decode(buffer);
            const utfText = new TextDecoder('utf-8').decode(buffer);
            
            const hasToc = eucText.includes('목차') || utfText.includes('목차') ||
                           eucText.includes('가속도') || utfText.includes('가속도');
                           
            console.log(`- Result: OK, Length: ${eucText.length}, TOC found: ${hasToc}`);
        } else {
            console.log(`- Result: FAILED (Status: ${res.status})`);
        }
    }
}

aladinOnlyResearch('294938238');
