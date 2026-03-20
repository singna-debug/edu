const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^['\"]|['\"]$/g, '');
});

const sc = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
if (sc.private_key) sc.private_key = sc.private_key.replace(/\\n/g, '\n').replace(/"/g, '').trim();

initializeApp({
  credential: cert({
      projectId: sc.project_id,
      clientEmail: sc.client_email,
      privateKey: sc.private_key,
  })
});

const db = getFirestore();

async function run() {
    console.log('--- Final Token Identity Check ---');
    const s = await db.collection('consultants').get();
    s.forEach(d => {
        const data = d.data();
        console.log(`ID: ${d.id} (${data.email})`);
        
        const acc = data.google_access_token;
        const ref = data.google_refresh_token;

        if (acc) {
            console.log(`  Access: ${acc.substring(0, 10)}... (Type: ${acc.startsWith('ya29') ? 'GOOGLE' : 'FIREBASE'})`);
        } else {
            console.log('  Access: MISSING');
        }

        if (ref) {
            console.log(`  Refresh: ${ref.substring(0, 10)}... (Type: ${ref.startsWith('1/') ? 'GOOGLE' : 'FIREBASE'})`);
        } else {
            console.log('  Refresh: MISSING');
        }
    });
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
