const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Manually load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let val = match[2] ? match[2].trim() : '';
        if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
        if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
        env[match[1]] = val;
    }
});

const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON NOT FOUND');
    process.exit(1);
}

const sc = JSON.parse(serviceAccountJson);
let privateKey = sc.private_key || '';
if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();

initializeApp({
  credential: cert({
      projectId: sc.project_id,
      clientEmail: sc.client_email,
      privateKey: privateKey,
  })
});

const db = getFirestore();

async function checkTokensDetailed() {
    console.log('--- Checking Consultant Tokens (Old vs New Schema) ---');
    const snapshot = await db.collection('consultants').get();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id} (${data.email || 'N/A'})`);
        
        const google_acc = data.google_access_token;
        const google_ref = data.google_refresh_token;
        const old_acc = data.id_token;
        const old_ref = data.refreshToken;

        if (google_acc) console.log(`  google_access_token: ${google_acc.substring(0, 5)}... (${google_acc.startsWith('ya29') ? 'GOOGLE' : 'WRONG'})`);
        if (google_ref) console.log(`  google_refresh_token: ${google_ref.substring(0, 5)}... (${google_ref.startsWith('1/') ? 'GOOGLE' : 'WRONG'})`);
        if (old_acc) console.log(`  id_token: ${old_acc.substring(0, 5)}... (${old_acc.startsWith('ya29') ? 'GOOGLE' : 'JWT'})`);
        if (old_ref) console.log(`  refreshToken: ${old_ref.substring(0, 5)}... (${old_ref.startsWith('1/') ? 'GOOGLE' : 'FIREBASE'})`);
        
        const allKeys = Object.keys(data);
        console.log(`  Available Keys: ${allKeys.join(', ')}`);
    });
}

checkTokensDetailed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
