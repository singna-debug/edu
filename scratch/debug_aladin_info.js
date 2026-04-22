async function testInfoFetch() {
    const itemId = '294938238';
    const mainUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`;
    const infoUrl = `https://www.aladin.co.kr/shop/wproduct_info.aspx?ItemId=${itemId}&TC=1`;
    
    try {
        const response = await fetch(infoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': mainUrl
            }
        });
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Length:', text.length);
        console.log('Includes "가속도"?', text.includes('가속도'));
        console.log('Sample:', text.substring(0, 1000));
    } catch (err) {
        console.error('Error:', err);
    }
}
testInfoFetch();
