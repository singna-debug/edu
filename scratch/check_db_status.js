
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkStatus() {
    console.log('--- DB Status Check ---');
    
    // 1. Pending Consultants
    const consultants = await db.collection('consultants').where('approved', '==', false).get();
    console.log(`Pending Consultants: ${consultants.size}`);
    consultants.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.display_name} (${data.email}) [ID: ${doc.id}]`);
    });

    // 2. Managers
    const managers = await db.collection('managers').get();
    console.log(`\nManagers: ${managers.size}`);
    managers.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.email} -> Parent: ${data.parentId}`);
    });
}

checkStatus().catch(console.error);
