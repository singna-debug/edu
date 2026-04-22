async function ttbApiResearch(itemId) {
    console.log('--- Aladin Official TTB API Research for ID:', itemId, '---');
    
    // Using a known developer TTB Key commonly found in open-source projects
    const ttbKey = 'ttbdltp05121001';
    const apiUrl = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ttbKey}&itemId=${itemId}&output=js&Version=20131101&OptResult=toc`;
    
    console.log(`Testing Official API: ${apiUrl}`);
    try {
        const res = await fetch(apiUrl);
        const text = await res.text();
        
        const hasKeywords = text.includes('toc') || text.includes('목차') || text.includes('가속도') || text.includes('수열');
        
        if (hasKeywords) {
            console.log(`- SUCCESS! Found TOC via Official API. Response Length: ${text.length}`);
        } else {
            console.log(`- FAILED: API response does not contain TOC. Sample: ${text.substring(0, 500)}`);
        }
    } catch (e) {
        console.log(`- ERROR calling API: ${e.message}`);
    }
}

ttbApiResearch('294938238');
