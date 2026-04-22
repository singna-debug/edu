async function aladinOnlyResearch(itemId) {
    console.log('--- Definitive Aladin-Only Internal Research for ID:', itemId, '---');
    const scenarios = [
        { name: 'RSS Feed', url: `https://www.aladin.co.kr/rss/wproduct_info.aspx?ItemId=${itemId}` },
        { name: 'Mobile Preview', url: `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescription.aspx?ItemId=${itemId}&TC=1` },
        { name: 'Summary API', url: `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescription.aspx?ItemId=${itemId}&TC=0` }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\nTesting [${scenario.name}]: ${scenario.url}`);
        const res = await fetch(scenario.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
            const buffer = await res.arrayBuffer();
            // Try both encodings
            const encodings = ['euc-kr', 'utf-8'];
            for (const enc of encodings) {
                const text = new TextDecoder(enc).decode(buffer);
                const hasKeywords = text.includes('목차') || text.includes('가속도') || text.includes('수열');
                if (hasKeywords) {
                    console.log(`- SUCCESS! Found TOC keywords with encoding: ${enc}`);
                    console.log(`- Content Length: ${text.length}`);
                    return; // Stop on first success found
                }
            }
            console.log('- No keywords found in this response.');
        } else {
            console.log(`- Result: FAILED (Status: ${res.status})`);
        }
    }
}

aladinOnlyResearch('294938238');
