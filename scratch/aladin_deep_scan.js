async function aladinDeepScan(itemId) {
    console.log('--- Aladin Deep Scan Research for ID:', itemId, '---');
    const url = `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    
    console.log('HTML Length:', html.length);
    
    // Check for large JS variables or JSON-LD
    const jsVars = html.match(/var\s+\w+\s*=\s*['\"].*?['\"]/g) || [];
    console.log('Found JS Variables:', jsVars.length);
    
    const longVar = jsVars.find(v => v.length > 500);
    if (longVar) {
        console.log('Long Variable Found. Sample:', longVar.substring(0, 100));
    }

    const jsonLd = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (jsonLd) {
        console.log('JSON-LD Found. Keywords present?', jsonLd[1].includes('가속도') || jsonLd[1].includes('목차'));
    }

    // Check for noscript content
    const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/gi) || [];
    console.log('Noscript tags found:', noscript.length);
    for (const ns of noscript) {
        if (ns.includes('가속도') || ns.includes('목차')) {
            console.log('SUCCESS! TOC detected in <noscript> tag.');
            return;
        }
    }

    console.log('No direct TOC found in main HTML.');
}

aladinDeepScan('294938238');
