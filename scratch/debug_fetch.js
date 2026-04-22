async function testFetch() {
    const mobileUrl = 'https://www.aladin.co.kr/m/mproduct.aspx?ItemId=294938238';
    try {
        const response = await fetch(mobileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
            }
        });
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Length:', text.length);
        console.log('Includes "목차"?', text.includes('목차'));
        console.log('Includes "가속도"?', text.includes('가속도'));
        console.log('Sample:', text.substring(0, 1000));
    } catch (err) {
        console.error('Error:', err);
    }
}
testFetch();
