
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function approveUser(email) {
  console.log(`Searching for user with email: ${email}`);
  const snapshot = await db.collection('consultants').where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('No matching user found.');
    return;
  }

  const doc = snapshot.docs[0];
  console.log(`Found user: ${doc.id}. Setting approved: true`);
  
  await doc.ref.update({ approved: true });
  console.log('Approval successful!');
}

const targetEmail = 'lg01056096399@gmail.com';
approveUser(targetEmail).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
