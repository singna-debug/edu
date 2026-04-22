async function researchISBN(isbn) {
    console.log('Researching ISBN:', isbn);
    // 1. Search Yes24
    const searchUrl = `https://www.yes24.com/Product/Search?domain=ALL&query=${isbn}`;
    const searchRes = await fetch(searchUrl);
    const searchText = await searchRes.text();
    
    const goodsIdMatch = searchText.match(/href="\/Product\/Goods\/(\d+)"/);
    if (goodsIdMatch) {
        const goodsId = goodsIdMatch[1];
        console.log('Yes24 GoodsId:', goodsId);
        const goodsUrl = `https://www.yes24.com/Product/Goods/${goodsId}`;
        const goodsRes = await fetch(goodsUrl);
        const goodsText = await goodsRes.text();
        console.log('Yes24 Goods Page Len:', goodsText.length);
        console.log('Includes "목차"?', goodsText.includes('목차'));
        console.log('Includes "차례"?', goodsText.includes('차례'));
        console.log('Includes "가속도"?', goodsText.includes('가속도'));
    } else {
        console.log('Yes24 GoodsId not found');
    }
}

researchISBN('9791165219550');
