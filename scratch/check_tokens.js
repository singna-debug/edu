
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkConsultantTokens() {
    console.log('--- Consultant Token Check ---');
    const snapshot = await db.collection('consultants').get();
    
    if (snapshot.empty) {
        console.log('No consultants found.');
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        const hasAcc = !!(data.google_access_token && data.google_access_token !== 'undefined');
        const hasRef = !!(data.google_refresh_token && data.google_refresh_token !== 'undefined');
        
        console.log(`Consultant: ${data.display_name || 'No Name'} (${data.email})`);
        console.log(`- ID: ${doc.id}`);
        console.log(`- Access Token: ${hasAcc ? 'EXISTS' : 'MISSING'}`);
        console.log(`- Refresh Token: ${hasRef ? 'EXISTS' : 'MISSING'}`);
        console.log('------------------------------');
    });
}

checkConsultantTokens().catch(console.error);
