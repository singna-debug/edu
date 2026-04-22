async function finalResearch(itemId) {
    console.log('--- Final Aladin-Only Internal Research for ID:', itemId, '---');
    const scenarios = [
        { name: 'RSS Feed', url: `https://www.aladin.co.kr/rss/wproduct_info.aspx?ItemId=${itemId}` },
        { name: 'Simple AJAX', url: `https://www.aladin.co.kr/ucl/shop/wproduct/ajax/GetProductDescription.aspx?ItemId=${itemId}&TC=1` },
        { name: 'Book Content Link', url: `https://www.aladin.co.kr/shop/common/wBookContent.aspx?ItemId=${itemId}` }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\nTesting Scenario: ${scenario.name}`);
        try {
            const res = await fetch(scenario.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const buffer = await res.arrayBuffer();
            // Try both encodings
            const encodings = ['euc-kr', 'utf-8'];
            for (const enc of encodings) {
                const text = new TextDecoder(enc).decode(buffer);
                const hasKeywords = text.includes('목차') || text.includes('가속도') || text.includes('수열');
                if (hasKeywords) {
                    console.log(`- SUCCESS! Found TOC keywords with encoding: ${enc}`);
                    console.log(`- Content Length: ${text.length}`);
                    return; // Stop on first success
                }
            }
            console.log('- No keywords found in this scenario.');
        } catch (e) {
            console.log(`- Error: ${e.message}`);
        }
    }
}

finalResearch('294938238');
